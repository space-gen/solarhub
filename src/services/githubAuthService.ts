/**
 * src/services/githubAuthService.ts
 *
 * GitHub auth for the static site, using the same-origin Worker in worker/index.js.
 *
 * We use GitHub's OAuth **Device Flow** (client-id only):
 *   - No client secret in the frontend bundle
 *   - Tokens only travel between the browser, our Worker and GitHub
 */

import { AUTH_CONFIG } from '../config/endpoints';

const CLIENT_ID = AUTH_CONFIG.clientId;
const SCOPE     = (AUTH_CONFIG.scopes ?? ['public_repo']).join(' ');
const DEVICE_CODE_URL = AUTH_CONFIG.deviceCodeUrl;
const ACCESS_TOKEN_URL = AUTH_CONFIG.accessTokenUrl;
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
  verification_uri_complete?: string;
  expires_in:       number;
  interval:         number;
}

type DeviceTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  interval?: number;
};

async function postFormJson<T>(url: string, form: Record<string, string>, timeoutMs = 8000): Promise<T> {
  const body = new URLSearchParams(form).toString();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('GitHub sign-in timed out. Check your network and try again.');
    }
    if (err instanceof TypeError) {
      throw new Error('Could not reach the SolarHub sign-in service. Check your network and try again.');
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${url}: ${text}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  const raw = await res.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    const preview = raw.slice(0, 180).replace(/\s+/g, ' ').trim();
    throw new Error(
      `Unexpected non-JSON response from OAuth endpoint (${url}, content-type: ${contentType || 'unknown'}): ${preview}`
    );
  }
}

export function isOAuthConfigured(): boolean {
  return Boolean(CLIENT_ID);
}

export async function startDeviceFlow(): Promise<DeviceFlowStart> {
  if (!CLIENT_ID) throw new Error('AUTH_CONFIG.clientId is not set.');

  // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow
  return postFormJson<DeviceFlowStart>(DEVICE_CODE_URL, {
    client_id: CLIENT_ID,
    scope: SCOPE,
  });
}

export async function exchangeDeviceCodeOnce(deviceCode: string): Promise<DeviceTokenResponse> {
  if (!CLIENT_ID) throw new Error('AUTH_CONFIG.clientId is not set.');

  return postFormJson<DeviceTokenResponse>(ACCESS_TOKEN_URL, {
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

export async function signInWithToken(token: string): Promise<GitHubUser> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error('Token is required.');
  }

  const user = await fetchGitHubUser(trimmed);
  await storeCredentials(trimmed, user);
  return user;
}

export async function storeCredentials(token: string, user: GitHubUser): Promise<void> {
  // Local cache for the active session and offline reloads.
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
  
  try { window.dispatchEvent(new Event('solarhub:github-auth-changed')); } catch { /* ignore */ }
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
