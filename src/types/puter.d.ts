/**
 * src/types/puter.d.ts
 *
 * Ambient TypeScript declarations for the Puter.js global loaded via CDN.
 * https://docs.puter.com/
 */

interface PuterUser {
  username: string;
  uuid:     string;
}

interface PuterKV {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
}

interface PuterNet {
  /** Fetch a resource without CORS restrictions (proxied through Puter servers). */
  fetch(url: string, options?: RequestInit): Promise<Response>;
}

interface PuterAuth {
  signIn(): Promise<PuterUser>;
  signOut(): Promise<void>;
  getUser(): Promise<PuterUser | null>;
  isSignedIn(): Promise<boolean>;
}

interface PuterWorkers {
  /** Call a deployed Puter Worker. Automatically sends the user's Puter auth token. */
  exec(url: string, options?: RequestInit): Promise<Response>;
}

interface Puter {
  auth:    PuterAuth;
  kv:      PuterKV;
  net:     PuterNet;
  workers: PuterWorkers;
}

declare global {
  const puter: Puter;
  interface Window {
    puter: Puter;
  }
}

export {};
