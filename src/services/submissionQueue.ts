import { submitAnnotation, type AnnotationInput } from '@/services/annotationService';
import { markTaskCompletedForToday } from '@/services/dailyProgressService';
import { getStoredToken, getStoredUser } from '@/services/githubAuthService';

const QUEUE_KEY = 'solarhub_pending_annotations';
const DONE_KEY = 'solarhub_done_ids';
const TODAY_KEY = 'solarhub_today';
const MAX_DONE_IDS = 1000;
const SEND_GAP_MS = 1200; // Keeps bursts below GitHub's secondary rate limits.

let flushing = false;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing can block storage; the session still works.
  }
}

function changed() {
  window.dispatchEvent(new Event('solarhub:queue-changed'));
}

export function pendingCount(): number {
  return read<AnnotationInput[]>(QUEUE_KEY, []).length;
}

export function doneIds(): Set<string> {
  return new Set(read<string[]>(DONE_KEY, []));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function doneToday(): number {
  const today = read(TODAY_KEY, { date: '', count: 0 });
  return today.date === todayKey() ? today.count : 0;
}

export function saveAnnotation(input: AnnotationInput) {
  const queue = read<AnnotationInput[]>(QUEUE_KEY, []);
  if (!queue.some(item => item.task_id === input.task_id)) write(QUEUE_KEY, [...queue, input]);
  write(DONE_KEY, [...doneIds(), input.task_id].slice(-MAX_DONE_IDS));
  write(TODAY_KEY, { date: todayKey(), count: doneToday() + 1 });
  changed();
  void flushQueue();
}

export async function flushQueue() {
  if (flushing || !getStoredToken() || !getStoredUser()) return;
  flushing = true;
  try {
    for (;;) {
      const [next] = read<AnnotationInput[]>(QUEUE_KEY, []);
      if (!next) return;
      const result = await submitAnnotation(next);
      // A 422 can never succeed on retry. Anything else stays queued for later.
      if (!result.success && !result.error?.includes('GitHub API 422')) return;
      write(QUEUE_KEY, read<AnnotationInput[]>(QUEUE_KEY, []).filter(item => item.task_id !== next.task_id));
      changed();
      if (result.success) {
        try {
          const { progress } = await markTaskCompletedForToday(next.task_id, next.task_type);
          window.dispatchEvent(new CustomEvent('solarhub:progress', { detail: progress }));
        } catch (err) {
          console.warn('[Queue] Progress did not sync:', err);
        }
      }
      await new Promise(resolve => window.setTimeout(resolve, SEND_GAP_MS));
    }
  } finally {
    flushing = false;
  }
}
