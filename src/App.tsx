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

import { useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import NavigationBar from '@/components/NavigationBar';
import Home from '@/pages/Home';
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

  return (
    <HashRouter>
      <div className="dark min-h-screen bg-cosmic-950 text-slate-100 font-sans">
        <NavigationBar points={points} />
        <main>
          <AppRoutes points={points} onPointsChange={handlePointsChange} />
        </main>
      </div>
    </HashRouter>
  );
}
