/**
 * src/services/githubAuthService.ts
 *
 * GitHub auth for a fully static GitHub Pages site.
 *
 * We use GitHub's OAuth **Device Flow** (client-id only):
 *   - No client secret in the frontend bundle
 *   - No backend server
 *   - No Puter Workers
 *
 * CORS note:
 *   GitHub's device endpoints do not include browser CORS headers.
 *   We call them via `puter.net.fetch()` which proxies the request.
 */

import { AUTH_CONFIG } from '../config/endpoints';

const CLIENT_ID = AUTH_CONFIG.clientId;
const SCOPE     = (AUTH_CONFIG.scopes ?? ['public_repo']).join(' ');

const TOKEN_KEY = 'solarhub_gh_token';
const USER_KEY  = 'solarhub_gh_user';

export interface GitHubUser {
  login:      string;
  name:       string | null;
  avatar_url: string;
  html_url:   string;
}

export interface DeviceFlowStart {
  device_code:      string;
  user_code:        string;
  verification_uri: string;
  expires_in:       number;
  interval:         number;
}

type DeviceTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  interval?: number;
};

function requirePuterNetFetch(): PuterNet['fetch'] {
  const puter = window.puter;
  if (!puter?.net?.fetch) {
    throw new Error('Puter.js is required for GitHub sign-in (for CORS-bypassing fetch).');
  }
  return puter.net.fetch.bind(puter.net);
}

async function postFormJson<T>(url: string, form: Record<string, string>): Promise<T> {
  const netFetch = requirePuterNetFetch();
  const body = new URLSearchParams(form).toString();

  const res = await netFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${url}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export function isOAuthConfigured(): boolean {
  return Boolean(CLIENT_ID);
}

export async function startDeviceFlow(): Promise<DeviceFlowStart> {
  if (!CLIENT_ID) throw new Error('AUTH_CONFIG.clientId is not set.');

  // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow
  return postFormJson<DeviceFlowStart>('https://github.com/login/device/code', {
    client_id: CLIENT_ID,
    scope: SCOPE,
  });
}

export async function exchangeDeviceCodeOnce(deviceCode: string): Promise<DeviceTokenResponse> {
  if (!CLIENT_ID) throw new Error('AUTH_CONFIG.clientId is not set.');

  return postFormJson<DeviceTokenResponse>('https://github.com/login/oauth/access_token', {
    client_id: CLIENT_ID,
    device_code: deviceCode,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  });
}

export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
  return response.json() as Promise<GitHubUser>;
}

export async function storeCredentials(token: string, user: GitHubUser): Promise<void> {
  // Local cache (offline-friendly)
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore (storage can be blocked in embedded/private contexts)
  }
  try { window.dispatchEvent(new Event('solarhub:github-auth-changed')); } catch { /* ignore */ }

  // User-owned Puter KV (best-effort)
  try {
    const puter = window.puter;
    if (!puter?.kv) return;
    const signedIn = await puter.auth?.isSignedIn?.().catch(() => false);
    if (!signedIn) return;

    await puter.kv.set(TOKEN_KEY, token);
    await puter.kv.set(USER_KEY, JSON.stringify(user));
  } catch {
    // Non-fatal — localStorage already has a copy
  }
}

export async function loadCredentialsFromPuter(): Promise<{ token: string; user: GitHubUser } | null> {
  try {
    const puter = window.puter;
    if (!puter?.kv) return null;
    const signedIn = await puter.auth?.isSignedIn?.().catch(() => false);
    if (!signedIn) return null;

    const token = await puter.kv.get(TOKEN_KEY);
    const rawUser = await puter.kv.get(USER_KEY);
    if (!token || !rawUser) return null;

    const user = JSON.parse(rawUser) as GitHubUser;

    // Refresh local cache
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
    try { window.dispatchEvent(new Event('solarhub:github-auth-changed')); } catch { /* ignore */ }

    return { token, user };
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): GitHubUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as GitHubUser) : null;
  } catch {
    return null;
  }
}

export function clearLocalCredentials(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
  try { window.dispatchEvent(new Event('solarhub:github-auth-changed')); } catch { /* ignore */ }
}

export async function clearPuterCredentials(): Promise<void> {
  try {
    const puter = window.puter;
    if (!puter?.kv) return;
    const signedIn = await puter.auth?.isSignedIn?.().catch(() => false);
    if (!signedIn) return;

    await puter.kv.del(TOKEN_KEY);
    await puter.kv.del(USER_KEY);
  } catch {
    // ignore
  }
}

