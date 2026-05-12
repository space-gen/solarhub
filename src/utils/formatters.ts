/**
 * src/utils/formatters.ts
 *
 * Pure formatting functions that convert raw data values into display strings.
 *
 * All functions are deterministic (same input always produces the same output)
 * and free of React / DOM dependencies so they can be unit-tested in isolation.
 */

// ---------------------------------------------------------------------------
// Points / numbers
// ---------------------------------------------------------------------------

/**
 * formatPoints
 *
 * Converts a raw points integer into a compact, human-readable string with
 * SI-style suffixes (K for thousands, M for millions).
 *
 * @example
 *   formatPoints(950)      // "950"
 *   formatPoints(1_500)    // "1.5K"
 *   formatPoints(2_000_000) // "2.0M"
 */
export function formatPoints(points: number): string {
  if (typeof points !== 'number' || isNaN(points)) return '0';

  if (points >= 1_000_000) {
    return `${(points / 1_000_000).toFixed(1)}M`;
  }

  if (points >= 10_000) {
    // 12,500 → "12.5K"
    return `${(points / 1_000).toFixed(1)}K`;
  }

  if (points >= 1_000) {
    // 1,234 → "1.2K"
    return `${(points / 1_000).toFixed(1)}K`;
  }

  return points.toString();
}

// ---------------------------------------------------------------------------
// Dates and timestamps
// ---------------------------------------------------------------------------

/**
 * formatDate
 *
 * Formats an ISO-8601 date string (or Date object) into a human-friendly
 * short date string in the user's locale.
 *
 * @example
 *   formatDate('2024-06-15T12:00:00Z')   // "Jun 15, 2024"
 */
export function formatDate(
  value: string | Date | number,
  locale = 'en-US',
): string {
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return 'Unknown date';

    return date.toLocaleDateString(locale, {
      year:  'numeric',
      month: 'short',
      day:   'numeric',
    });
  } catch {
    return 'Unknown date';
  }
}

/**
 * formatTimestamp
 *
 * Returns a relative time description for recent dates ("2 hours ago",
 * "yesterday") and an absolute date for older values.
 *
 * @param value - ISO string, Date object, or Unix ms timestamp
 */
export function formatTimestamp(value: string | Date | number): string {
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return 'Unknown';

    const now      = Date.now();
    const diffMs   = now - date.getTime();
    const diffSecs = Math.floor(diffMs / 1_000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHrs  = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs  / 24);

    if (diffSecs < 60)  return 'just now';
    if (diffMins < 60)  return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHrs  < 24)  return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays <  7)  return `${diffDays} days ago`;

    // Older than a week – fall back to absolute date
    return formatDate(date);
  } catch {
    return 'Unknown';
  }
}

// ---------------------------------------------------------------------------
// Confidence / percentages
// ---------------------------------------------------------------------------

/**
 * formatConfidence
 *
 * Converts a confidence value (0–1 float or 0–100 integer) to a percentage
 * string suitable for display.
 *
 * The function auto-detects whether the input is in the 0–1 or 0–100 range.
 *
 * @example
 *   formatConfidence(0.87)   // "87%"
 *   formatConfidence(92)     // "92%"
 */
export function formatConfidence(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return 'N/A';

  // If value is <= 1 assume it's a 0–1 fraction; otherwise assume 0–100
  const pct = value <= 1 ? Math.round(value * 100) : Math.round(value);

  // Clamp to [0, 100]
  const clamped = Math.min(100, Math.max(0, pct));

  return `${clamped}%`;
}

// ---------------------------------------------------------------------------
// Task types
// ---------------------------------------------------------------------------

/**
 * formatTaskType
 *
 * Converts a raw snake_case task type string into a pretty, title-cased
 * human-readable label.
 *
 * @example
 *   formatTaskType('solar_flare')    // "Solar Flare"
 *   formatTaskType('SUNSPOT')        // "Sunspot"
 *   formatTaskType('coronal_hole')   // "Coronal Hole"
 */
export function formatTaskType(type: string): string {
  if (!type) return 'Unknown';

  return type
    .toLowerCase()
    .split(/[_\s-]+/)                     // split on underscore, space, or dash
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Misc number formatting
// ---------------------------------------------------------------------------

/**
 * formatOrdinal
 *
 * Appends the correct English ordinal suffix to a number.
 *
 * @example
 *   formatOrdinal(1)   // "1st"
 *   formatOrdinal(22)  // "22nd"
 *   formatOrdinal(13)  // "13th"
 */
export function formatOrdinal(n: number): string {
  const abs = Math.abs(n);
  const mod10  = abs % 10;
  const mod100 = abs % 100;

  // 11th, 12th, 13th are exceptions to the mod10 rule
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;

  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}
