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
 * Both values are public-facing for a static site:
 *   clientId     is visible in every browser OAuth redirect URL anyway.
 *   clientSecret for public_repo scope on a public repo is low-risk
 *                (same pattern used by giscus, utterances, etc.).
 *
 * Token exchange is proxied through puter.net.fetch() — no backend needed.
 * See: https://docs.puter.com/net/fetch/
 *
 * After registering your OAuth App at github.com/settings/applications/new:
 *   1. Fill in clientId and clientSecret below
 *   2. Push — no build secrets or .env files required
 */
export const AUTH_CONFIG = {
  /** GitHub OAuth App client ID (public — visible in every redirect URL). */
  clientId:     'Ov23li8lNUPIqguWQbLq',
  /** GitHub OAuth App client secret. */
  clientSecret: 'YOUR_GITHUB_CLIENT_SECRET',
  /** Callback URL registered in the OAuth App settings. */
  redirectUri:  'https://space-gen.github.io/solarhub/',
} as const;
