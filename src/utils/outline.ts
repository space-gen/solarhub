export type Point = [number, number];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MASK_SIZE = 1024;
const MAX_POINTS = 48;
const NEIGHBOURS: Point[] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];





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




export function circleAround(outline: Point[]) {
  const x = outline.reduce((sum, point) => sum + point[0], 0) / outline.length;
  const y = outline.reduce((sum, point) => sum + point[1], 0) / outline.length;
  const r = Math.max(...outline.map(point => Math.hypot(point[0] - x, point[1] - y)));
  return { x: Math.round(x), y: Math.round(y), r: Math.max(8, Math.min(300, Math.ceil(r))) };
}


