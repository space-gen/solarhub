/**
 * src/App.tsx
 *
 * Root application component for SolarHub.
 *
 * Responsibilities:
 *  1. Provides the HashRouter so navigation works correctly on GitHub Pages
 *     without requiring server-side URL rewriting.
 *  2. Declares the application's route tree:
 *       /          → Home page
 *       /classify  → Classification workflow
 *     (No leaderboard route per project requirements.)
 *  3. Wraps page changes in AnimatePresence so Framer Motion's page transition
 *     variants can play exit animations before the incoming page mounts.
 *  4. Manages the global "points" counter in React state and passes it down
 *     to the NavigationBar (for the compact badge) and the Classify page
 *     (which awards points on submission).
 *  5. Renders the NavigationBar above all routes so it persists across
 *     page transitions.
 *
 * Why HashRouter?
 *   GitHub Pages serves the repository as a static site at
 *   https://<org>.github.io/solarhub/.  It doesn't know how to route
 *   arbitrary sub-paths back to index.html, so BrowserRouter would break
 *   on page reload.  HashRouter stores the route in the URL hash (#/classify)
 *   which the browser never sends to the server, avoiding 404s.
 */

import { useState }                            from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence }                     from 'framer-motion';
import NavigationBar                           from '@/components/NavigationBar';
import Home                                    from '@/pages/Home';
import Classify                                from '@/pages/Classify';
import { useGitHubAuth }                       from '@/hooks/useGitHubAuth';

// ---------------------------------------------------------------------------
// Point state persistence helpers
// ---------------------------------------------------------------------------

const POINTS_STORAGE_KEY = 'solarhub_points';

/**
 * loadPoints
 * Reads the user's accumulated points from localStorage so they persist
 * across page refreshes.
 */
function loadPoints(): number {
  try {
    const stored = localStorage.getItem(POINTS_STORAGE_KEY);
    if (stored === null) return 0;
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

/**
 * savePoints
 * Persists the points value to localStorage.
 */
function savePoints(points: number): void {
  try {
    localStorage.setItem(POINTS_STORAGE_KEY, points.toString());
  } catch {
    // Ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

// ---------------------------------------------------------------------------
// Inner app – needs access to useLocation (which requires Router context)
// ---------------------------------------------------------------------------

/**
 * AppRoutes
 *
 * Separated from the Router wrapper so we can call useLocation() which
 * requires being inside a Router context.  AnimatePresence needs the current
 * `key` to know when to trigger exit animations.
 */
function AppRoutes({
  points,
  onPointsChange,
}: {
  points:         number;
  onPointsChange: (p: number) => void;
}) {
  const location = useLocation();

  return (
    /*
     * AnimatePresence mode="wait":
     *   Waits for the exiting page's exit animation to finish before mounting
     *   the next page.  This prevents two pages being visible simultaneously.
     *
     * The `key` prop is set to the pathname so AnimatePresence can detect
     * route changes even when only the search/hash changes.
     */
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* Home page – the landing/hero page */}
        <Route path="/"        element={<Home />} />

        {/* Classify page – the main citizen-science workflow */}
        <Route
          path="/classify"
          element={<Classify points={points} onPointsChange={onPointsChange} />}
        />
        <Route
          path="/classify/:taskType"
          element={<Classify points={points} onPointsChange={onPointsChange} />}
        />

        {/* Catch-all: redirect any unknown path to Home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Root App component
// ---------------------------------------------------------------------------

export default function App() {
  const [points, setPoints] = useState<number>(loadPoints);
  const { user, loading: authLoading, isConfigured, signIn, signOut } = useGitHubAuth();

  function handlePointsChange(newPoints: number) {
    setPoints(newPoints);
    savePoints(newPoints);
  }

  return (
    <HashRouter>
      <div className="dark min-h-screen bg-cosmic-950 text-slate-100 font-sans">
        <NavigationBar
          points={points}
          user={user}
          authLoading={authLoading}
          isOAuthConfigured={isConfigured}
          onSignIn={signIn}
          onSignOut={signOut}
        />
        <main>
          <AppRoutes points={points} onPointsChange={handlePointsChange} />
        </main>
      </div>
    </HashRouter>
  );
}
