/**
 * src/utils/helpers.ts
 *
 * General-purpose utility functions used across the SolarHub application.
 *
 * These are pure functions (no side-effects, no React imports) so they are
 * safe to import in services, hooks, and components alike.
 */

// ---------------------------------------------------------------------------
// Type definitions used by helpers below
// ---------------------------------------------------------------------------

/** Colour and icon metadata returned by classifyTaskType */
export interface TaskTypeStyle {
  /** Tailwind background colour class (e.g. "bg-orange-500/20") */
  bg: string;
  /** Tailwind text colour class (e.g. "text-orange-400") */
  text: string;
  /** Tailwind border colour class */
  border: string;
  /** Unicode emoji or short symbol for compact displays */
  icon: string;
  /** Human-readable label */
  label: string;
  /** Hex colour string for Framer Motion / inline styles */
  hex: string;
}

// ---------------------------------------------------------------------------
// Cache key generation
// ---------------------------------------------------------------------------

/**
 * generateTaskCacheKey
 *
 * Produces a deterministic localStorage key for a cached task list fetch.
 * Including the date string means the cache is automatically invalidated
 * each day so users always see fresh tasks.
 *
 * @param prefix  - Logical namespace (e.g. "tasks", "task-detail")
 * @param suffix  - Optional further qualifier (e.g. a task id)
 * @returns A string suitable for use as a localStorage key
 *
 * @example
 *   generateTaskCacheKey('tasks')            // "solarhub:tasks:2024-01-15"
 *   generateTaskCacheKey('task', 'abc123')   // "solarhub:task:abc123:2024-01-15"
 */
export function generateTaskCacheKey(prefix: string, suffix?: string): string {
  // ISO date component "YYYY-MM-DD" – acts as a daily cache TTL without
  // requiring us to store a separate expiry timestamp.
  const dateStamp = new Date().toISOString().slice(0, 10);

  const parts = ['solarhub', prefix];
  if (suffix) parts.push(suffix);
  parts.push(dateStamp);

  return parts.join(':');
}

// ---------------------------------------------------------------------------
// Image validation
// ---------------------------------------------------------------------------

/**
 * isValidImageUrl
 *
 * Checks whether a string looks like an HTTP(S) URL that *could* be a valid
 * image.  This is a lightweight syntactic check only – it does not perform a
 * network request.
 *
 * @param url - The string to validate
 * @returns true if the string is a plausible image URL
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);

    // Only allow http(s) protocols – reject data: / blob: / ftp: etc.
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    // Accept URLs that end with a known image extension OR have no extension
    // (many NASA APIs serve images via path-based URLs without extensions).
    const imageMimeExtensions = /\.(jpe?g|png|gif|webp|svg|avif|bmp)(\?.*)?$/i;
    const hasImageExtension = imageMimeExtensions.test(parsed.pathname);
    const hasNoExtension     = !parsed.pathname.includes('.');

    return hasImageExtension || hasNoExtension;
  } catch {
    // URL constructor throws on invalid strings
    return false;
  }
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/**
 * truncateText
 *
 * Safely truncates a string to a maximum character length, appending an
 * ellipsis when truncation occurs.
 *
 * @param text    - Input string
 * @param maxLen  - Maximum allowed character count (default 120)
 * @returns The original string if short enough, otherwise a truncated version
 *
 * @example
 *   truncateText('Hello world', 5)  // "Hello…"
 */
export function truncateText(text: string, maxLen = 120): string {
  if (!text) return '';
  if (text.length <= maxLen) return text;

  // Truncate at the last word boundary within maxLen to avoid splitting a word
  const slice = text.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');

  // If there's a word boundary close to the limit, cut there; otherwise hard cut
  const cutAt = lastSpace > maxLen * 0.8 ? lastSpace : maxLen;
  return slice.slice(0, cutAt).trimEnd() + '…';
}

// ---------------------------------------------------------------------------
// Session / user identity
// ---------------------------------------------------------------------------

