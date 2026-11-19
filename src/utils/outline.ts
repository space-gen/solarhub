export type Point = [number, number];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Raster extends Box {
  data: ArrayLike<number>;
}

interface Outlined {
  x: number;
  y: number;
  r: number;
  label: string | null;
  edited?: boolean;
  added?: boolean;
  deleted?: boolean;
  drawn?: boolean;
  merged?: boolean;
  partOfLarger?: boolean;
  outline?: Point[];
}

const MASK_SIZE = 1024;
const MAX_POINTS = 48;
const MIN_EDGE_CONTRAST = 0.8;
const EDGE_SMOOTHING = 3;
export const JOIN_SHARE = 0.3;
// When one shape mostly contains the other, the drawing is a new edge rather than an extension.
const REPLACE_SHARE = 0.7;
const MIN_TOUCH_SHARE = 0.05;
const NEIGHBOURS: Point[] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

export function circlePolygon(x: number, y: number, r: number, count = 24): Point[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return [Math.round(x + Math.cos(angle) * r), Math.round(y + Math.sin(angle) * r)];
  });
}

function maskOf(polygon: Point[], box: Box): Uint8Array {
  const mask = new Uint8Array(box.width * box.height);
  for (let row = 0; row < box.height; row++) {
    const y = box.y + row + 0.5;
    const crossings: number[] = [];
    polygon.forEach(([ax, ay], index) => {
      const [bx, by] = polygon[(index + 1) % polygon.length];
      if ((ay <= y) !== (by <= y)) crossings.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
    });
    crossings.sort((a, b) => a - b);
    for (let pair = 0; pair + 1 < crossings.length; pair += 2) {
      const from = Math.max(0, Math.ceil(crossings[pair] - box.x - 0.5));
      const to = Math.min(box.width - 1, Math.floor(crossings[pair + 1] - box.x - 0.5));
      for (let column = from; column <= to; column++) mask[row * box.width + column] = 1;
    }
  }
  return mask;
}

function boxMean(data: ArrayLike<number>, width: number, height: number, radius: number): Float32Array {
  const sums = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      sums[(y + 1) * (width + 1) + x + 1] = data[y * width + x] + sums[y * (width + 1) + x + 1] + sums[(y + 1) * (width + 1) + x] - sums[y * (width + 1) + x];
    }
  }
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const top = Math.max(0, y - radius);
    const bottom = Math.min(height, y + radius + 1);
    for (let x = 0; x < width; x++) {
      const left = Math.max(0, x - radius);
      const right = Math.min(width, x + radius + 1);
      const total = sums[bottom * (width + 1) + right] - sums[top * (width + 1) + right] - sums[bottom * (width + 1) + left] + sums[top * (width + 1) + left];
      out[y * width + x] = total / ((bottom - top) * (right - left));
    }
  }
  return out;
}

function otsu(values: number[]): number {
  const bins = new Array<number>(256).fill(0);
  values.forEach(value => { bins[Math.max(0, Math.min(255, Math.round(value)))]++; });
  const total = values.length;
  const sum = bins.reduce((acc, count, index) => acc + count * index, 0);
  let below = 0;
  let belowSum = 0;
  let best = 0;
  let threshold = 127;
  for (let index = 0; index < 256; index++) {
    below += bins[index];
    belowSum += index * bins[index];
    const above = total - below;
    if (!below || !above) continue;
    const gap = belowSum / below - (sum - belowSum) / above;
    const score = below * above * gap * gap;
    if (score > best) {
      best = score;
      threshold = index + 0.5;
    }
  }
  return threshold;
}

function bestComponent(mask: Uint8Array, width: number, weight?: Uint8Array): Uint8Array {
  const labels = new Int32Array(mask.length);
  let label = 0;
  let bestLabel = 0;
  let bestScore = 0;
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start]) continue;
    label++;
    let score = 0;
    const stack = [start];
    labels[start] = label;
    while (stack.length) {
      const at = stack.pop()!;
      score += weight ? weight[at] : 1;
      const x = at % width;
      const next = [x > 0 ? at - 1 : -1, x < width - 1 ? at + 1 : -1, at >= width ? at - width : -1, at + width < mask.length ? at + width : -1];
      for (const other of next) {
        if (other >= 0 && mask[other] && !labels[other]) {
          labels[other] = label;
          stack.push(other);
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestLabel = label;
    }
  }
  return Uint8Array.from(labels, value => (bestLabel && value === bestLabel ? 1 : 0));
}

function fillHoles(mask: Uint8Array, width: number, height: number): Uint8Array {
  const outside = new Uint8Array(mask.length);
  const stack: number[] = [];
  const visit = (at: number) => {
    if (!mask[at] && !outside[at]) {
      outside[at] = 1;
      stack.push(at);
    }
  };
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  while (stack.length) {
    const at = stack.pop()!;
    const x = at % width;
    if (x > 0) visit(at - 1);
    if (x < width - 1) visit(at + 1);
    if (at >= width) visit(at - width);
    if (at + width < mask.length) visit(at + width);
  }
  return Uint8Array.from(outside, value => 1 - value);
}

