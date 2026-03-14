/**
 * src/services/auroraService.ts
 *
 * Fetches solar image task lists from aurora's GitHub data directory at runtime.
 * No URLs or image data are hardcoded here — everything comes from:
 *   https://raw.githubusercontent.com/space-gen/aurora/main/data/{taskType}.json
 *
 * If a task type's JSON file doesn't exist yet (HTTP 404), returns null so the
 * UI can show a "Coming soon" state for that type.
 */

import type { TaskType } from '@/services/annotationService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One solar observation task loaded from aurora's data directory. */
export interface AuroraTask {
  /** Filename portion of the URL, used as a stable ID (e.g. "20260313_000000_Ic_1k") */
  id: string;
  /** Full image URL as stored in aurora (may be http or https) */
  url: string;
  /** The aurora task type this image belongs to */
  taskType: TaskType;
  /** Observation date from metadata (ISO date string or "") */
  date: string;
  /** Source instrument/dataset label */
  source: string;
  /** 1-based position in the dataset — used as the aurora serial_number */
  serialNumber: number;
}

/** Raw shape of a single record in aurora's data JSON files. */
interface RawAuroraRecord {
  url: string;
  task_type: string;
  user_comments: unknown[];
  metadata: {
    source?: string;
    date?: string;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL =
  'https://raw.githubusercontent.com/space-gen/aurora/main/data';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract a stable ID from an image URL (the filename without extension). */
function idFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split('/').pop() ?? url;
    return filename.replace(/\.[^.]+$/, ''); // strip extension
  } catch {
    // Fallback for malformed URLs
    return url.split('/').pop()?.replace(/\.[^.]+$/, '') ?? url;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * fetchAuroraTasksByType
 *
 * Loads the task list for a single task type from aurora's GitHub data dir.
 *
 * @returns AuroraTask[] on success
 * @returns null if the file doesn't exist yet (HTTP 404) — means "coming soon"
 * @returns null on any other network / parse failure (treated the same way)
 */
export async function fetchAuroraTasksByType(
  taskType: TaskType,
): Promise<AuroraTask[] | null> {
  const url = `${BASE_URL}/${taskType}.json`;

  try {
    const res = await fetch(url);

    // 404 → type not yet available
    if (res.status === 404) return null;

    if (!res.ok) {
      console.warn(`[AuroraService] Failed to fetch ${url}: HTTP ${res.status}`);
      return null;
    }

    const raw = (await res.json()) as RawAuroraRecord[];

    if (!Array.isArray(raw)) return null;

    return raw.map((record, index): AuroraTask => ({
      id:           idFromUrl(record.url),
      url:          record.url,
      taskType:     taskType,
      date:         record.metadata?.date ?? '',
      source:       record.metadata?.source ?? 'NASA SDO',
      serialNumber: index + 1,
    }));
  } catch (err) {
    console.warn(`[AuroraService] Error fetching ${url}:`, err);
    return null;
  }
}
