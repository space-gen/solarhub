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
 * The client secret is NOT here. It lives encrypted in the deployer's
 * Puter cloud KV (me.puter.kv) and is read by auth-worker.js at runtime.
 *
 * One-time setup (run in browser console at https://puter.com):
 *   await puter.kv.set('gh_client_id', 'Ov23li8lNUPIqguWQbLq')
 *   await puter.kv.set('gh_client_secret', 'YOUR_GITHUB_CLIENT_SECRET')
 *
 * Then deploy auth-worker.js and paste the worker URL below.
 */
export const AUTH_CONFIG = {
  /** GitHub OAuth App client ID (public — visible in every redirect URL). */
  clientId:    'Ov23lisiMUCpxHrplfOe',
  /** Deployed Puter Worker URL (no trailing slash). Get it after deploying auth-worker.js. */
  workerUrl:   'https://puter.com/app/sandbox-solarhub-oauth-worker',
  /** Callback URL registered in the OAuth App settings. */
  redirectUri: 'https://space-gen.github.io/solarhub/',
} as const;
