/**
 * src/services/parallelTaskLoader.ts
 *
 * Efficiently load all task types in parallel with caching.
 * Prevents delay when loading multiple JSONL files from aurora/data.
 */

import { fetchAuroraTasksByType } from './auroraService';
import type { AuroraTask } from './auroraService';
import type { TaskType } from './annotationService';

interface CacheEntry {
  tasks: AuroraTask[] | null;
  timestamp: number;
}

const CACHE: Record<TaskType, CacheEntry> = {} as any;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const NIGHTLY_PARSER_START_UTC = 23 * 60 + 45; // 23:45 UTC in minutes
const NIGHTLY_PARSER_END_UTC = 0 * 60 + 15; // 00:15 UTC in minutes (next day)

// Track the next index in each task type for sequential serving
// Format: { 'sunspot': 0, 'magnetogram': 0, 'aia_94': 0, ... }
const typeSequenceIndex: Record<TaskType, number> = {} as any;

// Track completed task IDs per type to enforce sequence
// Format: { 'sunspot': ['sp-1', 'sp-2'], 'magnetogram': ['mg-1'], ... }
const completedTasksByType: Record<TaskType, string[]> = {} as any;

/**
 * Check if we're in the nightly parser window (23:45-00:15 UTC).
 * During this time, caching is disabled to always fetch fresh data.
 */
function isInNightlyParserWindow(): boolean {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const currentMinutes = utcHours * 60 + utcMinutes;
  
  // 23:45 to 23:59 (start of window same day)
  if (currentMinutes >= NIGHTLY_PARSER_START_UTC) return true;
  
  // 00:00 to 00:15 (end of window next day)
  if (currentMinutes <= NIGHTLY_PARSER_END_UTC) return true;
  
  return false;
}

/**
 * Load all task types in parallel (lightning fast).
 * Results are cached for 1 hour to avoid repeat network calls.
 * Caching is disabled during 23:45-00:15 UTC when nightly parser runs.
 */
export async function loadAllTasksInParallel(
  taskTypes: TaskType[],
): Promise<Record<TaskType, AuroraTask[] | null>> {
  const allTypes = taskTypes.filter(t => t) as TaskType[];
  const isParserWindow = isInNightlyParserWindow();
  
  // Fetch all in parallel
  const promises = allTypes.map(async (taskType) => {
    const cached = CACHE[taskType];
    const now = Date.now();
    
    // Skip cache during nightly parser window (23:45-00:15 UTC)
    if (!isParserWindow && cached && now - cached.timestamp < CACHE_TTL) {
      return { taskType, tasks: cached.tasks };
    }
    
    // Fetch and cache (or just fetch if in parser window)
    const tasks = await fetchAuroraTasksByType(taskType);
    if (!isParserWindow) {
      CACHE[taskType] = { tasks, timestamp: now };
    }
    return { taskType, tasks };
  });

  const results = await Promise.all(promises);
  return Object.fromEntries(results.map(r => [r.taskType, r.tasks])) as Record<TaskType, AuroraTask[] | null>;
}

/**
 * Mark a task as completed for a specific task type.
 * Enforces sequential completion: cannot skip ahead in sequence.
 */
export function markTaskCompleted(taskType: TaskType, taskId: string): void {
  if (!completedTasksByType[taskType]) {
    completedTasksByType[taskType] = [];
  }
  if (!completedTasksByType[taskType].includes(taskId)) {
    completedTasksByType[taskType].push(taskId);
  }
}

/**
 * Get the next available task for a specific task type.
 * Skips any completed tasks and returns the first incomplete task in sequence.
 * Returns null if all tasks are completed.
 */
export function getNextTaskForType(
  taskType: TaskType,
  allTasksForType: AuroraTask[],
): AuroraTask | null {
  if (!allTasksForType || !allTasksForType.length) return null;
  
  const completed = completedTasksByType[taskType] || [];
  
  // Find first task not in completed list
  for (const task of allTasksForType) {
    if (!completed.includes(task.id)) {
      return task;
    }
  }
  
  return null; // All tasks completed
}

/**
 * Load all task types and combine into a single pool in ID sequence.
 * In Random mode, cycle through types but serve each type's next incomplete task in sequence.
 * Enforces: can't serve type-100 if type-99 not completed.
 * Used by "Random" mode in the UI.
 */
export async function getRandomTaskFromCombinedPool(
  taskTypes: TaskType[],
): Promise<{ taskType: TaskType; task: AuroraTask } | null> {
  if (!taskTypes.length) return null;
  
  // Load all tasks in parallel
  const allTasksByType = await loadAllTasksInParallel(taskTypes);
  
  // Build a pool of valid (type, next-incomplete-task) pairs
  const validTasksPerType: Array<{ taskType: TaskType; task: AuroraTask }> = [];
  
  taskTypes.forEach(taskType => {
    const tasks = allTasksByType[taskType];
    if (tasks && Array.isArray(tasks)) {
      // Get the next incomplete task for this type (enforces sequence)
      const nextTask = getNextTaskForType(taskType, tasks);
      if (nextTask) {
        validTasksPerType.push({ taskType, task: nextTask });
      }
    }
  });
  
  if (!validTasksPerType.length) return null; // All tasks across all types completed
  
  // Cycle through types round-robin, serving each type's next task
  if (!typeSequenceIndex[validTasksPerType[0].taskType]) {
    validTasksPerType.forEach(item => {
      if (!typeSequenceIndex[item.taskType]) {
        typeSequenceIndex[item.taskType] = 0;
      }
    });
  }
  
  // Find next type with available tasks
  let attempts = 0;
  let typeIndex = 0;
  let selectedItem = validTasksPerType[typeIndex];
  
  while (attempts < validTasksPerType.length) {
    typeIndex = (typeIndex + 1) % validTasksPerType.length;
    selectedItem = validTasksPerType[typeIndex];
    attempts++;
  }
  
  return selectedItem;
}

/**
 * Get a random task type and a random task from its dataset.
 * Useful for the "Random" mode UI option.
 * @deprecated Use getRandomTaskFromCombinedPool instead for better randomization
 */
export async function getRandomTask(
  taskTypes: TaskType[],
): Promise<{ taskType: TaskType; task: AuroraTask | null } | null> {
  if (!taskTypes.length) return null;
  
  // Pick random task type
  const randomType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
  
  // Fetch tasks for that type (or use cached)
  const tasks = await fetchAuroraTasksByType(randomType);
  if (!tasks || !tasks.length) return null;
  
  // Pick random task from the list
  const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
  
  return { taskType: randomType, task: randomTask };
}

/**
 * Preload all tasks to warm the cache without blocking UI.
 */
export function preloadAllTasks(taskTypes: TaskType[]): Promise<void> {
  return loadAllTasksInParallel(taskTypes)
    .then(() => undefined)
    .catch(() => undefined); // Fail silently
}

/**
 * Clear all tracking (completed tasks, sequence indices).
 * Used for testing or session reset.
 */
export function clearTracking(): void {
  Object.keys(typeSequenceIndex).forEach(key => {
    delete typeSequenceIndex[key as TaskType];
  });
  Object.keys(completedTasksByType).forEach(key => {
    completedTasksByType[key as TaskType] = [];
  });
}
