/**
 * Works out research pictures from NASA's SDO browse archive, newest first, walking back in time.
 * Each contributor walks back from ARCHIVE_START or forward from ARCHIVE_END. Aurora re-checks every answer,
 * so nothing here is trusted; it only decides what to show next.
 */
import type { AuroraTask } from '@/services/auroraService';
import type { TaskType } from '@/services/annotationService';

export const ARCHIVE_START = '2026-11-20';
export const ARCHIVE_END = '2016-10-01';
// Every frame, so each feature can be tracked as it evolves.
const FRAME_STEP = 1;
// Stop looking after this many empty days in one go, so a long archive gap cannot hang the page.
const MAX_DAYS_PER_BATCH = 60;
const BROWSE = 'https://sdo.gsfc.nasa.gov/assets/img/browse';

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

export type Direction = 'back' | 'forward';

/**
 * A fair coin toss fixed by who is asking: half of contributors walk back from ARCHIVE_START,
 * half walk forward from ARCHIVE_END, and the two groups meet somewhere in between.
 */
export function directionFor(who: string): Direction {
  let hash = 0x811c9dc5;
  for (let i = 0; i < who.length; i++) hash = Math.imul(hash ^ who.toLowerCase().charCodeAt(i), 0x01000193);
  return (hash >>> 0) % 2 === 0 ? 'back' : 'forward';
}

function dayAfter(date: string): string {
  const moment = new Date(`${date}T00:00:00Z`);
  moment.setUTCDate(moment.getUTCDate() + 1);
  return moment.toISOString().slice(0, 10);
}

/**
 * The next pictures past `afterId` in `direction` (or from that direction's starting date),
 * skipping any `skip` says no to. Returns fewer than `want` only at the far end or after many empty days.
 */
export async function nextArchiveTasks(
  kind: TaskType,
  afterId: string | null,
  skip: (id: string) => boolean,
  want: number,
  direction: Direction = 'back',
  list: DayLister = listDay,
): Promise<{ tasks: AuroraTask[]; finished: boolean; cursor: string | null }> {
  const code = ARCHIVE_CODES[kind];
  if (!code) return { tasks: [], finished: true, cursor: afterId };
  const back = direction === 'back';
  const cursor = afterId && ID.test(afterId) && afterId.startsWith(`aia${Number(code)}-`) ? afterId : null;
  let date = cursor ? dateOfId(cursor)! : back ? ARCHIVE_START : ARCHIVE_END;
  if (date > ARCHIVE_START) date = ARCHIVE_START;
  if (date < ARCHIVE_END) date = ARCHIVE_END;
  const tasks: AuroraTask[] = [];
  let scanned: string | null = null;
  for (let days = 0; days < MAX_DAYS_PER_BATCH && tasks.length < want; days++, date = back ? dayBefore(date) : dayAfter(date)) {
    if (date < ARCHIVE_END || date > ARCHIVE_START) return { tasks, finished: true, cursor: null };
    scanned = date;
    const names = await list(date, code);
    const ids = names
      .filter((_, index) => index % FRAME_STEP === 0)
      .map(name => archiveId(code, name))
      .filter((id): id is string => id !== null);
    if (back) ids.reverse();
    for (const id of ids) {
      // Ids sort by time, so "past the cursor" is a plain string comparison.
      if (cursor && (back ? id >= cursor : id <= cursor)) continue;
      if (!skip(id)) tasks.push(task(kind, id));
      if (tasks.length === want) break;
    }
  }
  // With nothing new found, the next batch starts past the last day looked at, not on the same days again.
  const edge = back ? '000000' : '235959';
  const next = tasks.length === want ? tasks[tasks.length - 1].id : scanned ? `aia${Number(code)}-${scanned.replace(/-/g, '')}${edge}` : afterId;
  return { tasks, finished: false, cursor: next };
}
