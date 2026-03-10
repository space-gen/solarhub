/**
 * src/services/taskService.ts
 *
 * Responsible for fetching, caching, and exposing solar classification tasks.
 *
 * Data flow:
 *  1. fetchTasks() is called by useTasks hook on mount.
 *  2. It first checks localStorage for a fresh cached response.
 *  3. On cache miss it fetches from ENDPOINTS.TASKS (a JSON file in the
 *     solarhub-data GitHub repo).
 *  4. If the network request fails, it falls back to MOCK_TASKS so the app
 *     is always usable even without connectivity.
 *
 * Cache strategy:
 *  - Key    : "solarhub:tasks:YYYY-MM-DD"  (auto-expires each day)
 *  - Value  : JSON-serialised Task[] array
 *  - TTL    : Implicit – the date component in the key acts as a daily TTL.
 *
 * Task image sources:
 *  NASA's Solar Dynamics Observatory (SDO) publishes public-domain imagery.
 *  For the mock/fallback set we use stable NASA image URLs and Picsum-style
 *  placeholders with a fixed solar-orange tint so they look convincing in
 *  dark mode.
 */

import { ENDPOINTS } from '@/config/endpoints';
import { generateTaskCacheKey } from '@/utils/helpers';

// ---------------------------------------------------------------------------
// Task data model
// ---------------------------------------------------------------------------

/** Type strings that classify what phenomenon is visible in the image. */
export type TaskType = 'sunspot' | 'solar_flare' | 'coronal_hole' | 'unknown';

/**
 * Task
 *
 * Represents a single solar image that a citizen scientist needs to classify.
 */
export interface Task {
  /** Unique identifier (UUID or slug) */
  id: string;

  /** URL of the solar observation image */
  image_url: string;

  /** Optional thumbnail URL (lower resolution, used as placeholder while full image loads) */
  thumbnail_url?: string;

  /** Machine-learning model's predicted classification for this observation */
  ml_prediction: TaskType;

  /** Model's confidence in its prediction, expressed as a float in [0, 1] */
  ml_confidence: number;

  /** Short description of what to look for in this image */
  description?: string;

  /** ISO 8601 timestamp of when the observation was captured */
  observation_date?: string;

  /** Instrument / wavelength band (e.g. "AIA 171Å") */
  instrument?: string;

  /** How many people have already annotated this task */
  annotation_count?: number;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

/** localStorage key for today's task list */
const CACHE_KEY = generateTaskCacheKey('tasks');

/**
 * readTasksFromCache
 *
 * Attempts to parse a Task[] array from localStorage.
 * Returns null on any failure (missing key, invalid JSON, wrong shape).
 */
function readTasksFromCache(): Task[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return parsed as Task[];
  } catch {
    return null;
  }
}

/**
 * writeTasksToCache
 *
 * Serialises a Task[] array into localStorage.
 * Silently swallows errors (e.g. storage quota exceeded).
 */
function writeTasksToCache(tasks: Task[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(tasks));
  } catch {
    // Non-fatal – the app works fine without caching
  }
}

// ---------------------------------------------------------------------------
// Mock / fallback task data
// ---------------------------------------------------------------------------

/**
 * MOCK_TASKS
 *
 * A hardcoded set of realistic-looking tasks used when the remote JSON file
 * cannot be fetched.  Image URLs point to NASA SDO's public image server and
 * stable Picsum images for fallback.
 *
 * NOTE: NASA SDO images are in the public domain – see:
 *       https://www.nasa.gov/content/goddard/sdo-data-use-guidelines
 */
