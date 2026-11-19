/**
 * Browser copy of Aurora's finder (aurora/scripts/find_candidates.py) for the research channels:
 * whole dark regions in 193 and 211, and edge flames above the limb in 304.
 * Aurora reruns its own finder on every submitted image, so this only decides what people are shown.
 * Keep the constants and steps in step with the Python file.
 */
import type { TaskType } from '@/services/annotationService';

export const SIZE = 1024;
const CENTRE = 511.5;
const SOLAR_RADIUS = 395;
const FLATTEN_RADIUS = 455;
const DISK_SEARCH = 388;
const EDGE_SEARCH = 445;
const IMAGE_LIMIT = 500;
const MIN_RING = 24;
const REGION_RING = 150;
const MAX_FEATURES = 40;
const DARK_RATIOS = [0.45, 0.6];
const MIN_REGION_AREA = 250;
const REGIONS_PER_LEVEL = 6;
const OUTER_RING = 1.6;
const LIMB_START = 370;
const LIMB_BAND_RATIO = 3;
const SHAPE_MARGIN = 10;
const MIN_MASK_AREA = 40;
const MIN_WHOLE_SHARE = 0.8;

export interface Candidate { x: number; y: number; r: number; mask?: string; score?: number }

type Grid = Float32Array;
const N = SIZE * SIZE;

let radiusCache: Float32Array | null = null;
function radiusMap(): Float32Array {
  if (!radiusCache) {
    radiusCache = new Float32Array(N);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) radiusCache[y * SIZE + x] = Math.hypot(x - CENTRE, y - CENTRE);
  }
  return radiusCache;
}

function percentile(values: number[], q: number): number {
  const sorted = Float64Array.from(values).sort();
  const position = (q / 100) * (sorted.length - 1);
  const low = Math.floor(position);
  const high = Math.min(low + 1, sorted.length - 1);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

const median = (values: number[]) => percentile(values, 50);

/** Python's round() rounds halves to even. */
function roundHalfEven(value: number): number {
  const floor = Math.floor(value);
  const diff = value - floor;
  if (diff > 0.5) return floor + 1;
  if (diff < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

const clip = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Subtracts each ring's median, so edge features compete with disk features. */
function flatten(gray: Grid, radius: Float32Array): Grid {
  const rings: number[][] = Array.from({ length: FLATTEN_RADIUS }, () => []);
  for (let i = 0; i < N; i++) {
    const ring = Math.trunc(radius[i]);
    if (ring < FLATTEN_RADIUS) rings[ring].push(gray[i]);
  }
  const medians = rings.map(values => (values.length ? median(values) : 0));
  const flat = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const ring = Math.trunc(radius[i]);
    if (ring < FLATTEN_RADIUS) flat[i] = gray[i] - medians[ring];
  }
  return flat;
}

function kernel(sigma: number): Float64Array {
  const reach = Math.trunc(4 * sigma + 0.5);
  const weights = new Float64Array(2 * reach + 1);
  let sum = 0;
  for (let i = -reach; i <= reach; i++) sum += weights[i + reach] = Math.exp(-0.5 * (i / sigma) ** 2);
  return weights.map(weight => weight / sum);
}

/** scipy's default edge mode: reflect, mirroring including the edge pixel. */
function reflect(index: number, length: number): number {
  const period = 2 * length;
  let wrapped = ((index % period) + period) % period;
  if (wrapped >= length) wrapped = period - wrapped - 1;
  return wrapped;
}

function gaussian(values: Grid, width: number, height: number, sigma: number): Grid {
  const weights = kernel(sigma);
  const reach = (weights.length - 1) / 2;
  const rows = new Float32Array(values.length);
  for (let y = 0; y < height; y++) {
    const base = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -reach; k <= reach; k++) sum += weights[k + reach] * values[base + reflect(x + k, width)];
      rows[base + x] = sum;
    }
  }
  const out = new Float32Array(values.length);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      for (let k = -reach; k <= reach; k++) sum += weights[k + reach] * rows[reflect(y + k, height) * width + x];
      out[y * width + x] = sum;
    }
  }
  return out;
}

