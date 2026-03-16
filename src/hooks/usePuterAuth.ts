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
    const puter = window.puter;
    if (!puter?.auth?.getUser) return;

    setLoading(true);
    void puter.auth.getUser()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(() => {
    const puter = window.puter;
    if (!puter?.auth?.signIn) {
      console.error('[PuterAuth] Puter.js not available.');
      return;
    }

    setLoading(true);
    void puter.auth.signIn()
      .then(u => setUser(u))
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
    void puter.auth.signOut()
      .catch(() => undefined)
      .finally(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  return { user, loading, signIn, signOut };
}
