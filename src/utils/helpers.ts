/**
 * General utility helpers for SolarHub.
 */

/** Clamps a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Generates a random integer between min (inclusive) and max (exclusive). */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

/** Returns a promise that resolves after `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Truncates a string to `maxLength` chars, appending "…" if truncated. */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '…'
}

/** Returns the confidence level label based on numeric confidence. */
export function confidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'Very High'
  if (confidence >= 0.75) return 'High'
  if (confidence >= 0.5) return 'Medium'
  if (confidence >= 0.25) return 'Low'
  return 'Very Low'
}

/** Maps a task_type string to its display colour class. */
export function taskTypeColor(taskType: string): string {
  const map: Record<string, string> = {
    sunspot: 'text-solar-400',
    solar_flare: 'text-orange-400',
    coronal_hole: 'text-blue-400',
    prominence: 'text-purple-400',
    filament: 'text-pink-400',
  }
  return map[taskType] ?? 'text-white'
}
