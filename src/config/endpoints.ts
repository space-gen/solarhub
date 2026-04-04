/**
 * src/config/endpoints.ts
 *
 * Centralised API endpoint and GitHub configuration for SolarHub.
 */

export const ENDPOINTS = {
  /** Task list JSONL served from the aurora data directory (newline-delimited JSON). */
  TASKS: 'https://raw.githubusercontent.com/space-gen/aurora/main/data/tasks.jsonl',
  /** GitHub Issues REST API for the aurora backend repo. */
  GITHUB_ISSUES_API: 'https://api.github.com/repos/space-gen/aurora/issues',
  /** Human-readable link to the aurora repo. */
  GITHUB_REPO: 'https://github.com/space-gen/aurora',
} as const;

/**
 * GITHUB_CONFIG — aurora backend repository metadata.
 * Annotations submitted by users become GitHub Issues here,
 * picked up by the nightly aurora pipeline.
 */
export const GITHUB_CONFIG = {
  owner:        'space-gen',
  repo:         'aurora',
  issuesApiUrl: 'https://api.github.com/repos/space-gen/aurora/issues',
} as const;

/**
 * AUTH_CONFIG — GitHub OAuth App settings.
 *
 * This site is 100% static (GitHub Pages). We use GitHub's OAuth **Device Flow**,
 * which only requires a public **Client ID** (no client secret, no backend, no workers).
 */
export const AUTH_CONFIG = {
  /** GitHub OAuth App client ID (public). */
  clientId: 'Ov23lisiMUCpxHrplfOe',
  /** OAuth scopes: 'repo' allows access to user's private repos for SQLite storage. */
  scopes: ['repo'],
} as const;
