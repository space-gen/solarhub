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

  /** Step 1 (explicit): request a device code and show it to the user. */
  generateDeviceCode: () => void;
  /** Step 2 (explicit): start polling for the token after the user enters the code on GitHub. */
  startPolling: () => void;
  /** Reset the device flow UI state. */
  cancel: () => void;

  /** Disconnect GitHub (clears local + Puter KV copies). */
  signOut: () => void;
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

  const cancel = useCallback(() => {
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

  const pollForToken = useCallback(async (start: {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expiresAt: number;
    interval?: number;
  }) => {
    const { expiresAt } = start;
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

  const generateDeviceCode = useCallback(() => {
    if (!isOAuthConfigured()) {
      setDeviceFlow({ status: 'error', error: 'Missing GitHub OAuth Client ID.' });
      return;
    }
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
        setDeviceFlow({
          status: 'pending',
          user_code: start.user_code,
          verification_uri: start.verification_uri,
          expiresAt: Date.now() + start.expires_in * 1000,
          device_code: start.device_code,
          interval: start.interval,
        });
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setDeviceFlow({ status: 'error', error: msg });
      })
      .finally(() => setLoading(false));
  }, [puterSignedIn, clearTimer]);

  const startPolling = useCallback(() => {
    if (!puterSignedIn) {
      setDeviceFlow({ status: 'error', error: 'Sign in to Puter first.' });
      return;
    }

    if (deviceFlow.status !== 'pending') return;
    if (!deviceFlow.device_code || !deviceFlow.user_code || !deviceFlow.verification_uri || !deviceFlow.expiresAt) return;

    cancelledRef.current = false;
    clearTimer();
    setLoading(true);

    void pollForToken({
      device_code: deviceFlow.device_code,
      user_code: deviceFlow.user_code,
      verification_uri: deviceFlow.verification_uri,
      expiresAt: deviceFlow.expiresAt,
      interval: deviceFlow.interval,
    });
  }, [puterSignedIn, deviceFlow, clearTimer, pollForToken]);

  const signOut = useCallback(() => {
    cancel();
    clearLocalCredentials();
    void clearPuterCredentials();
    setUser(null);
    setToken(null);
  }, [cancel]);

  return {
    user,
    token,
    loading,
    isConfigured: isOAuthConfigured(),
    deviceFlow,
    generateDeviceCode,
    startPolling,
    cancel,
    signOut,
  };
}
