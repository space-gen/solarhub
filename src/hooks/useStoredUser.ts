import { useEffect, useState } from 'react';
import { getStoredUser, type GitHubUser } from '@/services/githubAuthService';

export function useStoredUser(): GitHubUser | null {
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    window.addEventListener('solarhub:github-auth-changed', sync);
    return () => window.removeEventListener('solarhub:github-auth-changed', sync);
  }, []);

  return user;
}