function blur(values: Grid, sigma: number, inside?: Uint8Array): Grid {
  if (!inside) return gaussian(values, SIZE, SIZE, sigma);
  // Ignore black space, so the solar edge does not look like a feature.
  const weight = gaussian(Float32Array.from(inside), SIZE, SIZE, sigma);
  const masked = new Float32Array(N);
  for (let i = 0; i < N; i++) masked[i] = inside[i] ? values[i] : 0;
  const smooth = gaussian(masked, SIZE, SIZE, sigma);
  for (let i = 0; i < N; i++) smooth[i] /= Math.max(weight[i], 1e-3);
  return smooth;
}

function band(values: Grid, fine: number, broad: number): Grid {
  const a = blur(values, fine);
  const b = blur(values, broad);
  for (let i = 0; i < N; i++) a[i] -= b[i];
  return a;
}

function robustScores(values: Grid, mask: Uint8Array): Grid {
  const sample: number[] = [];
  for (let i = 0; i < N; i++) if (mask[i]) sample.push(values[i]);
  const middle = median(sample);
  const spread = median(sample.map(value => Math.abs(value - middle))) * 1.4826 || 1;
  return values.map(value => (value - middle) / spread);
}

/** Labels the 4-connected component containing `start`; returns its pixel indices. */
function component(inside: (index: number) => boolean, start: number, seen: Uint8Array, width = SIZE, height = SIZE): number[] {
  const pixels = [start];
  seen[start] = 1;
  for (let head = 0; head < pixels.length; head++) {
    const index = pixels[head];
    const x = index % width;
    const neighbours = [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, index >= width ? index - width : -1, index < width * (height - 1) ? index + width : -1];
    for (const next of neighbours) {
      if (next >= 0 && !seen[next] && inside(next)) {
        seen[next] = 1;
        pixels.push(next);
      }
    }
  }
  return pixels;
}

/** COCO compressed RLE, column-major, the same text Aurora and pycocotools use. */
export function encodeMask(pixels: Iterable<[number, number]>): string {
  const index = [...new Set([...pixels].map(([x, y]) => x * SIZE + y))].sort((a, b) => a - b);
  const counts: number[] = [];
  let end = 0;
  for (let i = 0; i < index.length; ) {
    let j = i;
    while (j + 1 < index.length && index[j + 1] === index[j] + 1) j++;
    counts.push(index[i] - end, index[j] + 1 - index[i]);
    end = index[j] + 1;
    i = j + 1;
  }
  if (end < N) counts.push(N - end);
  let text = '';
  counts.forEach((count, position) => {
    let value = position > 2 ? count - counts[position - 2] : count;
    for (;;) {
      const chunk = value & 0x1f;
      value >>= 5;
      const more = chunk & 0x10 ? value !== -1 : value !== 0;
      text += String.fromCharCode(chunk + 48 + (more ? 0x20 : 0));
      if (!more) break;
    }
  });
  return text;
}

export function decodeMask(text: string): Uint8Array {
  const counts: number[] = [];
  for (let position = 0; position < text.length; ) {
    let value = 0;
    let shift = 0;
    for (;;) {
      const chunk = text.charCodeAt(position++) - 48;
      value |= (chunk & 0x1f) << shift;
      shift += 5;
      if (!(chunk & 0x20)) {
        if (chunk & 0x10) value |= -1 << shift;
        break;
      }
    }
    counts.push(counts.length > 2 ? value + counts[counts.length - 2] : value);
  }
  const mask = new Uint8Array(N);
  let at = 0;
  counts.forEach((count, i) => {
    if (i % 2 === 1) for (let k = at; k < at + count; k++) mask[(k % SIZE) * SIZE + Math.floor(k / SIZE)] = 1;
    at += count;
  });
  return mask;
}

