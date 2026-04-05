/**
 * src/services/dailyProgressService.ts
 *
 * Tracks "already completed today" task IDs, total points, and streak.
 * Data is persisted locally and mirrored to Puter KV (when signed in).
 */

const DAILY_IDS_KEY_PREFIX = 'solarhub_daily_completed_';
const STATS_KEY = 'solarhub_user_stats_v1';

interface StoredStats {
  points: number;
  streak: number;
  lastActiveDate: string | null;
}

export interface DailyProgress {
  dateKey: string;
  completedTaskIds: Set<string>;
  points: number;
  streak: number;
  lastActiveDate: string | null;
}

function toDateKeyUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// day cutoff is 00:00 UTC; use standard UTC date
function todayKey(): string {
  return toDateKeyUTC(new Date());
}

function yesterdayKey(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return toDateKeyUTC(d);
}

function parseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function parseStats(raw: string | null): StoredStats {
  if (!raw) return { points: 0, streak: 0, lastActiveDate: null };
  try {
    const parsed = JSON.parse(raw) as Partial<StoredStats>;
    return {
      points: Number.isFinite(parsed.points) ? Math.max(0, Number(parsed.points)) : 0,
      streak: Number.isFinite(parsed.streak) ? Math.max(0, Number(parsed.streak)) : 0,
      lastActiveDate: typeof parsed.lastActiveDate === 'string' ? parsed.lastActiveDate : null,
    };
  } catch {
    return { points: 0, streak: 0, lastActiveDate: null };
  }
}

async function isPuterSignedIn(): Promise<boolean> {
  try {
    const puter = window.puter;
    if (!puter?.auth?.isSignedIn) return false;
    return await puter.auth.isSignedIn();
  } catch {
    return false;
  }
}

async function puterGet(key: string): Promise<string | null> {
  try {
    const puter = window.puter;
    if (!puter?.kv) return null;
    if (!(await isPuterSignedIn())) return null;
    return await puter.kv.get(key);
  } catch {
    return null;
  }
}

async function puterSet(key: string, value: string): Promise<void> {
  try {
    const puter = window.puter;
    if (!puter?.kv) return;
    if (!(await isPuterSignedIn())) return;
    await puter.kv.set(key, value);
  } catch {
    // non-fatal
  }
}

function localDailyKey(dateKey: string): string {
  return `${DAILY_IDS_KEY_PREFIX}${dateKey}`;
}

function safeLocalGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export async function loadDailyProgress(): Promise<DailyProgress> {
  const dateKey = todayKey();
  const dailyKey = localDailyKey(dateKey);

  // Try cloud first (source of truth)
  let cloudIds: string[] | null = null;
  let cloudStats: StoredStats | null = null;
  
  if (await isPuterSignedIn()) {
    cloudIds = parseStringArray(await puterGet(dailyKey));
    cloudStats = parseStats(await puterGet(STATS_KEY));
  }

  // Fallback to local if cloud unavailable (offline or not signed in)
  const localIds = parseStringArray(safeLocalGet(dailyKey));
  const localStats = parseStats(safeLocalGet(STATS_KEY));

  // If cloud data exists, it overrides local. Otherwise use local.
  // We do NOT merge sets anymore as per strict "cloud is source of truth" instruction.
  // However, for best UX, if cloud is null, we use local.
  const finalIds = cloudIds !== null ? new Set(cloudIds) : new Set(localIds);
  const finalStats = cloudStats !== null ? cloudStats : localStats;

  // Sync back to local to keep it fresh
  safeLocalSet(dailyKey, JSON.stringify([...finalIds]));
  safeLocalSet(STATS_KEY, JSON.stringify(finalStats));

  // Clean up yesterday's key so IDs do not persist past 00:00 UTC.
  try {
    const yKey = localDailyKey(yesterdayKey());
    // Only cleanup if yesterday is strictly not today
    if (yKey !== dailyKey) {
      try { localStorage.removeItem(yKey); } catch (e) { /* ignore */ }
      // We also clean up cloud for yesterday to save space/keep it clean
      await puterSet(yKey, JSON.stringify([]));
    }
  } catch {
    // non-fatal cleanup failure
  }

  return {
    dateKey,
    completedTaskIds: finalIds,
    points: finalStats.points,
    streak: finalStats.streak,
    lastActiveDate: finalStats.lastActiveDate,
  };
}

export async function markTaskCompletedForToday(taskId: string): Promise<{
  progress: DailyProgress;
  alreadyCompleted: boolean;
}> {
  // Always load latest from cloud first to ensure sync
  const current = await loadDailyProgress();
  if (current.completedTaskIds.has(taskId)) {
    return { progress: current, alreadyCompleted: true };
  }

  const updatedIds = new Set(current.completedTaskIds);
  updatedIds.add(taskId);

  const today = current.dateKey;
  const yesterday = yesterdayKey();
  let nextStreak = current.streak;

  if (current.lastActiveDate === today) {
    // keep streak
  } else if (current.lastActiveDate === yesterday) {
    nextStreak += 1;
  } else {
    nextStreak = 1;
  }

  const nextStats: StoredStats = {
    points: current.points + 1,
    streak: nextStreak,
    lastActiveDate: today,
  };

  const dailyKey = localDailyKey(today);
  const idsArray = [...updatedIds];

  // Cloud is source of truth
  await Promise.all([
    puterSet(dailyKey, JSON.stringify(idsArray)),
    puterSet(STATS_KEY, JSON.stringify(nextStats)),
  ]);

  // Update local cache
  safeLocalSet(dailyKey, JSON.stringify(idsArray));
  safeLocalSet(STATS_KEY, JSON.stringify(nextStats));

  return {
    alreadyCompleted: false,
    progress: {
      dateKey: today,
      completedTaskIds: updatedIds,
      points: nextStats.points,
      streak: nextStats.streak,
      lastActiveDate: nextStats.lastActiveDate,
    },
  };
}
