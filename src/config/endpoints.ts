/**
 * API endpoint configuration for SolarHub.
 * All data is sourced from the solarhub-data GitHub repository.
 */

const DATA_REPO_BASE =
  'https://raw.githubusercontent.com/solarhub/solarhub-data/main'

export const ENDPOINTS = {
  /** JSON file containing all classification tasks */
  TASKS: `${DATA_REPO_BASE}/data/tasks.json`,

  /** GitHub API endpoint for creating annotation issues */
  ANNOTATIONS_ISSUE:
    'https://api.github.com/repos/solarhub/solarhub-data/issues',

  /** JSON file containing leaderboard data */
  LEADERBOARD: `${DATA_REPO_BASE}/data/leaderboard.json`,
} as const

export const GITHUB_REPO = {
  OWNER: 'solarhub',
  REPO: 'solarhub-data',
} as const