/** Smooths a detected region into one solid shape, keeping its uneven edge. */
function featureMask(xs: number[], ys: number[]): string | undefined {
  // Loops, not Math.min(...xs): large regions would overflow the argument limit.
  const low = (values: number[]) => values.reduce((a, b) => Math.min(a, b), Infinity);
  const high = (values: number[]) => values.reduce((a, b) => Math.max(a, b), -Infinity);
  const left = low(xs) - SHAPE_MARGIN;
  const top = low(ys) - SHAPE_MARGIN;
  const width = high(xs) - left + SHAPE_MARGIN + 1;
  const height = high(ys) - top + SHAPE_MARGIN + 1;
  const grid = new Uint8Array(width * height);
  xs.forEach((x, i) => { grid[(ys[i] - top) * width + x - left] = 1; });
  // Fill holes: background not reachable from the border becomes inside.
  const outside = new Uint8Array(width * height);
  for (let i = 0; i < grid.length; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    if ((x === 0 || y === 0 || x === width - 1 || y === height - 1) && !grid[i] && !outside[i]) component(j => !grid[j], i, outside, width, height);
  }
  const filled = new Float32Array(grid.length);
  let area = 0;
  for (let i = 0; i < grid.length; i++) area += filled[i] = outside[i] ? 0 : 1;
  const smooth = gaussian(filled, width, height, clip(Math.sqrt(area) * 0.05, 1, 4));
  const seen = new Uint8Array(grid.length);
  let largest: number[] = [];
  for (let i = 0; i < grid.length; i++) {
    if (smooth[i] >= 0.5 && !seen[i]) {
      const pixels = component(j => smooth[j] >= 0.5, i, seen, width, height);
      if (pixels.length > largest.length) largest = pixels;
    }
  }
  const pixels: Array<[number, number]> = [];
  for (const i of largest) {
    const x = (i % width) + left;
    const y = Math.floor(i / width) + top;
    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) pixels.push([x, y]);
  }
  return pixels.length >= MIN_MASK_AREA ? encodeMask(pixels) : undefined;
}

function canKeep(mark: Candidate, kept: Candidate[]): boolean {
  // Drop a core at the centre of a larger ring, but keep a separate feature beside it.
  return kept.every(other => Math.hypot(mark.x - other.x, mark.y - other.y) >= 0.45 * Math.max(other.r, mark.r) + 0.35 * Math.min(other.r, mark.r));
}

/** Measures whole regions directly, because large or edge features hide from band filters. */
function regions(levels: Uint8Array[], radius: Float32Array): Candidate[] {
  const marks: Candidate[] = [];
  for (const level of levels) {
    const seen = new Uint8Array(N);
    const found: number[][] = [];
    for (let i = 0; i < N; i++) if (level[i] && !seen[i]) found.push(component(j => level[j] === 1, i, seen));
    found.sort((a, b) => b.length - a.length);
    for (const pixels of found.slice(0, REGIONS_PER_LEVEL)) {
      if (pixels.length < MIN_REGION_AREA) break;
      const xs = pixels.map(i => i % SIZE);
      const ys = pixels.map(i => Math.floor(i / SIZE));
      const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
      const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
      // A curved region's average position can fall outside it, so use its nearest pixel.
      let nearest = 0;
      for (let i = 1; i < xs.length; i++) if (Math.hypot(xs[i] - meanX, ys[i] - meanY) < Math.hypot(xs[nearest] - meanX, ys[nearest] - meanY)) nearest = i;
      const x = xs[nearest];
      const y = ys[nearest];
      const ring = percentile(xs.map((px, i) => Math.hypot(px - x, ys[i] - y)), 92) * 1.08 + 8;
      const room = IMAGE_LIMIT - radius[y * SIZE + x];
      const mark: Candidate = { x, y, r: clip(roundHalfEven(Math.min(ring, room)), MIN_RING, REGION_RING) };
      if (canKeep(mark, marks)) {
        const shape = featureMask(xs, ys);
        marks.push(shape ? { ...mark, mask: shape } : mark);
      }
    }
  }
  return marks;
}

