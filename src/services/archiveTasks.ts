/**
 * Works out research pictures from NASA's SDO browse archive, newest first, walking back in time.
 * Everyone starts on ARCHIVE_START and goes back to ARCHIVE_END. Aurora re-checks every answer,
 * so nothing here is trusted; it only decides what to show next.
 */
import type { AuroraTask } from '@/services/auroraService';
import type { TaskType } from '@/services/annotationService';

export const ARCHIVE_START = '2026-11-20';
export const ARCHIVE_END = '2016-10-01';
export const ANSWERS_WANTED = 3;
// Every eighth frame, about 15 a day: neighbouring frames are near copies of each other.
const FRAME_STEP = 8;
// Stop looking after this many empty days in one go, so a long archive gap cannot hang the page.
const MAX_DAYS_PER_BATCH = 60;
const BROWSE = 'https://sdo.gsfc.nasa.gov/assets/img/browse';
const COUNTS = 'https://raw.githubusercontent.com/space-gen/aurora/data/data/answered';

export const ARCHIVE_CODES: Partial<Record<TaskType, string>> = { aia_193: '0193', aia_211: '0211', aia_304: '0304' };

const NAME = /^(\d{4})(\d{2})(\d{2})_(\d{6})_1024_(\d{4})\.jpg$/;
const ID = /^aia(\d+)-(\d{4})(\d{2})(\d{2})(\d{6})$/;

export type DayLister = (date: string, code: string) => Promise<string[]>;

/** "aia193-20261117110805" names exactly one archive picture, so it doubles as the saved place. */
export function archiveId(code: string, name: string): string | null {
  const match = NAME.exec(name);
  if (!match || match[5] !== code) return null;
  return `aia${Number(code)}-${match[1]}${match[2]}${match[3]}${match[4]}`;
}

export function urlFromId(id: string): string | null {
  const match = ID.exec(id);
  if (!match) return null;
  const [, wavelength, year, month, day, time] = match;
  return `${BROWSE}/${year}/${month}/${day}/${year}${month}${day}_${time}_1024_${wavelength.padStart(4, '0')}.jpg`;
}

function dateOfId(id: string): string | null {
  const match = ID.exec(id);
  return match ? `${match[2]}-${match[3]}-${match[4]}` : null;
}

export function dayBefore(date: string): string {
  const moment = new Date(`${date}T00:00:00Z`);
  moment.setUTCDate(moment.getUTCDate() - 1);
  return moment.toISOString().slice(0, 10);
}

function task(kind: TaskType, id: string): AuroraTask {
  const url = urlFromId(id)!;
  const date = dateOfId(id)!;
  return {
    id,
    filename: url.split('/').pop()!,
    url,
    taskType: kind,
    date,
    source: 'SDO_AIA_BROWSE',
    // Days since the start, so numbers stay stable for everyone.
    serialNumber: Math.round((Date.parse(`${ARCHIVE_START}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86400000) + 1,
  };
}

export const listDay: DayLister = async (date, code) => {
  const response = await fetch(`/api/sdo/list/${date.replace(/-/g, '/')}/${code}.json`);
  if (!response.ok) throw new Error(`listing ${date} failed: ${response.status}`);
  const names: unknown = await response.json();
  return Array.isArray(names) ? names.filter((name): name is string => typeof name === 'string') : [];
};

/** How many answers Aurora has accepted for each picture; empty if the list cannot be read. */
export async function answerCounts(kind: TaskType): Promise<Record<string, number>> {
  try {
    const response = await fetch(`${COUNTS}/${kind}.json`, { cache: 'no-store' });
    if (!response.ok) return {};
    const counts: unknown = await response.json();
    return counts && typeof counts === 'object' ? (counts as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/**
 * The next pictures strictly older than `afterId` (or from the start), skipping any `skip` says no to.
 * Returns fewer than `want` only when the archive end is reached or too many days were empty.
 */
export async function nextArchiveTasks(
  kind: TaskType,
  afterId: string | null,
  skip: (id: string) => boolean,
  want: number,
  list: DayLister = listDay,
): Promise<{ tasks: AuroraTask[]; finished: boolean; cursor: string | null }> {
  const code = ARCHIVE_CODES[kind];
  if (!code) return { tasks: [], finished: true, cursor: afterId };
  const cursor = afterId && ID.test(afterId) && afterId.startsWith(`aia${Number(code)}-`) ? afterId : null;
  let date = cursor ? dateOfId(cursor)! : ARCHIVE_START;
  if (date > ARCHIVE_START) date = ARCHIVE_START;
  const tasks: AuroraTask[] = [];
  let scanned: string | null = null;
  for (let days = 0; days < MAX_DAYS_PER_BATCH && tasks.length < want; days++, date = dayBefore(date)) {
    if (date < ARCHIVE_END) return { tasks, finished: true, cursor: null };
    scanned = date;
    const names = await list(date, code);
    const ids = names
      .filter((_, index) => index % FRAME_STEP === 0)
      .map(name => archiveId(code, name))
      .filter((id): id is string => id !== null)
      .reverse();
    for (const id of ids) {
      // Ids sort by time, so "older than the cursor" is a plain string comparison.
      if (cursor && id >= cursor) continue;
      if (!skip(id)) tasks.push(task(kind, id));
      if (tasks.length === want) break;
    }
  }
  // With nothing new found, the next batch starts before the last day looked at, not back at the same days.
  const next = tasks.length === want ? tasks[tasks.length - 1].id : scanned ? `aia${Number(code)}-${scanned.replace(/-/g, '')}000000` : afterId;
  return { tasks, finished: false, cursor: next };
}
