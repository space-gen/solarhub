/**
 * src/components/PointsDisplay.tsx
 *
 * Animated points counter badge displayed in the navigation bar and on the
 * Classify page.
 *
 * Features:
 *  - Count-up animation when the `points` value increases (spring physics).
 *  - Glassmorphism pill / card styling consistent with the rest of the UI.
 *  - Animated solar-flare icon that "fires" briefly on each point increase.
 *  - Two display modes:
 *      compact  : small pill for the navbar (fewer details)
 *      full     : larger card for the Classify page sidebar (with label)
 *
 * The animation uses Framer Motion's `useMotionValue` + `useTransform` +
 * `animate()` to smoothly count from the previous value to the new one.
 *
 * Props:
 *   points   – current total points value (integer)
 *   compact  – if true, renders the small navbar badge; false → full card
 */

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { formatPoints } from '@/utils/formatters';

interface PointsDisplayProps {
  /** Current points total */
  points:  number;
  /** Use the small navbar pill if true; the larger full card if false */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Animated number sub-component
// ---------------------------------------------------------------------------

/**
 * AnimatedNumber
 *
 * Renders a number that smoothly counts up (or down) whenever `value` changes.
 * Uses Framer Motion's `animate()` function to drive a `useMotionValue` from
 * the previous displayed number to the new target, then rounds it for display.
 */
function AnimatedNumber({ value }: { value: number }) {
  // `motionValue` holds the intermediate (floating-point) animation state
  const motionValue = useMotionValue(value);

  // `rounded` stays in sync with `motionValue` but rounds to the nearest int
  const rounded = useTransform(motionValue, v => Math.round(v));

  // Ref to track the previously rendered value so we can animate FROM it
  const prevValueRef = useRef(value);

  useEffect(() => {
    // Kick off a smooth spring from the old value to the new one
    const controls = animate(motionValue, value, {
      type:      'spring',
      stiffness: 80,
      damping:   20,
    });

    prevValueRef.current = value;

    // Cancel the animation if the component unmounts mid-animation
    return controls.stop;
  }, [value, motionValue]);

  // `motion.span` subscribes to `rounded` automatically via Framer Motion
  return <motion.span>{rounded}</motion.span>;
}

// ---------------------------------------------------------------------------
// Solar flare burst icon
// ---------------------------------------------------------------------------

/**
 * FlareIcon
 *
 * Small animated SVG that represents a solar flare / burst.
 * When `burst` is true it plays a quick scale+opacity animation.
 */
function FlareIcon({ burst }: { burst: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="w-4 h-4 text-solar-400"
      fill="currentColor"
      animate={burst ? { scale: [1, 1.5, 1], opacity: [1, 0.6, 1] } : {}}
      transition={{ duration: 0.4 }}
    >
      {/* Star/sun burst shape */}
      <path d="M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z" />
    </motion.svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PointsDisplay({ points, compact = false }: PointsDisplayProps) {
  // Track whether the points just increased so we can trigger the burst anim
  const prevPointsRef = useRef(points);
  const pointsIncreased = points > prevPointsRef.current;

  useEffect(() => {
    prevPointsRef.current = points;
  }, [points]);

  // ── Compact mode (navbar pill) ────────────────────────────────────────────
  if (compact) {
    return (
      <motion.div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                   bg-solar-500/10 border border-solar-500/30
                   text-solar-300 text-sm font-semibold"
        animate={pointsIncreased
          ? { scale: [1, 1.1, 1], boxShadow: ['0 0 0px rgba(249,115,22,0)', '0 0 20px rgba(249,115,22,0.6)', '0 0 0px rgba(249,115,22,0)'] }
          : {}
        }
        transition={{ duration: 0.5 }}
      >
        <FlareIcon burst={pointsIncreased} />
        <AnimatedNumber value={points} />
        <span className="text-solar-500/60 text-xs">pts</span>
      </motion.div>
    );
  }

  // ── Full card mode (Classify page sidebar) ────────────────────────────────
  return (
    <motion.div
      className="glass rounded-2xl p-5 flex items-center gap-4"
      animate={pointsIncreased
        ? {
            boxShadow: [
              '0 8px 32px rgba(0,0,0,0.4)',
              '0 0 40px rgba(249,115,22,0.5)',
              '0 8px 32px rgba(0,0,0,0.4)',
            ],
          }
        : {}
      }
      transition={{ duration: 0.6 }}
    >
      {/* Icon circle */}
      <motion.div
        className="flex-shrink-0 w-12 h-12 rounded-full
                   bg-solar-500/20 border border-solar-500/30
                   flex items-center justify-center"
        animate={pointsIncreased
          ? { rotate: [0, 15, -15, 0] }
          : {}
        }
        transition={{ duration: 0.4 }}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-solar-400" fill="currentColor">
          <path d="M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z" />
        </svg>
      </motion.div>

      {/* Text */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">
          Your Points
        </p>
        <p className="text-2xl font-bold text-solar-300">
          <AnimatedNumber value={points} />
          <span className="text-sm text-solar-500/60 ml-1">pts</span>
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {formatPoints(points)} total earned
        </p>
      </div>
    </motion.div>
  );
}
