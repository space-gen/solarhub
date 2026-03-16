/**
 * src/services/githubAuthService.ts
 *
 * GitHub OAuth 2.0 authentication for a fully static GitHub Pages site.
 *
 * CORS problem & solution:
 *   github.com/login/oauth/access_token has no CORS headers, so a plain
 *   browser fetch() fails.  puter.net.fetch() proxies the request through
 *   Puter's servers, bypassing the restriction entirely — no backend needed.
 *   https://docs.puter.com/net/fetch/
 *
 * Flow:
 *   1. startOAuthFlow()        → redirect to github.com/login/oauth/authorize
 *   2. GitHub redirects back   → REDIRECT_URI?code=&state=
 *   3. handleOAuthCallback()   → puter.net.fetch token exchange
 *   4. storeTokenAndFetchUser() → GET api.github.com/user (has CORS)
 *   5. Token + user stored in localStorage for the session
 *
 * Config: src/config/endpoints.ts → AUTH_CONFIG
 */

/// <reference path="../types/puter.d.ts" />

import { AUTH_CONFIG } from '../config/endpoints';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CLIENT_ID    = AUTH_CONFIG.clientId;
const WORKER_URL   = AUTH_CONFIG.workerUrl;
const REDIRECT_URI = AUTH_CONFIG.redirectUri;

const SCOPE     = 'public_repo';
const STATE_KEY = 'solarhub_oauth_state';
const TOKEN_KEY = 'solarhub_gh_token';
const USER_KEY  = 'solarhub_gh_user';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GitHubUser {
  login:      string;
  name:       string | null;
  avatar_url: string;
  html_url:   string;
}

// ---------------------------------------------------------------------------
// OAuth flow — step 1: redirect to GitHub
// ---------------------------------------------------------------------------

export function startOAuthFlow(): void {
  if (!CLIENT_ID) {
    console.error('[GitHubAuth] AUTH_CONFIG.clientId is not set.');
    return;
  }

  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id:    CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope:        SCOPE,
    state,
  });

  window.location.href = `https://github.com/login/oauth/authorize?${params}`;
}

// ---------------------------------------------------------------------------
// OAuth flow — step 2: exchange code for token via puter.net.fetch
// ---------------------------------------------------------------------------

export async function handleOAuthCallback(
  code:  string,
  state: string,
): Promise<string | null> {

  // ── CSRF check ──────────────────────────────────────────────────────────
  const storedState = sessionStorage.getItem(STATE_KEY);
  if (!storedState || state !== storedState) {
    console.error('[GitHubAuth] State mismatch — ignoring callback.');
    return null;
  }
  sessionStorage.removeItem(STATE_KEY);

  if (!CLIENT_ID || !WORKER_URL) {
    console.error('[GitHubAuth] AUTH_CONFIG.clientId or workerUrl is not set.');
    return null;
  }

  // ── Token exchange via Puter Worker (me.puter.kv holds the secret) ───────
  // puter.workers.exec() sends the user's Puter token automatically,
  // making user.puter available in the worker. The secret never leaves
  // the deployer's Puter KV (me.puter.kv) — it's never in this bundle.
  try {
    const response = await window.puter.workers.exec(`${WORKER_URL}/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange returned HTTP ${response.status}`);
    }

    const data = await response.json() as {
      access_token?: string;
      error?:        string;
      error_description?: string;
    };

    if (data.error || !data.access_token) {
      throw new Error(data.error_description ?? data.error ?? 'No access_token in response');
    }

    return data.access_token;

  } catch (err) {
    console.error('[GitHubAuth] Token exchange failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Step 3: fetch GitHub user and store everything
// ---------------------------------------------------------------------------

export async function storeTokenAndFetchUser(token: string): Promise<GitHubUser | null> {
  localStorage.setItem(TOKEN_KEY, token);

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

    const user = await response.json() as GitHubUser;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;

  } catch (err) {
    console.error('[GitHubAuth] Failed to fetch GitHub user:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Stored state accessors
// ---------------------------------------------------------------------------

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): GitHubUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as GitHubUser) : null;
  } catch {
    return null;
  }
}

export function signOut(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isOAuthConfigured(): boolean {
  return Boolean(CLIENT_ID && WORKER_URL);
}

