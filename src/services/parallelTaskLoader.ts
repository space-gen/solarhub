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
 * Load all task types and combine into a single pool.
 * Then pick a random task from the entire combined dataset.
 * Used by "Random" mode in the UI.
 */
export async function getRandomTaskFromCombinedPool(
  taskTypes: TaskType[],
): Promise<{ taskType: TaskType; task: AuroraTask } | null> {
  if (!taskTypes.length) return null;
  
  // Load all tasks in parallel
  const allTasksByType = await loadAllTasksInParallel(taskTypes);
  
  // Combine all tasks from all types into a single pool
  const combinedPool: Array<{ taskType: TaskType; task: AuroraTask }> = [];
  
  Object.entries(allTasksByType).forEach(([taskType, tasks]) => {
    if (tasks && Array.isArray(tasks)) {
      tasks.forEach(task => {
        combinedPool.push({ taskType: taskType as TaskType, task });
      });
    }
  });
  
  if (!combinedPool.length) return null;
  
  // Pick random from combined pool
  const randomIndex = Math.floor(Math.random() * combinedPool.length);
  return combinedPool[randomIndex];
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
 * Clear cache (for testing or manual refresh).
 */
export function clearCache(): void {
  Object.keys(CACHE).forEach(key => {
    delete CACHE[key as TaskType];
  });
}
