/**
 * src/hooks/useGitHubAuth.ts
 *
 * GitHub auth hook for a static GitHub Pages site.
 *
 * Requirements:
 *  - User signs in with Puter first.
 *  - GitHub auth uses OAuth Device Flow (client-id only).
 *  - The GitHub access token is stored in the user's own Puter KV (best-effort),
 *    plus a localStorage cache for offline friendliness.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  startDeviceFlow,
  exchangeDeviceCodeOnce,
  fetchGitHubUser,
  storeCredentials,
  loadCredentialsFromPuter,
  clearLocalCredentials,
  clearPuterCredentials,
  getStoredToken,
  getStoredUser,
  isOAuthConfigured,
  type GitHubUser,
  type DeviceFlowStart,
} from '@/services/githubAuthService';

export type DeviceFlowStatus = 'idle' | 'starting' | 'pending' | 'polling' | 'error';

export interface DeviceFlowState {
  status: DeviceFlowStatus;
  user_code?: string;
  verification_uri?: string;
  expiresAt?: number;
  device_code?: string;
  interval?: number;
  error?: string;
}

export interface UseGitHubAuthReturn {
  user:         GitHubUser | null;
  token:        string | null;
  loading:      boolean;
  isConfigured: boolean;

  deviceFlow:   DeviceFlowState;
  signIn:       () => void;
  cancelSignIn: () => void;
  signOut:      () => void;
}

export function useGitHubAuth(puterSignedIn: boolean): UseGitHubAuthReturn {
  const [user,  setUser]  = useState<GitHubUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [loading, setLoading] = useState<boolean>(false);

  const [deviceFlow, setDeviceFlow] = useState<DeviceFlowState>({ status: 'idle' });

  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef<boolean>(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelSignIn = useCallback(() => {
    cancelledRef.current = true;
    clearTimer();
    setDeviceFlow({ status: 'idle' });
    setLoading(false);
  }, [clearTimer]);

  // Load from Puter KV once Puter is signed in (if local cache missing)
  useEffect(() => {
    if (!puterSignedIn) return;
    if (getStoredToken() && getStoredUser()) return;

    void loadCredentialsFromPuter().then(creds => {
      if (!creds) return;
      setToken(creds.token);
      setUser(creds.user);
    });
  }, [puterSignedIn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      cancelledRef.current = true;
    };
  }, [clearTimer]);

  const pollForToken = useCallback(async (start: DeviceFlowStart) => {
    const expiresAt = Date.now() + start.expires_in * 1000;
    let intervalMs = (start.interval || 5) * 1000;

    setDeviceFlow({
      status: 'polling',
      user_code: start.user_code,
      verification_uri: start.verification_uri,
      expiresAt,
      device_code: start.device_code,
      interval: start.interval,
    });

    const tick = async (): Promise<void> => {
      if (cancelledRef.current) return;
      if (Date.now() >= expiresAt) {
        setDeviceFlow({ status: 'error', error: 'Code expired. Please try again.' });
        setLoading(false);
        return;
      }

      try {
        const res = await exchangeDeviceCodeOnce(start.device_code);

        if (res.access_token) {
          const ghUser = await fetchGitHubUser(res.access_token);
          await storeCredentials(res.access_token, ghUser);
          setToken(res.access_token);
          setUser(ghUser);
          setDeviceFlow({ status: 'idle' });
          setLoading(false);
          return;
        }

        // Standard device-flow errors
        if (res.error === 'authorization_pending') {
          // keep polling
        } else if (res.error === 'slow_down') {
          intervalMs += 5000;
        } else if (res.error === 'access_denied') {
          setDeviceFlow({ status: 'error', error: 'Access denied on GitHub.' });
          setLoading(false);
          return;
        } else if (res.error === 'expired_token') {
          setDeviceFlow({ status: 'error', error: 'Code expired. Please try again.' });
          setLoading(false);
          return;
        } else if (res.error) {
          setDeviceFlow({ status: 'error', error: res.error_description ?? res.error });
          setLoading(false);
          return;
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setDeviceFlow({ status: 'error', error: msg });
        setLoading(false);
        return;
      }

      timerRef.current = window.setTimeout(() => { void tick(); }, intervalMs);
    };

    await tick();
  }, []);

  const signIn = useCallback(() => {
    if (!isOAuthConfigured()) return;
    if (!puterSignedIn) {
      setDeviceFlow({ status: 'error', error: 'Sign in to Puter first.' });
      return;
    }

    cancelledRef.current = false;
    clearTimer();

    setLoading(true);
    setDeviceFlow({ status: 'starting' });

    void startDeviceFlow()
      .then(start => {
        // Show instructions immediately
        setDeviceFlow({
          status: 'pending',
          user_code: start.user_code,
          verification_uri: start.verification_uri,
          expiresAt: Date.now() + start.expires_in * 1000,
          device_code: start.device_code,
          interval: start.interval,
        });

        // Convenience: open URL and copy code (best-effort)
        try { window.open(start.verification_uri, '_blank', 'noopener,noreferrer'); } catch { /* ignore */ }
        void navigator.clipboard?.writeText?.(start.user_code).catch(() => undefined);

        return pollForToken(start);
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setDeviceFlow({ status: 'error', error: msg });
        setLoading(false);
      });
  }, [puterSignedIn, clearTimer, pollForToken]);

  const signOut = useCallback(() => {
    cancelSignIn();
    clearLocalCredentials();
    void clearPuterCredentials();
    setUser(null);
    setToken(null);
  }, [cancelSignIn]);

  return {
    user,
    token,
    loading,
    isConfigured: isOAuthConfigured(),
    deviceFlow,
    signIn,
    cancelSignIn,
    signOut,
  };
}
