/**
 * Extract and parse dates from JSOC URLs.
 * JSOC URLs encode timestamps directly in the filename, which is the authoritative source.
 */

/**
 * Extract timestamp from JSOC URL
 * Format examples:
 *   - https://jsoc1.stanford.edu/data/hmi/.../HMI_CONTINUUM_1024_20260513_120000.jp2
 *   - https://jsoc1.stanford.edu/data/aia/.../AIA_1_image_20260513_000000.jp2
 *   - File ID like: "20260313_000000_Ic_1k"
 *
 * The timestamp pattern is: YYYYMMDD_HHMMSS
 */
export function extractDateFromUrl(url: string): string | null {
  try {
    // Extract filename from URL
    const pathname = new URL(url).pathname;
    const filename = pathname.split('/').pop() || '';

    // Look for YYYYMMDD_HHMMSS pattern
    const match = filename.match(/(\d{8})_(\d{6})/);
    if (!match) return null;

    const dateStr = match[1]; // YYYYMMDD
    const timeStr = match[2]; // HHMMSS

    // Parse date components
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = timeStr.substring(0, 2);
    const minute = timeStr.substring(2, 4);
    const second = timeStr.substring(4, 6);

    // Format as ISO string
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  } catch (error) {
    console.error('Failed to extract date from URL:', error);
    return null;
  }
}

/**
 * Format ISO date string for display
 * Converts: 2026-05-13T12:00:00Z -> "May 13, 2026 12:00 UTC"
 */
export function formatJsocDate(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
    };
    const formattedDate = date.toLocaleString('en-US', options);
    return `${formattedDate} UTC`;
  } catch (error) {
    console.error('Failed to format date:', error);
    return '';
  }
}

/**
 * Get corrected date for display from URL
 * Extracts timestamp from JSOC URL and formats it for display
 */
export function getCorrectDateFromUrl(url: string): string {
  const isoDate = extractDateFromUrl(url);
  if (!isoDate) {
    return '';
  }
  return formatJsocDate(isoDate);
}