function traceEdge(mask: Uint8Array, box: Box): Point[] {
  const start = mask.indexOf(1);
  if (start < 0) return [];
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < box.width && y < box.height && mask[y * box.width + x] === 1;
  const first: Point = [start % box.width, Math.floor(start / box.width)];
  const path: Point[] = [first];
  let [x, y] = first;
  let heading = 6;
  for (let step = 0; step < mask.length * 2; step++) {
    let moved = false;
    for (let turn = 0; turn < 8; turn++) {
      const direction = (heading + 6 + turn) % 8;
      const [dx, dy] = NEIGHBOURS[direction];
      if (filled(x + dx, y + dy)) {
        x += dx;
        y += dy;
        heading = direction;
        moved = true;
        break;
      }
    }
    if (!moved || (x === first[0] && y === first[1])) break;
    path.push([x, y]);
  }
  return path.map(([px, py]) => [px + box.x + 0.5, py + box.y + 0.5]);
}

function simplifyRun(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const length = Math.hypot(bx - ax, by - ay) || 1;
  let far = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = Math.abs((bx - ax) * (ay - points[i][1]) - (ax - points[i][0]) * (by - ay)) / length;
    if (distance > far) {
      far = distance;
      index = i;
    }
  }
  if (far <= tolerance) return [points[0], points[points.length - 1]];
  return [...simplifyRun(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplifyRun(points.slice(index), tolerance)];
}

export function simplifyOutline(points: Point[]): Point[] {
  if (points.length < 4) return points.map(([x, y]) => [Math.round(x), Math.round(y)]);
  const opposite = points.reduce((best, point, index) => (
    Math.hypot(point[0] - points[0][0], point[1] - points[0][1]) > Math.hypot(points[best][0] - points[0][0], points[best][1] - points[0][1]) ? index : best
  ), 0);
  let tolerance = 1.5;
  let result = points;
  do {
    result = [...simplifyRun(points.slice(0, opposite + 1), tolerance).slice(0, -1), ...simplifyRun([...points.slice(opposite), points[0]], tolerance).slice(0, -1)];
    tolerance *= 1.4;
  } while (result.length > MAX_POINTS);
  return result.map(([x, y]) => [Math.round(x), Math.round(y)]);
}

/** Turns the finder's COCO compressed mask into a line that can be drawn and edited. */
export function outlineFromMask(text: string): Point[] | undefined {
  const counts: number[] = [];
  for (let at = 0; at < text.length;) {
    let value = 0;
    let shift = 0;
    let chunk: number;
    do {
      chunk = text.charCodeAt(at++) - 48;
      value |= (chunk & 0x1f) << shift;
      shift += 5;
    } while (chunk & 0x20);
    if (chunk & 0x10) value |= -1 << shift;
    counts.push(counts.length > 2 ? value + counts[counts.length - 2] : value);
  }
  const pixels: Point[] = [];
  let position = 0;
  counts.forEach((count, index) => {
    if (index % 2) {
      for (let pixel = position; pixel < Math.min(position + count, MASK_SIZE * MASK_SIZE); pixel++) {
        pixels.push([Math.floor(pixel / MASK_SIZE), pixel % MASK_SIZE]);
      }
    }
    position += count;
  });
  if (!pixels.length) return undefined;
  const x = Math.min(...pixels.map(point => point[0])) - 1;
  const y = Math.min(...pixels.map(point => point[1])) - 1;
  const box = { x, y, width: Math.max(...pixels.map(point => point[0])) - x + 2, height: Math.max(...pixels.map(point => point[1])) - y + 2 };
  const mask = new Uint8Array(box.width * box.height);
  pixels.forEach(([px, py]) => { mask[(py - y) * box.width + px - x] = 1; });
  const edge = traceEdge(mask, box);
  return edge.length >= 3 ? simplifyOutline(edge) : undefined;
}

