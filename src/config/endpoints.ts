/**
 * src/config/endpoints.ts
 *
 * Centralised API endpoint and GitHub configuration for SolarHub.
 *
 * All external URLs are declared here so that:
 *  - They are easy to find and update in one place.
 *  - Services/hooks can import constants instead of hard-coding strings.
 *  - The TypeScript compiler can catch typos through the readonly shapes.
 */

// ---------------------------------------------------------------------------
// Public data endpoints
// ---------------------------------------------------------------------------

/**
 * ENDPOINTS – primary data sources used by the app.
 *
 * TASKS            : URL of the JSON file listing classification tasks.
 *                    The file is hosted on the solarhub-data GitHub repo's
 *                    default branch so it can be updated without a code
 *                    deployment.
 *
 * GITHUB_ISSUES_API: REST endpoint used to submit user annotations as GitHub
 *                    Issues.  Each annotation becomes a searchable, auditable
 *                    record on the data repository.
 *
 * GITHUB_REPO      : Human-readable URL to the data repository – used for
 *                    "view source" links in the UI.
 */
export const ENDPOINTS = {
  TASKS: 'https://raw.githubusercontent.com/solarhub/solarhub-data/main/data/tasks.json',
  GITHUB_ISSUES_API: 'https://api.github.com/repos/solarhub/solarhub-data/issues',
  GITHUB_REPO: 'https://github.com/solarhub/solarhub-data',
} as const;

// ---------------------------------------------------------------------------
// GitHub repository metadata
// ---------------------------------------------------------------------------

/**
 * GITHUB_CONFIG – static metadata about the backing data repository.
 *
 * Used by annotationService.ts when constructing API requests so that the
 * owner/repo pair is never hard-coded inside service logic.
 */
export const GITHUB_CONFIG = {
  owner: 'solarhub',
  repo: 'solarhub-data',
  issuesApiUrl: 'https://api.github.com/repos/solarhub/solarhub-data/issues',
} as const;
