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
import type { GitHubUser } from '@/services/githubAuthService';
import type { DeviceFlowState } from '@/hooks/useGitHubAuth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavBarProps {
  points: number;

  puterUser: PuterUser | null;
  puterLoading: boolean;
  onPuterSignIn: () => void;
  onPuterSignOut: () => void;

  githubUser: GitHubUser | null;
  githubAuthLoading: boolean;
  isGitHubOAuthConfigured: boolean;
  deviceFlow: DeviceFlowState;
  onGitHubSignIn: () => void;
  onGitHubCancel: () => void;
  onGitHubSignOut: () => void;
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
// Puter auth button
// ---------------------------------------------------------------------------

function PuterAuthButton({
  user, loading, onSignIn, onSignOut,
}: {
  user:     PuterUser | null;
  loading:  boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
        <motion.span
          className="w-4 h-4 border-2 border-white/30 border-t-solar-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
        />
        <span className="text-xs text-slate-500 hidden sm:block">Puter…</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(v => !v)}
          className="flex items-center gap-2 px-2 py-1 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
          aria-label="Puter account menu"
        >
          <span className="text-xs text-slate-300 font-medium hidden sm:block">{user.username}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-solar-500/15 text-solar-300 border border-solar-500/25">Puter</span>
          <svg viewBox="0 0 12 12" className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5l3 3 3-3" />
          </svg>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 z-50 glass-dark rounded-xl border border-white/10 shadow-glass-lg overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/8">
                  <p className="text-sm font-semibold text-slate-200">{user.username}</p>
                  <p className="text-xs text-slate-500 truncate">{user.uuid}</p>
                </div>
                <button
                  onClick={() => { onSignOut(); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                >
                  Sign out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.button
      onClick={onSignIn}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
    >
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-solar-500/15 text-solar-300 border border-solar-500/25">Puter</span>
      Sign in
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// GitHub auth button
// ---------------------------------------------------------------------------

function GitHubAuthButton({
  user,
  loading,
  isConfigured,
  canStart,
  deviceFlow,
  onSignIn,
  onCancel,
  onSignOut,
}: {
  user:          GitHubUser | null;
  loading:       boolean;
  isConfigured:  boolean;
  canStart:      boolean;
  deviceFlow:    DeviceFlowState;
  onSignIn:      () => void;
  onCancel:      () => void;
  onSignOut:     () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!isConfigured) return null;

  if (!user && (deviceFlow.status === 'pending' || deviceFlow.status === 'polling')) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
        <span className="text-xs text-slate-400 hidden sm:block">Code:</span>
        <span className="text-xs font-semibold text-slate-200 tracking-wider">
          {deviceFlow.user_code ?? '…'}
        </span>
        <a
          href={deviceFlow.verification_uri}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-solar-300 hover:text-solar-200 underline underline-offset-2"
        >
          Open
        </a>
        <button
          onClick={onCancel}
          className="text-xs text-rose-400 hover:text-rose-300"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (!user && deviceFlow.status === 'error') {
    return (
      <button
        onClick={onSignIn}
        disabled={!canStart}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-500/30 bg-rose-500/10 text-rose-300"
        title={deviceFlow.error ?? 'GitHub sign-in failed'}
      >
        Retry GitHub
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
        <motion.span
          className="w-4 h-4 border-2 border-white/30 border-t-solar-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
        />
        <span className="text-xs text-slate-500 hidden sm:block">GitHub…</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(v => !v)}
          className="flex items-center gap-2 px-2 py-1 rounded-lg border border-white/10
                     hover:bg-white/5 transition-colors"
          aria-label="Account menu"
        >
          <img
            src={user.avatar_url}
            alt={user.login}
            className="w-6 h-6 rounded-full ring-1 ring-solar-500/40"
          />
          <span className="text-xs text-slate-300 font-medium hidden sm:block">
            {user.login}
          </span>
          <svg viewBox="0 0 12 12" className="w-3 h-3 text-slate-500" fill="none"
            stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5l3 3 3-3" />
          </svg>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <>
              {/* Backdrop to close */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{ opacity: 0,  y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 z-50 glass-dark rounded-xl
                           border border-white/10 shadow-glass-lg overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/8">
                  <p className="text-sm font-semibold text-slate-200">{user.login}</p>
                  {user.name && (
                    <p className="text-xs text-slate-500 truncate">{user.name}</p>
                  )}
                </div>
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400
                             hover:text-slate-200 hover:bg-white/5 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub Profile
                </a>
                <button
                  onClick={() => { onSignOut(); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400
                             hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Not signed in
  return (
    <motion.button
      onClick={onSignIn}
      disabled={!canStart}
      whileHover={!canStart ? undefined : { scale: 1.04 }}
      whileTap={!canStart ? undefined : { scale: 0.96 }}
      className={[
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium',
        'border border-white/10 transition-colors',
        canStart
          ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          : 'text-slate-600 cursor-not-allowed opacity-70',
      ].join(' ')}
      title={canStart ? 'Connect GitHub' : 'Sign in to Puter first'}
    >
      {/* GitHub Octocat icon */}
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
      {canStart ? 'Connect GitHub' : 'Connect GitHub'}
    </motion.button>
  );
}

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

export default function NavigationBar({
  points,
  puterUser,
  puterLoading,
  onPuterSignIn,
  onPuterSignOut,
  githubUser,
  githubAuthLoading,
  isGitHubOAuthConfigured,
  deviceFlow,
  onGitHubSignIn,
  onGitHubCancel,
  onGitHubSignOut,
}: NavBarProps) {
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

            {/* ── Right side: auth + points + hamburger ──────────────────── */}
            <div className="flex items-center gap-3">
              <PuterAuthButton
                user={puterUser}
                loading={puterLoading}
                onSignIn={onPuterSignIn}
                onSignOut={onPuterSignOut}
              />
              <GitHubAuthButton
                user={githubUser}
                loading={githubAuthLoading}
                isConfigured={isGitHubOAuthConfigured}
                canStart={Boolean(puterUser)}
                deviceFlow={deviceFlow}
                onSignIn={onGitHubSignIn}
                onCancel={onGitHubCancel}
                onSignOut={onGitHubSignOut}
              />
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
