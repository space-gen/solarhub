/**
 * src/config/endpoints.ts
 *
 * Centralised API endpoint and GitHub configuration for SolarHub.
 */

export const ENDPOINTS = {
  /** Task list JSON served from the aurora data directory. */
  TASKS: 'https://raw.githubusercontent.com/space-gen/aurora/main/data/tasks.json',
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
 * CLIENT_ID  : public value, safe to commit (visible in the browser URL anyway).
 * WORKER_URL : deployed URL of auth-worker.js on Puter.
 *              Set GH_CLIENT_ID and GH_CLIENT_SECRET as env vars in the Puter
 *              worker dashboard — they never touch this codebase.
 *
 * After registering your OAuth App and deploying the worker, fill in the two
 * values below and push.  No build-time secrets or .env files required.
 */
export const AUTH_CONFIG = {
  /** GitHub OAuth App client ID (public). */
  clientId:    'Ov23li8lNUPIqguWQbLq',
  /** Callback URL registered in the OAuth App settings. */
  redirectUri: 'https://space-gen.github.io/solarhub/',
  /** Deployed Puter worker URL (no trailing slash). */
  workerUrl:   'YOUR_PUTER_WORKER_URL',
} as const;