/**
 * generateSessionId
 *
 * Creates or retrieves a stable anonymous session identifier stored in
 * localStorage.  This gives each visitor a persistent identity without
 * requiring sign-in, so their annotation history can be tracked across
 * page refreshes.
 *
 * The ID format is:  "sh_<timestamp_base36>_<random_hex>"
 *
 * @returns A session ID string
 */
export function generateSessionId(): string {
  const STORAGE_KEY = 'solarhub_session_id';

  // Return existing session ID if one was already created this session
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  // Generate a new ID
  const timestamp = Date.now().toString(36);          // base-36 timestamp
  const randomPart = Math.random().toString(16).slice(2, 10); // 8 hex chars
  const newId = `sh_${timestamp}_${randomPart}`;

  try {
    localStorage.setItem(STORAGE_KEY, newId);
  } catch {
    // localStorage can be unavailable in some privacy modes; fall back to
    // an in-memory ID that will only last the page session.
  }

  return newId;
}

// ---------------------------------------------------------------------------
// Task type classification
// ---------------------------------------------------------------------------

/**
 * classifyTaskType
 *
 * Returns the visual style metadata (colours, icon, label) for a given task
 * type string.  This is the single source of truth for task-type colours so
 * all components stay consistent.
 *
 * Supported types (case-insensitive):
 *   "sunspot"       – orange/amber
 *   "solar_flare"   – red/rose
 *   "coronal_hole"  – cyan/teal
 *   anything else   – purple (unknown)
 *
 * @param type - Raw task type string from the data JSON
 * @returns TaskTypeStyle object
 */
export function classifyTaskType(type: string): TaskTypeStyle {
  const normalised = (type ?? '').toLowerCase().replace(/[\s-]/g, '_');

  switch (normalised) {
    case 'sunspot':
      return {
        bg:     'bg-orange-500/20',
        text:   'text-orange-300',
        border: 'border-orange-500/40',
        icon:   '☀️',
        label:  'Sunspot',
        hex:    '#fb923c',
      };

    case 'solar_flare':
    case 'solarflare':
    case 'flare':
      return {
        bg:     'bg-rose-500/20',
        text:   'text-rose-300',
        border: 'border-rose-500/40',
        icon:   '🔥',
        label:  'Solar Flare',
        hex:    '#fb7185',
      };

    case 'coronal_hole':
    case 'coronalhole':
    case 'coronal':
      return {
        bg:     'bg-cyan-500/20',
        text:   'text-cyan-300',
        border: 'border-cyan-500/40',
        icon:   '🕳️',
        label:  'Coronal Hole',
        hex:    '#67e8f9',
      };

    case 'magnetogram':
      return {
        bg:     'bg-violet-500/20',
        text:   'text-violet-300',
        border: 'border-violet-500/40',
        icon:   '🧲',
        label:  'Magnetogram',
        hex:    '#a78bfa',
      };

    case 'prominence':
      return {
        bg:     'bg-sky-500/20',
        text:   'text-sky-300',
        border: 'border-sky-500/40',
        icon:   '🌊',
        label:  'Prominence',
        hex:    '#38bdf8',
      };

    case 'active_region':
      return {
        bg:     'bg-yellow-500/20',
        text:   'text-yellow-300',
        border: 'border-yellow-500/40',
        icon:   '⚡',
        label:  'Active Region',
        hex:    '#fde047',
      };

    case 'cme':
      return {
        bg:     'bg-red-500/20',
        text:   'text-red-300',
        border: 'border-red-500/40',
        icon:   '💥',
        label:  'CME',
        hex:    '#f87171',
      };

    default:
      return {
        bg:     'bg-nebula-500/20',
        text:   'text-nebula-300',
        border: 'border-nebula-500/40',
        icon:   '🔭',
        label:  type ? type.replace(/_/g, ' ') : 'Unknown',
        hex:    '#cbd5e1',
      };
  }
}

// ---------------------------------------------------------------------------
// Miscellaneous
// ---------------------------------------------------------------------------

/**
 * clamp
 *
 * Clamps a number between min and max bounds.
 *
 * @example  clamp(150, 0, 100)  // 100
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * randomIntBetween
 *
 * Returns a random integer in the range [min, max] (inclusive).
 * Useful for seeding star positions in the hero background.
 */
export function randomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