export const MOCK_TASKS: Task[] = [
  {
    id: 'sdo-2024-0001',
    image_url:
      'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg',
    thumbnail_url:
      'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_256_0193.jpg',
    ml_prediction: 'coronal_hole',
    ml_confidence: 0.82,
    description:
      'AIA 193 Å image showing extreme ultraviolet emission from the corona. Dark regions may indicate coronal holes where solar wind escapes.',
    observation_date: new Date().toISOString(),
    instrument: 'AIA 193Å',
    annotation_count: 14,
  },
  {
    id: 'sdo-2024-0002',
    image_url:
      'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0304.jpg',
    thumbnail_url:
      'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_256_0304.jpg',
    ml_prediction: 'solar_flare',
    ml_confidence: 0.74,
    description:
      'AIA 304 Å image sensitive to upper chromosphere and transition region. Bright arching structures may be solar prominences or flare ribbons.',
    observation_date: new Date(Date.now() - 86400_000).toISOString(),
    instrument: 'AIA 304Å',
    annotation_count: 7,
  },
  {
    id: 'sdo-2024-0003',
    image_url:
      'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_HMII.jpg',
    thumbnail_url:
      'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_256_HMII.jpg',
    ml_prediction: 'sunspot',
    ml_confidence: 0.91,
    description:
      'HMI intensitygram (visible light) showing the solar photosphere. Dark patches with umbra/penumbra structure are sunspot groups.',
    observation_date: new Date(Date.now() - 2 * 86400_000).toISOString(),
    instrument: 'HMI Continuum',
    annotation_count: 23,
  },
  {
    id: 'sdo-2024-0004',
    image_url:
      'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0171.jpg',
    thumbnail_url:
      'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_256_0171.jpg',
    ml_prediction: 'coronal_hole',
    ml_confidence: 0.68,
    description:
      'AIA 171 Å image dominated by plasma at ~600,000 K. Bright loops outline active regions; dark filament channels may harbour eruptions.',
    observation_date: new Date(Date.now() - 3 * 86400_000).toISOString(),
    instrument: 'AIA 171Å',
    annotation_count: 11,
  },
  {
    id: 'sdo-2024-0005',
    image_url:
      'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0094.jpg',
    thumbnail_url:
      'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_256_0094.jpg',
    ml_prediction: 'solar_flare',
    ml_confidence: 0.86,
    description:
      'AIA 94 Å image highlights plasma at ~6 million K – characteristic of impulsive flare phases. Bright concentrated emission may indicate an X-ray bright point.',
    observation_date: new Date(Date.now() - 4 * 86400_000).toISOString(),
    instrument: 'AIA 94Å',
    annotation_count: 5,
  },
  {
    id: 'sdo-2024-0006',
    image_url:
      'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_HMId.jpg',
    thumbnail_url:
      'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_256_HMId.jpg',
    ml_prediction: 'sunspot',
    ml_confidence: 0.79,
    description:
      'HMI Dopplergram showing line-of-sight plasma velocities. Sunspot moats and super-granulation flows are visible as blue/red patterns.',
    observation_date: new Date(Date.now() - 5 * 86400_000).toISOString(),
    instrument: 'HMI Doppler',
    annotation_count: 9,
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * fetchTasks
 *
 * Returns an array of Task objects for the current session.
 *
 * Strategy:
 *  1. Return cached tasks if they exist and are still fresh.
 *  2. Fetch from the remote JSON endpoint.
 *  3. Validate and cache the response.
 *  4. On network error, return MOCK_TASKS with a console warning.
 *
 * @returns Promise<Task[]>
 */
export async function fetchTasks(): Promise<Task[]> {
  // ── Step 1: cache hit ──────────────────────────────────────────────────
  const cached = readTasksFromCache();
  if (cached) {
    console.info('[TaskService] Returning %d tasks from cache.', cached.length);
    return cached;
  }

  // ── Step 2: network fetch ──────────────────────────────────────────────
  try {
    const controller = new AbortController();
    // Abort after 10 s to prevent hanging on slow connections
    const timeoutId  = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(ENDPOINTS.TASKS, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as unknown;

    // ── Step 3: validate & cache ──────────────────────────────────────────
    if (!Array.isArray(data)) {
      throw new Error('Tasks endpoint did not return an array.');
    }

    const tasks = data as Task[];
    writeTasksToCache(tasks);
    console.info('[TaskService] Fetched and cached %d tasks.', tasks.length);
    return tasks;

  } catch (error) {
    // ── Step 4: graceful fallback ─────────────────────────────────────────
    console.warn(
      '[TaskService] Could not fetch tasks from remote URL. Using mock data.\nReason:',
      error instanceof Error ? error.message : error,
    );
    return MOCK_TASKS;
  }
}

/**
 * getTaskById
 *
 * Finds a single task by its ID.  Looks in the cache first, then falls back
 * to fetching the full task list if the cache is cold.
 *
 * @param id - The task ID to find
 * @returns Promise<Task | undefined>
 */
export async function getTaskById(id: string): Promise<Task | undefined> {
  const tasks = await fetchTasks();
  return tasks.find(t => t.id === id);
}
