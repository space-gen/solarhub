/**
 * src/components/NavigationBar.tsx
 *
 * The main site navigation bar for SolarHub.
 *
 * Features:
 *  - Glassmorphism "frosted" appearance that sits above the cosmic background.
 *  - Animated SVG sun logo in the top-left corner.
 *  - Desktop navigation links with an animated active-indicator underline.
 *  - Mobile hamburger menu that slides down via Framer Motion AnimatePresence.
 *  - Points display badge in the top-right corner.
 *  - Scroll-aware: the bar gains additional shadow when the page is scrolled.
 *
 * Props:
 *   points  – current user points total; passed through to PointsDisplay.
 */

import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PointsDisplay from '@/components/PointsDisplay';
import { slideDown, itemVariants } from '@/animations/pageTransitions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavBarProps {
  /** Accumulated user points shown in the top-right badge */
  points: number;
}

// ---------------------------------------------------------------------------
// Navigation link definitions
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  to:    string;
}

/** List of top-level pages.  Leaderboard intentionally excluded per spec. */
const NAV_ITEMS: NavItem[] = [
  { label: 'Home',     to: '/'         },
  { label: 'Classify', to: '/classify' },
];

// ---------------------------------------------------------------------------
// Animated SVG Sun Logo
// ---------------------------------------------------------------------------

/**
 * SunLogo
 *
 * A compact animated SVG that shows a glowing circle (the solar disc) with
 * eight radiating corona-ray lines that slowly rotate.  Pure SVG + Framer
 * Motion, no images or fonts required.
 */
function SunLogo() {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      {/* Outer rotating corona rays */}
      <motion.svg
        viewBox="0 0 40 40"
        className="absolute inset-0 w-full h-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
      >
        {/* 8 evenly-spaced rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <line
            key={angle}
            x1="20" y1="4"
            x2="20" y2="8"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle} 20 20)`}
            opacity="0.8"
          />
        ))}
      </motion.svg>

      {/* Solar disc – pulsing orange circle */}
      <motion.div
        className="w-5 h-5 rounded-full bg-gradient-to-br from-solar-400 to-solar-600 z-10"
        animate={{
          boxShadow: [
            '0 0 8px rgba(249,115,22,0.6)',
            '0 0 20px rgba(249,115,22,0.9)',
            '0 0 8px rgba(249,115,22,0.6)',
          ],
        }}
        transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hamburger icon (mobile)
// ---------------------------------------------------------------------------

interface HamburgerProps {
  isOpen:   boolean;
  onClick:  () => void;
}

/**
 * HamburgerButton
 *
 * An animated three-line (→ X) hamburger / close icon button for mobile.
 * Each bar morphs via Framer Motion when the menu opens.
 */
function HamburgerButton({ isOpen, onClick }: HamburgerProps) {
  return (
    <motion.button
      onClick={onClick}
      className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5
                 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10
                 transition-colors focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-solar-500"
      whileTap={{ scale: 0.9 }}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      {/* Top bar */}
      <motion.span
        className="block w-5 h-0.5 bg-slate-300 rounded"
        animate={isOpen
          ? { rotate: 45, y: 8, width: '20px' }
          : { rotate: 0,  y: 0, width: '20px' }
        }
        transition={{ duration: 0.25 }}
      />
      {/* Middle bar */}
      <motion.span
        className="block h-0.5 bg-slate-300 rounded"
        animate={isOpen
          ? { opacity: 0, width: '0px' }
          : { opacity: 1, width: '20px' }
        }
        transition={{ duration: 0.2 }}
      />
      {/* Bottom bar */}
      <motion.span
        className="block w-5 h-0.5 bg-slate-300 rounded"
        animate={isOpen
          ? { rotate: -45, y: -8, width: '20px' }
          : { rotate: 0,   y: 0,  width: '20px' }
        }
        transition={{ duration: 0.25 }}
      />
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function NavigationBar({ points }: NavBarProps) {
  const location = useLocation();

  // Whether the mobile menu is visible
  const [menuOpen, setMenuOpen] = useState(false);

  // Whether the page has been scrolled past 10 px (adds extra shadow)
  const [scrolled, setScrolled] = useState(false);

  // ── Scroll listener ───────────────────────────────────────────────────────
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Close mobile menu when the route changes ──────────────────────────────
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Fixed top bar                                                        */}
      {/* ------------------------------------------------------------------ */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={[
          'fixed top-0 left-0 right-0 z-50',
          'glass-dark border-b border-white/[0.06]',
          scrolled ? 'shadow-glass-lg' : '',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Brand / Logo ──────────────────────────────────────────── */}
            <NavLink
              to="/"
              className="flex items-center gap-3 group select-none"
              aria-label="SolarHub home"
            >
              <SunLogo />
              <span className="text-xl font-bold tracking-tight">
                <span className="gradient-text">Solar</span>
                <span className="text-slate-200">Hub</span>
              </span>
            </NavLink>

            {/* ── Desktop navigation links ──────────────────────────────── */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <DesktopNavLink key={item.to} item={item} />
              ))}
            </div>

            {/* ── Right side: points + hamburger ────────────────────────── */}
            <div className="flex items-center gap-3">
              <PointsDisplay points={points} compact />
              <HamburgerButton isOpen={menuOpen} onClick={() => setMenuOpen(v => !v)} />
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile dropdown menu                                                 */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            variants={slideDown}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={[
              'fixed top-16 left-0 right-0 z-40',
              'glass-dark border-b border-white/[0.06]',
              'shadow-glass-lg',
            ].join(' ')}
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.to}
                  variants={itemVariants}
                  custom={i}
                >
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => [
                      'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-solar-500/20 text-solar-300 border border-solar-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
                    ].join(' ')}
                  >
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// Desktop nav link sub-component
// ---------------------------------------------------------------------------

interface DesktopNavLinkProps {
  item: NavItem;
}

/**
 * DesktopNavLink
 *
 * Renders a single nav link on desktop.  An animated orange underline
 * slides in when the link is active (using Framer Motion layoutId so the
 * indicator moves smoothly between links).
 */
function DesktopNavLink({ item }: DesktopNavLinkProps) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => [
        'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors',
        isActive
          ? 'text-solar-300'
          : 'text-slate-400 hover:text-slate-200',
      ].join(' ')}
    >
      {({ isActive }) => (
        <>
          {item.label}
          {/* Animated underline indicator */}
          {isActive && (
            <motion.span
              layoutId="nav-active-indicator"
              className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-solar-500"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}