function slidingMax(values: Grid, size: number): Grid {
  const half = Math.floor(size / 2);
  const rows = new Float32Array(N);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let best = -Infinity;
      for (let k = -half; k <= half; k++) best = Math.max(best, values[y * SIZE + reflect(x + k, SIZE)]);
      rows[y * SIZE + x] = best;
    }
  }
  return rows;
}

/** Peaks in a filtered signal, each grown into its region (Python `_features`). */
function features(signal: Grid, mask: Uint8Array, threshold: number, limit: number, spacing: number, maxRing: number): Candidate[] {
  const score = robustScores(signal, mask);
  const rows = slidingMax(score, spacing | 1);
  const half = Math.floor((spacing | 1) / 2);
  const peaks: number[] = [];
  for (let i = 0; i < N; i++) {
    if (!mask[i] || score[i] < threshold) continue;
    const x = i % SIZE;
    const y = Math.floor(i / SIZE);
    let best = -Infinity;
    for (let k = -half; k <= half; k++) best = Math.max(best, rows[reflect(y + k, SIZE) * SIZE + x]);
    if (score[i] === best) peaks.push(i);
  }
  peaks.sort((a, b) => score[b] - score[a]);
  const marks: Candidate[] = [];
  for (const peak of peaks) {
    const px = peak % SIZE;
    const py = Math.floor(peak / SIZE);
    const level = Math.max(threshold * 0.65, score[peak] * 0.38);
    const pixels = component(j => mask[j] === 1 && score[j] >= level, peak, new Uint8Array(N));
    const near = pixels.filter(i => Math.hypot((i % SIZE) - px, Math.floor(i / SIZE) - py) <= maxRing);
    // A region cut off by the search limit has no real edge there, so its shape is not trustworthy.
    const whole = near.length / pixels.length >= MIN_WHOLE_SHARE;
    const xs = near.map(i => i % SIZE);
    const ys = near.map(i => Math.floor(i / SIZE));
    const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
    const ring = percentile(xs.map((x, i) => Math.hypot(x - cx, ys[i] - cy)), 92) * 1.08 + 8;
    const room = IMAGE_LIMIT - Math.hypot(cx - CENTRE, cy - CENTRE);
    const mark: Candidate = { x: roundHalfEven(cx), y: roundHalfEven(cy), r: clip(roundHalfEven(Math.min(ring, room)), MIN_RING, maxRing) };
    if (canKeep(mark, marks)) {
      const shape = whole ? featureMask(xs, ys) : undefined;
      marks.push(shape ? { ...mark, mask: shape } : mark);
      if (marks.length === limit) break;
    }
  }
  return marks;
}

