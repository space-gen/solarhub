export type MarkKind =
  | 'sunspot' | 'magnetogram'
  | 'aia_94' | 'aia_131' | 'aia_171' | 'aia_193' | 'aia_211' | 'aia_304' | 'aia_335' | 'aia_1600' | 'aia_1700';
export type SpotCount = 'one' | 'many';
export type SpotEdge = 'none' | 'around' | 'one-side' | 'both-sides';
export type MagnetPattern = 'single' | 'side-by-side' | 'mixed';

export interface Mark {
  x: number;
  y: number;
  r: number;
  label: string | null;
}

export const IMAGE_SIZE = 1024;
export const MIN_RADIUS = 8;
// Measured from HMI 1k images: the disk sits in the same place in every frame.
export const SUN_DISK = { x: 511.5, y: 511.5, radius: 468 };
// HMI's disk changes slightly through the year. AIA's disk is smaller, and this also allows edge prominences.
const TAP_RADIUS = 478;

export function isOnSun(x: number, y: number): boolean {
  return Math.hypot(x - SUN_DISK.x, y - SUN_DISK.y) <= TAP_RADIUS;
}

export function findMarkAt(marks: Mark[], x: number, y: number): number {
  return marks.findIndex(mark => Math.hypot(mark.x - x, mark.y - y) <= Math.max(mark.r, 34));
}

/** East-west size of a group in heliographic degrees, used for Zurich classes D, E and F. */
export function groupLengthDegrees(x: number, y: number, r: number): number {
  const ny = Math.min(Math.abs(y - SUN_DISK.y) / SUN_DISK.radius, 0.98);
  const rowRadius = SUN_DISK.radius * Math.sqrt(1 - ny * ny);
  const lon = (px: number) => Math.asin(Math.max(-1, Math.min(1, (px - SUN_DISK.x) / rowRadius)));
  return ((lon(x + r) - lon(x - r)) * 180) / Math.PI;
}

export function sunspotLabel(count: SpotCount, edge: SpotEdge, mark: Pick<Mark, 'x' | 'y' | 'r'>): string {
  if (count === 'one') return edge === 'none' ? 'class_a' : 'class_h';
  if (edge === 'none') return 'class_b';
  if (edge === 'one-side') return 'class_c';
  const length = groupLengthDegrees(mark.x, mark.y, mark.r);
  if (length < 10) return 'class_d';
  return length <= 15 ? 'class_e' : 'class_f';
}

export function magnetLabel(pattern: MagnetPattern): string {
  return { single: 'alpha', 'side-by-side': 'beta', mixed: 'beta-gamma' }[pattern];
}

export function confidenceFor(marks: Mark[]): number {
  return marks.some(mark => mark.label === 'none') ? 40 : 80;
}

function reverseBits(value: number, bits: number): number {
  let result = 0;
  for (let i = 0; i < bits; i++) result = (result << 1) | ((value >> i) & 1);
  return result;
}

/** Spreads near-identical 15-minute frames apart, in the same order for every contributor. */
export function spreadOrder<T>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index, rank: reverseBits(index % 16, 4) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(entry => entry.item);
}

export function remainingAfter<T extends { id: string }>(ordered: T[], lastId: string | null, doneIds: Set<string>): T[] {
  const start = lastId ? ordered.findIndex(task => task.id === lastId) + 1 : 0;
  return ordered.slice(start).filter(task => !doneIds.has(task.id));
}
