/**
 * src/services/dailyProgressService.ts
 *
 * Tracks points, streak, and the latest completed task ID per task type.
 * Data is persisted in progress.json and synced to the user's public GitHub repo.
 */

import type { TaskType } from './annotationService';
import { loadProgressFromGitHub, saveProgressToGitHub } from './githubSyncService';

export interface DailyProgress {
  dateKey: string;
  points: number;
  streak: number;
  lastActiveDate: string | null;
  lastCompletedIdsByType: Record<TaskType, string | null>;
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

export async function loadDailyProgress(): Promise<DailyProgress> {
  const dateKey = todayKey();
  const progress = await loadProgressFromGitHub();

  return {
    dateKey,
    points: progress.points,
    streak: progress.streak,
    lastActiveDate: progress.lastActiveDate,
    lastCompletedIdsByType: { ...progress.lastCompletedIdsByType },
  };
}

export async function markTaskCompletedForToday(taskId: string, taskType: TaskType): Promise<{
  progress: DailyProgress;
  alreadyCompleted: boolean;
}> {
  const current = await loadDailyProgress();
  
  console.info('[DailyProgressService] markTaskCompletedForToday called for', taskId, taskType, 'current:', {
    points: current.points,
    streak: current.streak,
    lastCompletedIdForType: current.lastCompletedIdsByType[taskType],
  });

  if (current.lastCompletedIdsByType[taskType] === taskId) {
    console.info('[DailyProgressService] Task already marked completed:', taskId);
    return { progress: current, alreadyCompleted: true };
  }

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

  const nextStats = {
    points: current.points + 1,
    streak: nextStreak,
    lastActiveDate: today,
  };

  await saveProgressToGitHub({
    schemaVersion: 2,
    points: nextStats.points,
    streak: nextStats.streak,
    lastActiveDate: nextStats.lastActiveDate,
    lastCompletedIdsByType: {
      ...current.lastCompletedIdsByType,
      [taskType]: taskId,
    },
    updatedAt: new Date().toISOString(),
  });

  return {
    alreadyCompleted: false,
    progress: {
      dateKey: today,
      points: nextStats.points,
      streak: nextStats.streak,
      lastActiveDate: nextStats.lastActiveDate,
      lastCompletedIdsByType: {
        ...current.lastCompletedIdsByType,
        [taskType]: taskId,
      },
    },
  };
}
