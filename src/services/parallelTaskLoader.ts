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

/**
 * Load all task types in parallel (lightning fast).
 * Results are cached for 1 hour to avoid repeat network calls.
 */
export async function loadAllTasksInParallel(
  taskTypes: TaskType[],
): Promise<Record<TaskType, AuroraTask[] | null>> {
  const allTypes = taskTypes.filter(t => t) as TaskType[];
  
  // Fetch all in parallel
  const promises = allTypes.map(async (taskType) => {
    const cached = CACHE[taskType];
    const now = Date.now();
    
    // Return cached if fresh
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return { taskType, tasks: cached.tasks };
    }
    
    // Fetch and cache
    const tasks = await fetchAuroraTasksByType(taskType);
    CACHE[taskType] = { tasks, timestamp: now };
    return { taskType, tasks };
  });

  const results = await Promise.all(promises);
  return Object.fromEntries(results.map(r => [r.taskType, r.tasks])) as Record<TaskType, AuroraTask[] | null>;
}

/**
 * Get a random task type and a random task from its dataset.
 * Useful for the "Random" mode UI option.
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
