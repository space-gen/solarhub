export type MarkKind =
  | 'sunspot' | 'magnetogram'
  | 'aia_94' | 'aia_131' | 'aia_171' | 'aia_193' | 'aia_211' | 'aia_304' | 'aia_335' | 'aia_1600' | 'aia_1700' | 'flare_source';

export const IMAGE_SIZE = 1024;

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
