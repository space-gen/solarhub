/**
 * src/hooks/usePuterAuth.ts
 *
 * Minimal Puter auth state for a static site.
 * We require Puter sign-in before starting GitHub Device Flow.
 */

import { useCallback, useEffect, useState } from 'react';

export interface UsePuterAuthReturn {
  user:    PuterUser | null;
  loading: boolean;
  signIn:  () => void;
  signOut: () => void;
}

export function usePuterAuth(): UsePuterAuthReturn {
  const [user, setUser] = useState<PuterUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const start = Date.now();
    const maxWaitMs = 10_000;

    setLoading(true);

    const tryInit = () => {
      if (cancelled) return;

      const puter = window.puter;
      if (!puter?.auth?.getUser) {
        if (Date.now() - start > maxWaitMs) {
          setLoading(false);
          return;
        }
        timer = window.setTimeout(tryInit, 200);
        return;
      }

      void Promise.resolve()
        .then(() => puter.auth.getUser())
        .then(u => { if (!cancelled) setUser(u); })
        .catch(() => { if (!cancelled) setUser(null); })
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    tryInit();

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  const signIn = useCallback(() => {
    setLoading(true);

    void (async () => {
      const start = Date.now();
      const maxWaitMs = 10_000;

      while (Date.now() - start < maxWaitMs) {
        const puter = window.puter;
        if (puter?.auth?.signIn) {
          const u = await Promise.resolve().then(() => puter.auth.signIn());
          setUser(u);
          return;
        }
        await new Promise<void>(resolve => window.setTimeout(resolve, 200));
      }

      throw new Error('Puter.js not available.');
    })()
      .catch(err => {
        console.error('[PuterAuth] signIn failed:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const signOut = useCallback(() => {
    const puter = window.puter;
    if (!puter?.auth?.signOut) {
      setUser(null);
      return;
    }

    setLoading(true);
    void Promise.resolve()
      .then(() => puter.auth.signOut())
      .catch(() => undefined)
      .finally(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  return { user, loading, signIn, signOut };
}
