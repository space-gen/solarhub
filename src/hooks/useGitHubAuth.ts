/**
 * src/hooks/useGitHubAuth.ts
 *
 * React hook that manages the full GitHub OAuth lifecycle.
 *
 * On mount, it reads `window.location.search` for `?code=&state=` (the
 * redirect from GitHub after the user authorises the OAuth app).  If found,
 * it exchanges the code for a token via githubAuthService and strips the
 * params from the URL so they don't persist through navigations.
 *
 * Exposes:
 *   user          – GitHubUser if signed in, null otherwise
 *   token         – raw access token string, null otherwise
 *   loading       – true while the code exchange is in flight
 *   isConfigured  – true when VITE_GITHUB_CLIENT_ID + SECRET are set
 *   signIn        – triggers the OAuth redirect
 *   signOut       – clears stored credentials
 */

import { useState, useEffect, useCallback } from 'react';
import {
  startOAuthFlow,
  handleOAuthCallback,
  storeTokenAndFetchUser,
  getStoredToken,
  getStoredUser,
  signOut as signOutService,
  isOAuthConfigured,
  type GitHubUser,
} from '@/services/githubAuthService';

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseGitHubAuthReturn {
  user:         GitHubUser | null;
  token:        string | null;
  loading:      boolean;
  isConfigured: boolean;
  signIn:       () => void;
  signOut:      () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGitHubAuth(): UseGitHubAuthReturn {
  const [user,    setUser]    = useState<GitHubUser | null>(() => getStoredUser());
  const [token,   setToken]   = useState<string | null>(() => getStoredToken());
  const [loading, setLoading] = useState<boolean>(false);

  // ── Handle OAuth redirect callback ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const state  = params.get('state');

    if (!code || !state) return; // Not an OAuth callback — nothing to do

    // Strip ?code=&state= immediately so a page refresh doesn't re-process them.
    // window.history.replaceState leaves the hash (React Router) intact.
    const cleanUrl = window.location.origin
      + window.location.pathname
      + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);

    setLoading(true);

    handleOAuthCallback(code, state)
      .then(accessToken => {
        if (!accessToken) return null;
        return storeTokenAndFetchUser(accessToken);
      })
      .then(savedUser => {
        if (!savedUser) return;
        setToken(getStoredToken());
        setUser(savedUser);
      })
      .catch(err => {
        console.error('[useGitHubAuth] OAuth callback failed:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // run once on mount

  // ── Actions ──────────────────────────────────────────────────────────────

  const signIn = useCallback(() => {
    startOAuthFlow();
  }, []);

  const signOut = useCallback(() => {
    signOutService();
    setUser(null);
    setToken(null);
  }, []);

  return {
    user,
    token,
    loading,
    isConfigured: isOAuthConfigured(),
    signIn,
    signOut,
  };
}
