/**
 * src/services/githubAuthService.ts
 *
 * GitHub OAuth 2.0 authentication for a fully static frontend.
 *
 * How the CORS problem is solved without a backend:
 *   GitHub's token exchange endpoint (github.com/login/oauth/access_token)
 *   does NOT send CORS headers, so a plain browser fetch() fails.
 *   We solve this using puter.net.fetch(), which proxies the request through
 *   Puter's servers — bypassing the browser's CORS restriction entirely.
 *   https://docs.puter.com/net/fetch/
 *
 * Flow:
 *   1. startOAuthFlow()  →  redirect to github.com/login/oauth/authorize
 *   2. GitHub redirects back to REDIRECT_URI with ?code=&state=
 *   3. handleOAuthCallback()  →  puter.net.fetch to exchange code → token
 *   4. storeTokenAndFetchUser()  →  GET api.github.com/user (has CORS)
 *   5. Token + user stored in localStorage for the session
 *
 * Required env vars (see .env.example):
 *   VITE_GITHUB_CLIENT_ID
 *   VITE_GITHUB_CLIENT_SECRET
 *   VITE_GITHUB_REDIRECT_URI   (optional, defaults to current origin)
 */

/// <reference path="../types/puter.d.ts" />

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CLIENT_ID     = import.meta.env.VITE_GITHUB_CLIENT_ID     as string ?? '';
const CLIENT_SECRET = import.meta.env.VITE_GITHUB_CLIENT_SECRET as string ?? '';
const REDIRECT_URI  = import.meta.env.VITE_GITHUB_REDIRECT_URI  as string
  ?? (typeof window !== 'undefined'
    ? window.location.origin + window.location.pathname
    : '');

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

/**
 * startOAuthFlow
 *
 * Redirects the browser to GitHub's OAuth authorisation page.
 * A random `state` nonce is stored in sessionStorage to prevent CSRF.
 */
export function startOAuthFlow(): void {
  if (!CLIENT_ID) {
    console.error('[GitHubAuth] VITE_GITHUB_CLIENT_ID is not set.');
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
// OAuth flow — step 2: exchange code for token (via puter.net.fetch)
// ---------------------------------------------------------------------------

/**
 * handleOAuthCallback
 *
 * Call this on app load when `?code=` and `?state=` are detected in the URL.
 * Uses puter.net.fetch() to proxy the token exchange through Puter's servers,
 * completely bypassing the browser's CORS restriction on github.com.
 *
 * @returns The GitHub access token, or null on failure.
 */
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

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('[GitHubAuth] OAuth credentials not configured.');
    return null;
  }

  // ── Token exchange via puter.net.fetch (CORS-free) ──────────────────────
  try {
    // puter.net.fetch routes through Puter's servers, so github.com's missing
    // CORS headers are not a problem for the browser.
    const puterFetch = (
      typeof window !== 'undefined' && window.puter?.net?.fetch
        ? window.puter.net.fetch.bind(window.puter.net)
        : fetch
    ) as typeof fetch;

    const response = await puterFetch(
      'https://github.com/login/oauth/access_token',
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':        'application/json',
        },
        body: JSON.stringify({
          client_id:     CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri:  REDIRECT_URI,
        }),
      },
    );

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

/**
 * storeTokenAndFetchUser
 *
 * Persists the access token to localStorage, then fetches the authenticated
 * user's profile from api.github.com (which has CORS headers, so a plain
 * fetch() works fine here).
 */
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
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}
