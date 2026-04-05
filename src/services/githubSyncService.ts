/**
 * src/services/githubSyncService.ts
 *
 * Syncs SQLite database to/from user's private GitHub repository.
 * Uses GitHub Contents API to manage .sqlite file.
 *
 * Flow:
 *   - On app init: fetch .sqlite from user's private repo (if exists)
 *   - On save: PUT updated .sqlite back to repo with SHA (prevents conflicts)
 *   - Each user has their own metadata config stored in localStorage
 */

import { getStoredToken, getStoredUser } from './githubAuthService';
import { exportDB, loadDBFromBytes } from './sqliteService';

const REPO_CONFIG_KEY = 'solarhub_sqlite_repo_config';
const SQLITE_FILE_NAME = '.sqlite';

interface RepoConfig {
  owner: string;
  repo: string;
}

/**
 * Get user's repo config from localStorage
 */
function getRepoConfig(): RepoConfig | null {
  try {
    const raw = localStorage.getItem(REPO_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Save repo config to localStorage
 */
function saveRepoConfig(config: RepoConfig): void {
  try {
    localStorage.setItem(REPO_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

/**
 * Get or create user's SQLite repository
 * On first login, creates a new private repo named 'solarhub-sqlite'
 */
export async function ensureUserRepo(): Promise<RepoConfig> {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    throw new Error('User not authenticated');
  }

  // Check if already configured
  let config = getRepoConfig();
  if (config) return config;

  // Create new private repo
  const repoName = 'solarhub-sqlite';
  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      name: repoName,
      private: true,
      description: 'SolarHub SQLite database for annotations storage',
      auto_init: true,
    }),
  });

  if (!response.ok) {
    // Repo might already exist, try to fetch it
    const getResponse = await fetch(
      `https://api.github.com/repos/${user.login}/${repoName}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    if (!getResponse.ok) {
      throw new Error(`Failed to create or find repo: ${response.status}`);
    }
  }

  config = { owner: user.login, repo: repoName };
  saveRepoConfig(config);
  return config;
}

/**
 * Fetch .sqlite file from user's repo
 * Returns { bytes, sha } or null if not found
 */
export async function fetchSQLiteFile(): Promise<{
  bytes: Uint8Array;
  sha: string;
} | null> {
  const token = getStoredToken();
  const config = getRepoConfig();

  if (!token || !config) {
    throw new Error('Not authenticated or repo not configured');
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${SQLITE_FILE_NAME}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    if (response.status === 404) {
      return null; // File doesn't exist yet (first time)
    }

    if (!response.ok) {
      throw new Error(`GitHub API ${response.status}`);
    }

    const data = await response.json() as {
      content: string;
      sha: string;
    };

    // Decode Base64
    const binaryString = atob(data.content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return { bytes, sha: data.sha };
  } catch (error) {
    console.error('[GithubSyncService] Fetch failed:', error);
    throw error;
  }
}

/**
 * Upload .sqlite file to user's repo
 * Uses SHA for concurrent edit detection
 */
export async function uploadSQLiteFile(
  bytes: Uint8Array,
  sha?: string
): Promise<{ sha: string }> {
  const token = getStoredToken();
  const config = getRepoConfig();

  if (!token || !config) {
    throw new Error('Not authenticated or repo not configured');
  }

  // Encode to Base64
  let base64Content = '';
  for (let i = 0; i < bytes.length; i++) {
    base64Content += String.fromCharCode(bytes[i]);
  }
  base64Content = btoa(base64Content);

  const body: Record<string, string> = {
    message: `Update SQLite database - ${new Date().toISOString()}`,
    content: base64Content,
  };

  if (sha) {
    body.sha = sha;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${SQLITE_FILE_NAME}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify(body),
      }
    );

    if (response.status === 409) {
      // Conflict - file was modified concurrently
      console.warn('[GithubSyncService] Conflict detected (409), fetching latest...');
      const latest = await fetchSQLiteFile();
      if (latest) {
        // Load remote version
        await loadDBFromBytes(latest.bytes);
        // Retry upload with new SHA
        return uploadSQLiteFile(await exportDB(), latest.sha);
      }
      throw new Error('Conflict resolution failed');
    }

    if (!response.ok) {
      throw new Error(`GitHub API ${response.status}`);
    }

    const data = await response.json() as { content?: { sha: string } };
    return { sha: data.content?.sha || '' };
  } catch (error) {
    console.error('[GithubSyncService] Upload failed:', error);
    throw error;
  }
}

/**
 * Full sync cycle: fetch latest, load if exists, export when needed
 */
export async function syncToGitHub(): Promise<void> {
  try {
    // Ensure repo exists
    await ensureUserRepo();

    // Fetch current version
    const remote = await fetchSQLiteFile();

    if (remote) {
      // Load remote version to get latest state
      await loadDBFromBytes(remote.bytes);
    }

    // Export local state and upload
    const bytes = await exportDB();
    await uploadSQLiteFile(bytes, remote?.sha);
  } catch (error) {
    console.error('[GithubSyncService] Sync failed:', error);
    throw error;
  }
}

/**
 * Initialize: fetch remote .sqlite if it exists
 */
export async function initializeFromGitHub(): Promise<void> {
  try {
    const token = getStoredToken();
    if (!token) return; // Not authenticated yet

    // Ensure repo exists
    await ensureUserRepo();

    // Try to fetch existing .sqlite
    const remote = await fetchSQLiteFile();
    if (remote) {
      await loadDBFromBytes(remote.bytes);
      console.info('[GithubSyncService] Loaded .sqlite from GitHub');
    }
  } catch (error) {
    console.warn('[GithubSyncService] Init from GitHub failed, using local DB:', error);
    // Continue with local DB if sync fails
  }
}
