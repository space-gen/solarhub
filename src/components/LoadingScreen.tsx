/**
 * src/components/LoadingScreen.tsx
 *
 * A full-screen loading overlay shown while the app fetches tasks on first
 * render, or during any async transition that requires the user to wait.
 *
 * Visual design:
 *  - Deep space background (inherits from body).
 *  - Central animated "sun" built entirely from SVG + Framer Motion:
 *      · Solid glowing core circle
 *      · Two counter-rotating elliptical orbit rings
 *      · Eight corona-ray lines that slowly spin
 *      · A pulsing radial glow behind the sun
 *  - "Analysing Solar Data…" typewriter-style text below.
 *  - Horizontal progress pulse bar at the bottom.
 *
 * No external images or icon libraries are required – the entire visual
 * is constructed from inline SVG and Tailwind/Framer Motion classes.
 *
 * Props:
 *   message  – Optional override for the loading message text.
 */

import { motion } from 'framer-motion';

interface LoadingScreenProps {
  /** Optional custom message shown below the animation.  Defaults to "Analysing Solar Data…" */
  message?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * AnimatedSun
 *
 * The centrepiece of the loading screen.  Built from layered SVG elements
 * animated independently to create a living-star feel.
 */
function AnimatedSun() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">

      {/* ── Pulsing radial glow (behind everything) ──────────────────────── */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
      />

      {/* ── Outer orbit ring (clockwise) ─────────────────────────────────── */}
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
      >
        <ellipse
          cx="100" cy="100"
          rx="90" ry="30"
          fill="none"
          stroke="rgba(249,115,22,0.3)"
          strokeWidth="1.5"
          strokeDasharray="8 6"
        />
      </motion.svg>

      {/* ── Inner orbit ring (counter-clockwise) ─────────────────────────── */}
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 12, ease: 'linear', repeat: Infinity }}
      >
        <ellipse
          cx="100" cy="100"
          rx="60" ry="20"
          fill="none"
          stroke="rgba(217,70,239,0.3)"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
      </motion.svg>

      {/* ── Corona rays (slow rotation) ──────────────────────────────────── */}
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
      >
        {/* 12 rays evenly distributed around the centre */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle  = (i * 30 * Math.PI) / 180;
          const innerR = 52;
          const outerR = 68 + (i % 3 === 0 ? 10 : 0); // every 3rd ray is longer
          return (
            <line
              key={i}
              x1={100 + innerR * Math.cos(angle)}
              y1={100 + innerR * Math.sin(angle)}
              x2={100 + outerR * Math.cos(angle)}
              y2={100 + outerR * Math.sin(angle)}
              stroke={i % 2 === 0 ? 'rgba(251,146,60,0.7)' : 'rgba(249,115,22,0.5)'}
              strokeWidth={i % 3 === 0 ? 2 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
      </motion.svg>

      {/* ── Solar disc (the "sun" itself) ─────────────────────────────────── */}
      <motion.div
        className="relative z-10 w-20 h-20 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #fbbf24, #f97316 60%, #c2410c)',
        }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(249,115,22,0.6), 0 0 40px rgba(249,115,22,0.3)',
            '0 0 40px rgba(249,115,22,0.9), 0 0 80px rgba(249,115,22,0.5)',
            '0 0 20px rgba(249,115,22,0.6), 0 0 40px rgba(249,115,22,0.3)',
          ],
        }}
        transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity }}
      >
        {/* Surface texture – subtle radial speckles */}
        <div
          className="absolute inset-2 rounded-full opacity-30"
          style={{
            background:
              'radial-gradient(circle at 60% 40%, rgba(255,255,255,0.4) 0%, transparent 40%), ' +
              'radial-gradient(circle at 30% 70%, rgba(0,0,0,0.2) 0%, transparent 40%)',
          }}
        />
      </motion.div>

      {/* ── Orbiting "planet" dot ─────────────────────────────────────────── */}
      {/* Use a wrapper div at the centre, then offset the dot with translateX */}
      <div
        className="absolute"
        style={{ width: 0, height: 0, top: '50%', left: '50%' }}
      >
        <motion.div
          className="w-3 h-3 rounded-full bg-cosmic-400 shadow-cosmic"
          style={{ marginLeft: -6, marginTop: -6 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
        >
          {/* The planet sits 72px from centre via translateX on this inner wrapper */}
          <div
            className="w-3 h-3 rounded-full bg-cosmic-400 shadow-cosmic absolute"
            style={{ transform: 'translateX(72px)', top: 0, left: 0 }}
          />
        </motion.div>
      </div>
    </div>
  );
}

