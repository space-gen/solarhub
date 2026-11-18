/**
 * src/config/endpoints.ts
 *
 * Centralised API endpoint and GitHub configuration for SolarHub.
 */

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
 * GitHub's device-flow endpoints do not allow browser CORS, so these same-origin
 * paths are served by the Cloudflare Worker in worker/index.js.
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
} as const;
