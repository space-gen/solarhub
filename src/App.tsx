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

const POINTS_STORAGE_KEY = 'solarhub_points';

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

function savePoints(points: number): void {
  try {
    localStorage.setItem(POINTS_STORAGE_KEY, points.toString());
  } catch {
    // Ignore storage errors
  }
}

function AppRoutes({
  points,
  onPointsChange,
}: {
  points: number;
  onPointsChange: (p: number) => void;
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
          element={<Classify points={points} onPointsChange={onPointsChange} />}
        />
        <Route
          path="/classify/:taskType"
          element={<Classify points={points} onPointsChange={onPointsChange} />}
        />

        <Route path="*" element={<Home />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [points, setPoints] = useState<number>(loadPoints);

  function handlePointsChange(newPoints: number) {
    setPoints(newPoints);
    savePoints(newPoints);
  }

  // Sync points from dailyProgressService on app startup so header shows accurate value
  useEffect(() => {
    void loadDailyProgress().then(progress => {
      if (typeof progress.points === 'number' && progress.points !== points) {
        handlePointsChange(progress.points);
      }
    }).catch(() => {
      // ignore — keep current points
    });
  }, []);

  return (
    <HashRouter>
      <div className="dark flex flex-col min-h-screen bg-cosmic-950 text-slate-100 font-sans">
        <NavigationBar points={points} />
        <main className="flex-1">
          <AppRoutes points={points} onPointsChange={handlePointsChange} />
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}
