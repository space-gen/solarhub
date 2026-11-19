import type { Point } from './outline';

export type MarkKind =
  | 'sunspot' | 'magnetogram'
  | 'aia_94' | 'aia_131' | 'aia_171' | 'aia_193' | 'aia_211' | 'aia_304' | 'aia_335' | 'aia_1600' | 'aia_1700' | 'flare_source';
export type SpotCount = 'one' | 'many';
export type SpotEdge = 'none' | 'around' | 'one-side' | 'both-sides';
export type MagnetPattern = 'single' | 'side-by-side' | 'mixed';

export interface Mark {
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
  finder?: { x: number; y: number; r: number };
}

export const IMAGE_SIZE = 1024;
export const MIN_RADIUS = 8;
const SECTION_GRID = 3;
const SECTION_START = 96;
const SECTION_SIZE = 416;
const SECTION_STEP = 208;
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

function contributorHash(contributor: string, taskId: string): number {
  let hash = 2166136261;
  for (const character of `${contributor}:${taskId}`) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
}

/** Gives each person a small, repeatable share so many people cover and cross-check an image. */
export function pickForContributor<T>(items: T[], contributor: string, taskId: string, count = 4): T[] {
  if (items.length <= count) return items;
  const start = contributorHash(contributor, taskId) % items.length;
  return Array.from({ length: count }, (_, index) => items[(start + index) % items.length]);
}

export interface Section {
  index: number;
  x: number;
  y: number;
  size: number;
}

export const SECTION_COUNT = SECTION_GRID * SECTION_GRID;

/** Half-overlapping parts, so a feature cut by one part's edge sits whole inside its neighbour. */
export const SECTIONS: Section[] = Array.from({ length: SECTION_COUNT }, (_, index) => ({
  index,
  x: SECTION_START + (index % SECTION_GRID) * SECTION_STEP,
  y: SECTION_START + Math.floor(index / SECTION_GRID) * SECTION_STEP,
  size: SECTION_SIZE,
}));

export function isInsideSection(section: Section, x: number, y: number, r = 0): boolean {
  return x - r >= section.x && y - r >= section.y && x + r <= section.x + section.size && y + r <= section.y + section.size;
}

function nearestSection(mark: Pick<Mark, 'x' | 'y'>): Section {
  const distance = (section: Section) => Math.hypot(section.x + section.size / 2 - mark.x, section.y + section.size / 2 - mark.y);
  return SECTIONS.reduce((best, section) => (distance(section) < distance(best) ? section : best));
}

/** Picks one part of the Sun for this person, with the rings that fit inside it. */
export function pickSection<T extends Pick<Mark, 'x' | 'y' | 'r'>>(items: T[], contributor: string, taskId: string, count = 4) {
  const filled = SECTIONS.map(section => ({
    section,
    // A ring too large for every part still belongs with the closest one.
    items: items.filter(item => isInsideSection(section, item.x, item.y, item.r)
      || (!SECTIONS.some(other => isInsideSection(other, item.x, item.y, item.r)) && nearestSection(item) === section)),
  })).filter(entry => entry.items.length);
  const chosen = filled[contributorHash(contributor, taskId) % filled.length];
  // Items arrive strongest first. One rotating place still gets weaker finds checked.
  const shown = chosen.items.length <= count
    ? chosen.items
    : [...chosen.items.slice(0, count - 1), ...pickForContributor(chosen.items.slice(count - 1), contributor, taskId, 1)];
  return { section: chosen.section, items: shown };
}

/** A wider view for tracing a feature that does not fit inside the person's part. */
export function viewAround(mark: Pick<Mark, 'x' | 'y' | 'r'>, section: Section): Section {
  const size = Math.min(IMAGE_SIZE, Math.round(Math.max(section.size * 1.5, mark.r * 4)));
  const place = (value: number) => Math.round(Math.max(0, Math.min(IMAGE_SIZE - size, value - size / 2)));
  return { index: section.index, x: place(mark.x), y: place(mark.y), size };
}

/** Moves or resizes a ring while keeping its centre inside the close-up. */
export function adjustedMark<T extends Mark>(mark: T, change: Partial<Pick<Mark, 'x' | 'y' | 'r'>>, box: { x: number; y: number; size: number }): T {
  const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
  const x = clamp(change.x ?? mark.x, box.x, box.x + box.size);
  const y = clamp(change.y ?? mark.y, box.y, box.y + box.size);
  const r = clamp(change.r ?? mark.r, MIN_RADIUS, box.size / 2 - 6);
  const scale = r / mark.r;
  const outline = mark.outline?.map(([px, py]): Point => [
    Math.round(x + (px - mark.x) * scale),
    Math.round(y + (py - mark.y) * scale),
  ]);
  return { ...mark, x, y, r, ...(outline ? { outline } : {}) };
}

function reviewAction(mark: Mark): string {
  if (mark.added) return 'added';
  if (mark.deleted) return 'deleted';
  if (mark.merged) return 'merged';
  if (mark.drawn) return 'outlined';
  if (mark.edited) return 'moved';
  return mark.label === 'none' ? 'rejected' : 'confirmed';
}

/** Records what the finder proposed and what the person did with it. */
export function buildReview(marks: Mark[], section: Section) {
  return {
    v: 1,
    part: section.index + 1,
    parts: SECTION_COUNT,
    rings: marks.map(mark => ({
      action: reviewAction(mark),
      label: mark.deleted ? null : mark.label,
      finder: mark.finder ? [mark.finder.x, mark.finder.y, mark.finder.r] : null,
      ring: [Math.round(mark.x), Math.round(mark.y), Math.round(mark.r)],
      // An untouched finder shape is already stored by Aurora.
      ...(mark.outline && (mark.added || mark.edited) ? { outline: mark.outline } : {}),
      ...(mark.partOfLarger ? { part_of_larger: true } : {}),
    })),
  };
}

export function remainingAfter<T extends { id: string }>(ordered: T[], lastId: string | null, doneIds: Set<string>): T[] {
  const start = lastId ? ordered.findIndex(task => task.id === lastId) + 1 : 0;
  return ordered.slice(start).filter(task => !doneIds.has(task.id));
}
