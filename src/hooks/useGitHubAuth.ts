import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearLocalCredentials,
  exchangeDeviceCodeOnce,
  fetchGitHubUser,
  isOAuthConfigured,
  signInWithToken,
  startDeviceFlow,
  storeCredentials,
  type DeviceFlowStart,
} from '@/services/githubAuthService';
import { useStoredUser } from '@/hooks/useStoredUser';

export type DeviceFlowState =
  | { status: 'idle' | 'starting' }
  | { status: 'waiting'; userCode: string; verificationUri: string; expiresAt: number }
  | { status: 'error'; error: string };

export function useGitHubAuth() {
  const user = useStoredUser();
  const [deviceFlow, setDeviceFlow] = useState<DeviceFlowState>({ status: 'idle' });
  const timerRef = useRef<number | null>(null);
  const attemptRef = useRef(0);

  const cancel = useCallback(() => {
    attemptRef.current += 1;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setDeviceFlow({ status: 'idle' });
  }, []);

  useEffect(() => () => {
    attemptRef.current += 1;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const poll = useCallback((start: DeviceFlowStart, attempt: number, expiresAt: number, intervalMs: number) => {
    const fail = (error: string) => setDeviceFlow({ status: 'error', error });

    const tick = async (delay: number) => {
      if (attempt !== attemptRef.current) return;
      if (Date.now() >= expiresAt) return fail('That code ran out of time. Get a new one to continue.');
      try {
        const result = await exchangeDeviceCodeOnce(start.device_code);
        if (attempt !== attemptRef.current) return;
        if (result.access_token) {
          const ghUser = await fetchGitHubUser(result.access_token);
          await storeCredentials(result.access_token, ghUser);
          setDeviceFlow({ status: 'idle' });
          return;
        }
        if (result.error === 'access_denied') return fail('GitHub sign-in was cancelled.');
        if (result.error === 'expired_token') return fail('That code ran out of time. Get a new one to continue.');
        if (result.error && result.error !== 'authorization_pending' && result.error !== 'slow_down') {
          return fail(result.error_description ?? result.error);
        }
        const nextDelay = result.error === 'slow_down' ? delay + 5000 : delay;
        timerRef.current = window.setTimeout(() => void tick(nextDelay), nextDelay);
      } catch {
        // A brief network drop should not throw away a code the user may be entering.
        timerRef.current = window.setTimeout(() => void tick(delay), delay);
      }
    };

    timerRef.current = window.setTimeout(() => void tick(intervalMs), intervalMs);
  }, []);

  const beginSignIn = useCallback(() => {
    if (!isOAuthConfigured()) {
      setDeviceFlow({ status: 'error', error: 'GitHub sign-in is not set up for this site.' });
      return;
    }
    const attempt = attemptRef.current + 1;
    attemptRef.current = attempt;
    setDeviceFlow({ status: 'starting' });
    startDeviceFlow()
      .then(start => {
        if (attempt !== attemptRef.current) return;
        const expiresAt = Date.now() + start.expires_in * 1000;
        setDeviceFlow({ status: 'waiting', userCode: start.user_code, verificationUri: start.verification_uri, expiresAt });
        poll(start, attempt, expiresAt, (start.interval || 5) * 1000);
      })
      .catch(err => {
        if (attempt === attemptRef.current) {
          setDeviceFlow({ status: 'error', error: err instanceof Error ? err.message : 'Could not reach GitHub.' });
        }
      });
  }, [poll]);

  const signOut = useCallback(() => {
    cancel();
    clearLocalCredentials();
  }, [cancel]);

  return { user, deviceFlow, beginSignIn, cancel, signOut, connectWithToken: signInWithToken };
}