/** Spots a long thin strip along the solar edge, which is limb glow rather than a feature. */
function hugsLimb(mask: Uint8Array): boolean {
  const dx: number[] = [];
  const dy: number[] = [];
  for (let i = 0; i < N; i++) if (mask[i]) { dx.push((i % SIZE) - CENTRE); dy.push(Math.floor(i / SIZE) - CENTRE); }
  const distance = dx.map((x, i) => Math.hypot(x, dy[i]));
  if (median(distance) < LIMB_START) return false;
  const meanAngle = Math.atan2(dy.reduce((a, b) => a + b, 0) / dy.length, dx.reduce((a, b) => a + b, 0) / dx.length);
  const offset = dx.map((x, i) => ((((Math.atan2(dy[i], x) - meanAngle + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI);
  const along = (percentile(offset, 95) - percentile(offset, 5)) * median(distance);
  const across = percentile(distance, 95) - percentile(distance, 5) + 1;
  return along > LIMB_BAND_RATIO * across;
}

/** Orders features by how strongly they stand out in the channel people are looking at. */
function rank(marks: Candidate[], flat: Grid, disk: Uint8Array, sign: number): Candidate[] {
  const sample: number[] = [];
  for (let i = 0; i < N; i++) if (disk[i]) sample.push(flat[i]);
  const middle = median(sample);
  const spread = median(sample.map(value => Math.abs(value - middle))) * 1.4826 || 1;
  const ranked: Candidate[] = [];
  for (const mark of marks) {
    const shape = mark.mask ? decodeMask(mark.mask) : null;
    if (sign >= 0 && shape && hugsLimb(shape)) continue;
    const reach = Math.trunc(mark.r * OUTER_RING) + 2;
    const top = Math.max(0, mark.y - reach);
    const left = Math.max(0, mark.x - reach);
    const bottom = Math.min(SIZE, mark.y + reach + 1);
    const right = Math.min(SIZE, mark.x + reach + 1);
    const width = right - left;
    const inner = new Uint8Array(width * (bottom - top));
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      inner[(y - top) * width + x - left] = shape ? shape[y * SIZE + x] : Math.hypot(x - mark.x, y - mark.y) <= mark.r * 0.7 ? 1 : 0;
    }
    // Six steps of a 4-connected dilation reach every pixel within city-block distance 6, clipped to the window.
    const grown = new Uint8Array(inner.length);
    const height = bottom - top;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (!inner[y * width + x]) continue;
      for (let ky = -6; ky <= 6; ky++) for (let kx = -6 + Math.abs(ky); kx <= 6 - Math.abs(ky); kx++) {
        const gx = x + kx;
        const gy = y + ky;
        if (gx >= 0 && gx < width && gy >= 0 && gy < height) grown[gy * width + gx] = 1;
      }
    }
    let inSum = 0, inCount = 0, outSum = 0, outCount = 0;
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      const local = (y - top) * width + x - left;
      const value = flat[y * SIZE + x];
      if (inner[local]) { inSum += value; inCount++; }
      else if (!grown[local] && Math.hypot(x - mark.x, y - mark.y) <= mark.r * OUTER_RING) { outSum += value; outCount++; }
    }
    let contrast = inCount && outCount ? (inSum / inCount - outSum / outCount) / spread : 0;
    contrast = sign === 0 ? Math.abs(contrast) : contrast * sign;
    ranked.push({ ...mark, score: Math.round(contrast * Math.sqrt(inCount) * 10) / 100 });
  }
  return ranked.sort((a, b) => b.score! - a.score!);
}

const mask = (test: (i: number) => boolean) => { const out = new Uint8Array(N); for (let i = 0; i < N; i++) out[i] = test(i) ? 1 : 0; return out; };

/** Proposals for one 1024 x 1024 grey image, strongest first. Empty for channels without a finder. */
export function findCandidates(gray: Grid, kind: TaskType): Candidate[] {
  const radius = radiusMap();
  const disk = mask(i => radius[i] < DISK_SEARCH);
  const flat = flatten(gray, radius);
  let marks: Candidate[];
  if (kind === 'aia_193' || kind === 'aia_211') {
    // Whole dark regions match HEK coronal holes; thin filaments are drawn by people.
    const sun = mask(i => radius[i] < SOLAR_RADIUS);
    const smooth = blur(gray, 4, sun);
    const darkness = smooth.map((value, i) => value / Math.max(gray[i] - flat[i], 1));
    const levels = DARK_RATIOS.map(ratio => mask(i => darkness[i] < ratio && sun[i] === 1 && radius[i] < DISK_SEARCH));
    marks = rank(regions(levels, radius), flat, disk, -1);
  } else if (kind === 'aia_304') {
    // Prominences above the limb; a find without a clear edge was sky glow in every case checked.
    const edge = mask(i => radius[i] > 398 && radius[i] < EDGE_SEARCH);
    marks = rank(features(band(flat, 3, 22), edge, 2.0, 10, 45, 58), flat, disk, 0).filter(mark => mark.mask);
  } else {
    return [];
  }
  return marks.filter(mark => mark.score! >= 0).slice(0, MAX_FEATURES);
}