/** Pulls a rough drawing onto the nearest real edge, or keeps the drawing if no clear edge exists. */
export function snapOutline(rough: Point[], image: Raster): Point[] {
  const fallback = simplifyOutline(rough);
  const { width, height } = image;
  const inside = maskOf(rough, image);
  const area = inside.reduce((sum, value) => sum + value, 0);
  if (area < 20) return fallback;
  const band = boxMean(inside, width, height, Math.max(8, Math.round(Math.sqrt(area) * 0.3)));
  const smooth = boxMean(image.data, width, height, Math.max(2, Math.round(Math.sqrt(area) * 0.05)));
  const within: number[] = [];
  let inSum = 0;
  let outSum = 0;
  smooth.forEach((value, index) => {
    if (band[index] <= 0) return;
    within.push(value);
    if (inside[index]) inSum += value;
    else outSum += value;
  });
  const outside = within.length - area;
  if (!outside) return fallback;
  const inMean = inSum / area;
  const outMean = outSum / outside;
  const mean = (inSum + outSum) / within.length;
  const spread = Math.sqrt(within.reduce((sum, value) => sum + (value - mean) ** 2, 0) / within.length);
  // Quiet Sun has no real edge, so following its texture would only make a jagged line.
  if (Math.abs(inMean - outMean) < spread * MIN_EDGE_CONTRAST) return fallback;
  const bright = inMean >= outMean;
  const threshold = otsu(within);
  const feature = Uint8Array.from(smooth, (value, index) => (band[index] > 0 && (bright ? value >= threshold : value <= threshold) ? 1 : 0));
  const found = fillHoles(bestComponent(feature, width, inside), width, height);
  const rounded = boxMean(found, width, height, EDGE_SMOOTHING);
  const shape = bestComponent(Uint8Array.from(rounded, value => (value >= 0.5 ? 1 : 0)), width, inside);
  const size = shape.reduce((sum, value) => sum + value, 0);
  if (size < area * 0.3 || size > area * 3) return fallback;
  const edge = traceEdge(shape, image);
  return edge.length >= 3 ? simplifyOutline(edge) : fallback;
}

function unionBox(a: Point[], b: Point[]): Box {
  const points = [...a, ...b];
  const x = Math.floor(Math.min(...points.map(point => point[0]))) - 1;
  const y = Math.floor(Math.min(...points.map(point => point[1]))) - 1;
  return { x, y, width: Math.ceil(Math.max(...points.map(point => point[0]))) - x + 2, height: Math.ceil(Math.max(...points.map(point => point[1]))) - y + 2 };
}

export function overlapShare(a: Point[], b: Point[]): number {
  const box = unionBox(a, b);
  const first = maskOf(a, box);
  const second = maskOf(b, box);
  let both = 0;
  let sizeA = 0;
  let sizeB = 0;
  first.forEach((value, index) => {
    sizeA += value;
    sizeB += second[index];
    both += value & second[index];
  });
  return both / Math.max(1, Math.min(sizeA, sizeB));
}

export function joinOutlines(a: Point[], b: Point[]): Point[] {
  const box = unionBox(a, b);
  const first = maskOf(a, box);
  const second = maskOf(b, box);
  const union = Uint8Array.from(first, (value, index) => value | second[index]);
  return simplifyOutline(traceEdge(fillHoles(bestComponent(union, box.width), box.width, box.height), box));
}

export function circleAround(outline: Point[]) {
  const x = outline.reduce((sum, point) => sum + point[0], 0) / outline.length;
  const y = outline.reduce((sum, point) => sum + point[1], 0) / outline.length;
  const r = Math.max(...outline.map(point => Math.hypot(point[0] - x, point[1] - y)));
  return { x: Math.round(x), y: Math.round(y), r: Math.max(8, Math.min(300, Math.ceil(r))) };
}

/** Joins a drawing to the ring it overlaps, or adds it as a new feature. */
export function addOutline<T extends Outlined>(marks: T[], outline: Point[]): { marks: T[]; joined: number | null } {
  let joined: number | null = null;
  let best = JOIN_SHARE;
  marks.forEach((mark, index) => {
    if (mark.deleted || mark.merged) return;
    const share = overlapShare(mark.outline ?? circlePolygon(mark.x, mark.y, mark.r), outline);
    if (share >= best) {
      best = share;
      joined = index;
    }
  });
  if (joined === null) {
    return { marks: [...marks, { ...circleAround(outline), label: null, added: true, outline } as T], joined };
  }
  return {
    joined,
    marks: marks.map((mark, index) => {
      if (index !== joined) return mark;
      const shape = mark.outline && best < REPLACE_SHARE ? joinOutlines(mark.outline, outline) : outline;
      return { ...mark, ...circleAround(shape), outline: shape, edited: !mark.added, drawn: true };
    }),
  };
}

/** Redraws one feature, or grows it to the whole structure and absorbs the pieces inside. */
export function reshapeMark<T extends Outlined>(marks: T[], index: number, outline: Point[], whole: boolean): T[] | null {
  const shapeOf = (mark: T) => mark.outline ?? circlePolygon(mark.x, mark.y, mark.r);
  const current = shapeOf(marks[index]);
  if (overlapShare(current, outline) < MIN_TOUCH_SHARE) return null;
  const shape = whole ? joinOutlines(current, outline) : outline;
  const circle = circleAround(shape);
  return marks.map((mark, position) => {
    if (position === index) {
      return { ...mark, ...circle, outline: shape, label: null, edited: !mark.added, drawn: true, partOfLarger: whole || mark.partOfLarger };
    }
    const absorbed = whole && !mark.deleted && !mark.merged && mark.r <= circle.r && overlapShare(shapeOf(mark), shape) >= REPLACE_SHARE;
    return absorbed ? { ...mark, merged: true, label: 'part_of_larger' } : mark;
  });
}
