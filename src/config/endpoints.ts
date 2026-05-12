/**
 * src/config/endpoints.ts
 *
 * Centralised API endpoint and GitHub configuration for SolarHub.
 */

export const ENDPOINTS = {
  /** Task list JSONL served from the aurora data directory (newline-delimited JSON). */
  TASKS: 'https://raw.githubusercontent.com/space-gen/aurora/refs/heads/data/data/tasks.jsonl',
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
 * Device flow uses your public client ID, but browser CORS restrictions require
 * these endpoints to be served by a proxy in static deployments.
 */
export const AUTH_CONFIG = {
  /** GitHub OAuth App client ID (public). */
  clientId: 'Ov23lisiMUCpxHrplfOe',
  /** OAuth scopes: 'public_repo' allows writing progress.json to a public user repo. */
  scopes: ['public_repo'],
  /** Device-flow proxy endpoint forwarding to POST https://github.com/login/device/code */
  deviceCodeUrl: '/api/github/device/code',
  /** Token proxy endpoint forwarding to POST https://github.com/login/oauth/access_token */
  accessTokenUrl: '/api/github/access_token',
  /**
   * Static fallback hack for GitHub Pages when no backend proxy exists.
   * WARNING: This is a public proxy and should not be relied on for production security.
   */
  fallbackCorsProxyUrl: 'https://corsproxy.io/?url=',
  /**
   * Optional chain of fallback proxies; first successful response wins.
   * Supports either "...?url=" or "...{url}" templates.
   */
  fallbackCorsProxyUrls: ['https://corsproxy.io/?url=', 'https://cors.isomorphic-git.org/{url}'],
} as const;
