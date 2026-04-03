/**
 * src/components/NavigationBar.tsx
 *
 * The main site navigation bar for SolarHub.
 *
 * Auth UX lives on /connect, but the header provides a minimal status:
 *  - If NOT connected to GitHub: show a "Connect" button.
 *  - If connected: show the user's GitHub avatar.
 */

import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PointsDisplay from '@/components/PointsDisplay';
import { slideDown, itemVariants } from '@/animations/pageTransitions';
import { getStoredUser, type GitHubUser } from '@/services/githubAuthService';

interface NavBarProps {
  points: number;
}

interface NavItem {
  label: string;
  to:    string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',     to: '/'         },
  { label: 'Classify', to: '/classify' },
  { label: 'About',    to: '/about'    },
  { label: 'Contact',  to: '/contact'  },
];

function SunLogo() {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <motion.svg
        viewBox="0 0 40 40"
        className="absolute inset-0 w-full h-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
      >
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

interface HamburgerProps {
  isOpen: boolean;
  onClick: () => void;
}

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
      <motion.span
        className="block w-5 h-0.5 bg-slate-300 rounded"
        animate={isOpen
          ? { rotate: 45, y: 8, width: '20px' }
          : { rotate: 0,  y: 0, width: '20px' }
        }
        transition={{ duration: 0.25 }}
      />
      <motion.span
        className="block h-0.5 bg-slate-300 rounded"
        animate={isOpen
          ? { opacity: 0, width: '0px' }
          : { opacity: 1, width: '20px' }
        }
        transition={{ duration: 0.2 }}
      />
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

interface DesktopNavLinkProps {
  item: NavItem;
}

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

function GitHubStatusPill({ user }: { user: GitHubUser | null }) {
  if (user) {
    return (
      <NavLink
        to="/connect"
        className="flex items-center gap-2 px-2 py-1 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
        aria-label="GitHub connected — open Connect page"
        title={`GitHub: ${user.login}`}
      >
        <img
          src={user.avatar_url}
          alt={user.login}
          className="w-7 h-7 rounded-full ring-1 ring-solar-500/40"
        />
      </NavLink>
    );
  }

  return (
    <NavLink
      to="/connect"
      className="btn-solar px-3 py-2 rounded-xl text-sm"
      aria-label="Connect accounts"
    >
      Connect
    </NavLink>
  );
}

export default function NavigationBar({ points }: NavBarProps) {
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [ghUser, setGhUser] = useState<GitHubUser | null>(() => getStoredUser());

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const sync = () => setGhUser(getStoredUser());
    sync();
    window.addEventListener('solarhub:github-auth-changed', sync);
    return () => window.removeEventListener('solarhub:github-auth-changed', sync);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={[
          'fixed top-0 left-0 right-0 z-50',
          'glass-dark border-b border-white/[0.06]',
          scrolled ? 'shadow-glass-lg' : '',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <NavLink
              to="/"
              className="flex items-center gap-3 group select-none"
              aria-label="SolarHub home"
            >
              <SunLogo />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight leading-tight">
                  <span className="gradient-text">Solar</span>
                  <span className="text-slate-200">Hub</span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold -mt-0.5 group-hover:text-solar-400 transition-colors">
                  by the team
                </span>
              </div>
            </NavLink>

            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <DesktopNavLink key={item.to} item={item} />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <GitHubStatusPill user={ghUser} />
              {ghUser && <PointsDisplay points={points} compact />}
              <HamburgerButton isOpen={menuOpen} onClick={() => setMenuOpen(v => !v)} />
            </div>
          </div>
        </div>
      </motion.nav>

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
                <motion.div key={item.to} variants={itemVariants} custom={i}>
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
