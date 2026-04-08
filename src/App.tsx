/**
 * src/App.tsx
 *
 * Root application component for SolarHub.
 *
 * Responsibilities:
 *  1. Provides the HashRouter so navigation works correctly on GitHub Pages
 *     without requiring server-side URL rewriting.
 *  2. Declares the application's route tree.
 *  3. Wraps page changes in AnimatePresence so Framer Motion's page transition
 *     variants can play exit animations before the incoming page mounts.
 *  4. Manages the global "points" counter in React state and passes it down.
 *
 * Auth UX is intentionally handled on /connect (not in the header).
 */

import { useState, useEffect } from 'react';
import { loadDailyProgress } from '@/services/dailyProgressService';
import { initializeFromGitHub } from '@/services/githubSyncService';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Funding from '@/pages/Funding';
import Classify from '@/pages/Classify';
import Connect from '@/pages/Connect';

function AppRoutes({
  points,
  onPointsChange,
  onStreakChange,
  streak,
}: {
  points: number;
  onPointsChange: (p: number) => void;
  onStreakChange: (s: number) => void;
  streak: number;
}) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/funding" element={<Funding />} />

        <Route path="/connect" element={<Connect />} />

        <Route
          path="/classify"
          element={<Classify points={points} onPointsChange={onPointsChange} onStreakChange={onStreakChange} streak={streak} />}
        />
        <Route
          path="/classify/:taskType"
          element={<Classify points={points} onPointsChange={onPointsChange} onStreakChange={onStreakChange} streak={streak} />}
        />

        <Route path="*" element={<Home />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [points, setPoints] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  function handlePointsChange(newPoints: number) {
    setPoints(newPoints);
  }

  function handleStreakChange(newStreak: number) {
    setStreak(newStreak);
  }

  // Initialize progress.json from GitHub and sync points on app startup
  useEffect(() => {
    const initialize = async () => {
      // Initialize progress.json from GitHub (if user is authenticated)
      try {
        await initializeFromGitHub();
      } catch (err) {
        console.warn('[App] Failed to initialize progress.json from GitHub:', err);
      }

      // Load daily progress and update points
      try {
        const progress = await loadDailyProgress();
        if (typeof progress.points === 'number' && progress.points !== points) {
          handlePointsChange(progress.points);
        }
        if (typeof progress.streak === 'number' && progress.streak !== streak) {
          handleStreakChange(progress.streak);
        }
      } catch (err) {
        console.warn('[App] Failed to load daily progress:', err);
      }
    };

    void initialize();
  }, []);

  return (
    <HashRouter>
      <div className="dark flex flex-col min-h-screen bg-cosmic-950 text-slate-100 font-sans">
        <NavigationBar points={points} streak={streak} />
        <main className="flex-1">
          <AppRoutes points={points} onPointsChange={handlePointsChange} onStreakChange={handleStreakChange} streak={streak} />
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}
