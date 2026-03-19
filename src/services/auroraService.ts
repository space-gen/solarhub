/**
 * src/services/auroraService.ts
 *
 * Fetches solar image task lists from the local data directory at runtime.
 * No URLs or image data are hardcoded here — everything comes from:
 *   /solarhub/data/{taskType}.jsonl
 *
 * If a task type's JSONL file doesn't exist yet (HTTP 404), returns null so the
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
  /** Original filename (with extension) as found in the raw aurora JSON/url */
  filename: string;
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
  id?: string;
  serial_number?: number;
  url: string;
  task_type?: string;
  metadata?: {
    source?: string;
    date?: string;
    captured_at?: string;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = '/solarhub/data';

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

/**
 * Convert Aurora image URLs into browser-safe embeddable URLs.
 *
 * Aurora currently stores JSOC links as `http://...`, which are blocked as
 * mixed content on our HTTPS GitHub Pages frontend.
 *
 * We keep the same source image bytes and only switch transport/host:
 *   http://jsoc.stanford.edu/... -> https://jsoc1.stanford.edu/...
 *   http://jsoc1.stanford.edu/... -> https://jsoc1.stanford.edu/...
 */
function toEmbeddableImageUrl(url: string): string {
  if (url.startsWith('http://jsoc.stanford.edu/')) {
    return url.replace('http://jsoc.stanford.edu/', 'https://jsoc1.stanford.edu/');
  }
  if (url.startsWith('http://jsoc1.stanford.edu/')) {
    return url.replace('http://', 'https://');
  }
  return url;
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
  const url = `${BASE_URL}/${taskType}.jsonl`;

  try {
    const res = await fetch(url);

    // 404 → type not yet available
    if (res.status === 404) return null;

    if (!res.ok) {
      console.warn(`[AuroraService] Failed to fetch ${url}: HTTP ${res.status}`);
      return null;
    }

    // aurora now publishes newline-delimited JSON (.jsonl). Support both array JSON and JSONL.
    const text = await res.text();
    let raw: RawAuroraRecord[] | null = null;

    // First try full JSON parse (old format: array)
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) raw = parsed as RawAuroraRecord[];
    } catch {
      // ignore
    }

    // Fallback: parse as JSONL (one JSON object per non-empty line)
    if (!raw) {
      try {
        raw = text
          .split(/\r?\n/)
          .map(s => s.trim())
          .filter(Boolean)
          .map(line => JSON.parse(line) as RawAuroraRecord);
      } catch (err) {
        console.warn('[AuroraService] Failed to parse JSON/JSONL for', url, err);
        return null;
      }
    }

    if (!Array.isArray(raw)) return null;

    return raw
      .filter((record): record is RawAuroraRecord & { url: string } => Boolean(record?.url))
      .map((record, index): AuroraTask => {
        const url = record.url;
        let filename = '';
        try {
          const pathname = new URL(url).pathname;
          filename = pathname.split('/').pop() ?? '';
        } catch {
          filename = url.split('/').pop() ?? url;
        }

        return {
          id:           record.id?.trim() || idFromUrl(url),
          filename:     filename,
          url:          toEmbeddableImageUrl(url),
          taskType:     taskType,
          date:         record.metadata?.captured_at ?? record.metadata?.date ?? '',
          source:       record.metadata?.source ?? 'NASA SDO',
          serialNumber: record.serial_number ?? index + 1,
        } as AuroraTask;
      });
  } catch (err) {
    console.warn(`[AuroraService] Error fetching ${url}:`, err);
    return null;
  }
}