/**
 * TypewriterText
 *
 * Fakes a typewriter effect by animating the width of a clip container,
 * revealing the text character by character.  Purely CSS-driven.
 */
function TypewriterText({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="overflow-hidden"
    >
      <motion.p
        className="text-slate-300 text-lg font-mono tracking-widest whitespace-nowrap"
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ delay: 0.8, duration: text.length * 0.05, ease: 'steps(40, end)' }}
        style={{ overflow: 'hidden' }}
      >
        {text}
      </motion.p>
    </motion.div>
  );
}

/**
 * PulseBar
 *
 * An indeterminate progress bar that shows a scanning/pulsing solar-orange
 * gradient moving left to right.  Used when we don't know the exact progress.
 */
function PulseBar() {
  return (
    <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #f97316, transparent)',
          width: '40%',
        }}
        animate={{ x: ['-100%', '300%'] }}
        transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LoadingScreen({ message = 'Analysing Solar Data…' }: LoadingScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center
                 bg-cosmic-950 cosmic-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Star particles in the background */}
      <StarField />

      {/* Main content stack */}
      <div className="relative z-10 flex flex-col items-center gap-8">

        {/* Animated sun */}
        <AnimatedSun />

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Solar</span>
            <span className="text-slate-200">Hub</span>
          </h1>
          <TypewriterText text={message} />
        </motion.div>

        {/* Progress pulse */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <PulseBar />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Background star field
// ---------------------------------------------------------------------------

/**
 * StarField
 *
 * Renders a fixed set of static star "dots" at pseudo-random positions.
 * Each star has a slightly different size and opacity to feel natural.
 * A subset twinkle via Framer Motion.
 *
 * Stars are seeded deterministically so the layout is stable between renders.
 */
function StarField() {
  // Pre-computed star data (deterministic – no Math.random() in render)
  const stars = STAR_DATA;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left:   `${star.x}%`,
            top:    `${star.y}%`,
            width:  `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
          }}
          animate={star.twinkle
            ? { opacity: [star.opacity, star.opacity * 0.2, star.opacity] }
            : undefined
          }
          transition={star.twinkle
            ? { duration: star.duration, ease: 'easeInOut',
                repeat: Infinity, delay: star.delay }
            : undefined
          }
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Static star seed data (generated once, not at runtime)
// ---------------------------------------------------------------------------
interface StarDatum {
  id:       number;
  x:        number;
  y:        number;
  size:     number;
  opacity:  number;
  twinkle:  boolean;
  duration: number;
  delay:    number;
}

/** 80 deterministically-positioned stars */
const STAR_DATA: StarDatum[] = Array.from({ length: 80 }, (_, i) => {
  // Simple LCG to get deterministic "random" values from an index
  const seed = (i * 2654435761) >>> 0;
  const r    = (n: number) => ((seed * (n + 1) * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  return {
    id:       i,
    x:        r(0) * 100,
    y:        r(1) * 100,
    size:     r(2) < 0.7 ? 1 : r(2) < 0.9 ? 2 : 3,
    opacity:  0.2 + r(3) * 0.6,
    twinkle:  r(4) > 0.6,
    duration: 2 + r(5) * 4,
    delay:    r(6) * 3,
  };
});
