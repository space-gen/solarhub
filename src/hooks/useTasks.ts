/**
 * src/hooks/useTasks.ts
 *
 * Custom React hook that manages the full lifecycle of solar classification
 * tasks for the Classify page.
 *
 * Responsibilities:
 *  - Fetching the task list from taskService (with caching).
 *  - Tracking the user's current position in the task queue.
 *  - Providing navigation helpers (nextTask / previousTask).
 *  - Exposing loading/error state for the UI to render appropriate feedback.
 *  - Tracking per-session completion progress.
 *
 * Usage:
 *   const {
 *     tasks, currentTask, loading, error,
 *     taskIndex, totalTasks,
 *     nextTask, previousTask,
 *   } = useTasks();
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchTasks, type Task }             from '@/services/taskService';

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseTasksReturn {
  /** The full array of tasks for this session */
  tasks: Task[];

  /** The task currently being displayed (undefined while loading or on error) */
  currentTask: Task | undefined;

  /** Zero-based index of the current task */
  taskIndex: number;

  /** Total number of tasks available */
  totalTasks: number;

  /** Whether tasks are being fetched */
  loading: boolean;

  /** Error message if the fetch failed */
  error: string | null;

  /** Advance to the next task, wrapping around at the end */
  nextTask: () => void;

  /** Go back to the previous task */
  previousTask: () => void;

  /** Jump directly to a specific task index */
  goToTask: (index: number) => void;

  /** IDs of tasks the user has already submitted an annotation for */
  completedTaskIds: Set<string>;

  /** Mark a task as completed in the local progress tracker */
  markTaskCompleted: (taskId: string) => void;

  /** Number of tasks completed this session */
  completedCount: number;

  /** Fraction of tasks completed (0–1) – useful for progress bars */
  completionFraction: number;
}

// ---------------------------------------------------------------------------
// localStorage key for completed task IDs
// ---------------------------------------------------------------------------
const COMPLETED_KEY = 'solarhub_completed_tasks';

/**
 * loadCompletedIds
 * Reads the set of completed task IDs from localStorage.
 */
function loadCompletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/**
 * saveCompletedIds
 * Persists the completed task ID set back to localStorage.
 */
function saveCompletedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function useTasks(): UseTasksReturn {
  // ── Core state ────────────────────────────────────────────────────────────
  const [tasks,     setTasks]     = useState<Task[]>([]);
  const [taskIndex, setTaskIndex] = useState<number>(0);
  const [loading,   setLoading]   = useState<boolean>(true);
  const [error,     setError]     = useState<string | null>(null);

  // ── Progress tracking ─────────────────────────────────────────────────────
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(
    () => loadCompletedIds(),
  );

  // ── Fetch tasks on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true; // prevent state updates after unmount

    async function loadTasks() {
      setLoading(true);
      setError(null);

      try {
        const fetched = await fetchTasks();

        if (!isMounted) return;

        setTasks(fetched);

        // If user has already completed some tasks, start from the first
        // uncompleted one so they don't see the same images again.
        const completedIds   = loadCompletedIds();
        const firstPending   = fetched.findIndex(t => !completedIds.has(t.id));
        const startingIndex  = firstPending !== -1 ? firstPending : 0;

        setTaskIndex(startingIndex);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to load tasks';
        console.error('[useTasks] Error loading tasks:', message);
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTasks();

    return () => { isMounted = false; };
  }, []); // Only run on mount

  // ── Navigation callbacks ──────────────────────────────────────────────────

  /**
   * nextTask
   * Advances to the next task.  Wraps around to the beginning when the user
   * reaches the end of the queue.
   */
  const nextTask = useCallback(() => {
    setTaskIndex(prev =>
      tasks.length > 0 ? (prev + 1) % tasks.length : 0,
    );
  }, [tasks.length]);

  /**
   * previousTask
   * Goes back to the previous task.  Wraps around to the end when at index 0.
   */
  const previousTask = useCallback(() => {
    setTaskIndex(prev =>
      tasks.length > 0 ? (prev - 1 + tasks.length) % tasks.length : 0,
    );
  }, [tasks.length]);

  /**
   * goToTask
   * Jumps directly to a task by its index.  Clamps to valid range.
   */
  const goToTask = useCallback((index: number) => {
    if (tasks.length === 0) return;
    const clamped = Math.min(Math.max(0, index), tasks.length - 1);
    setTaskIndex(clamped);
  }, [tasks.length]);

  /**
   * markTaskCompleted
   * Records that the user has submitted an annotation for the given task ID.
   * Persists to localStorage and automatically advances to the next task.
   */
  const markTaskCompleted = useCallback((taskId: string) => {
    setCompletedTaskIds(prev => {
      const updated = new Set(prev);
      updated.add(taskId);
      saveCompletedIds(updated);
      return updated;
    });

    // Automatically advance to the next task after submission
    setTaskIndex(prev =>
      tasks.length > 0 ? (prev + 1) % tasks.length : 0,
    );
  }, [tasks.length]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const currentTask        = tasks[taskIndex];
  const totalTasks         = tasks.length;
  const completedCount     = completedTaskIds.size;
  const completionFraction = totalTasks > 0 ? completedCount / totalTasks : 0;

  return {
    tasks,
    currentTask,
    taskIndex,
    totalTasks,
    loading,
    error,
    nextTask,
    previousTask,
    goToTask,
    completedTaskIds,
    markTaskCompleted,
    completedCount,
    completionFraction,
  };
}
