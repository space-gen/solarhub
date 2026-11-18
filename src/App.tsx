import { useCallback, useEffect, useRef, useState } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import Footer from '@/components/Footer';
import NavigationBar from '@/components/NavigationBar';
import About from '@/pages/About';
import Account from '@/pages/Account';
import Classify from '@/pages/Classify';
import Contact from '@/pages/Contact';
import Funding from '@/pages/Funding';
import Home from '@/pages/Home';
import { getStoredUser } from '@/services/githubAuthService';
import { loadDailyProgress } from '@/services/dailyProgressService';
import { initializeFromGitHub } from '@/services/githubSyncService';
import { flushQueue } from '@/services/submissionQueue';

const PAGE_TITLES: Record<string, string> = {
  '/': 'SolarHub',
  '/classify': 'Classify solar images',
  '/about': 'About',
  '/contact': 'Contact',
  '/funding': 'Support SolarHub',
  '/account': 'Sign in',
};

function Shell() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);

  const syncProgress = useCallback(async () => {
    if (!getStoredUser()) {
      setPoints(0);
      setStreak(0);
      return;
    }
    try {
      await initializeFromGitHub();
      const progress = await loadDailyProgress();
      setPoints(progress.points);
      setStreak(progress.streak);
    } catch (err) {
      console.warn('[App] Could not load progress:', err);
    }
  }, []);

  useEffect(() => {
    const onAuthChanged = () => {
      void syncProgress().then(flushQueue);
    };
    const onProgress = (event: Event) => {
      const { points: nextPoints, streak: nextStreak } = (event as CustomEvent<{ points: number; streak: number }>).detail;
      setPoints(nextPoints);
      setStreak(nextStreak);
    };
    const retry = () => void flushQueue();
    onAuthChanged();
    window.addEventListener('solarhub:github-auth-changed', onAuthChanged);
    window.addEventListener('solarhub:progress', onProgress);
    window.addEventListener('online', retry);
    return () => {
      window.removeEventListener('solarhub:github-auth-changed', onAuthChanged);
      window.removeEventListener('solarhub:progress', onProgress);
      window.removeEventListener('online', retry);
    };
  }, [syncProgress]);

  useEffect(() => {
    const root = `/${pathname.split('/')[1] ?? ''}`;
    const title = PAGE_TITLES[root] ?? PAGE_TITLES['/'];
    document.title = title === 'SolarHub' ? title : `${title} | SolarHub`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        onClick={event => {
          // The router owns the URL hash, so move focus directly.
          event.preventDefault();
          mainRef.current?.focus();
        }}
        className="btn btn-primary absolute left-4 top-2 z-50 -translate-y-20 focus:translate-y-0"
      >
        Skip to main content
      </a>
      <NavigationBar points={points} streak={streak} />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/funding" element={<Funding />} />
          <Route path="/account" element={<Account points={points} streak={streak} />} />
          <Route path="/classify" element={<Classify />} />
          <Route path="/classify/:taskType" element={<Classify />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
