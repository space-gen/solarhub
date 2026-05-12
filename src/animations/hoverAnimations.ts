/**
 * src/animations/hoverAnimations.ts
 *
 * Framer Motion variants and animation objects specifically for interactive
 * hover / tap states on buttons, cards, and other UI elements.
 *
 * Two patterns are used here:
 *
 *  1. Variants  – named states ("rest", "hover", "tap") wired to a component
 *                 via whileHover / whileTap / variants props.
 *
 *  2. Transition configs – reusable `transition` objects that can be spread
 *                          into any motion component.
 *
 * Usage examples:
 *
 *   // Button with glow
 *   <motion.button
 *     variants={buttonVariants}
 *     initial="rest"
 *     whileHover="hover"
 *     whileTap="tap"
 *   >
 *     Click me
 *   </motion.button>
 *
 *   // Card lift
 *   <motion.div
 *     variants={cardVariants}
 *     initial="rest"
 *     whileHover="hover"
 *   >
 *     ...
 *   </motion.div>
 */

import type { Variants, Transition } from 'framer-motion';

// ---------------------------------------------------------------------------
// Shared transition configs
// ---------------------------------------------------------------------------

/**
 * springTransition – bouncy spring used for scale/transform animations.
 * Feels physical and satisfying on hover.
 */
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

/**
 * smoothTransition – eased tween for opacity / colour changes that shouldn't
 * feel bouncy.
 */
export const smoothTransition: Transition = {
  type: 'tween',
  duration: 0.2,
  ease: 'easeOut',
};

// ---------------------------------------------------------------------------
// Button variants
// ---------------------------------------------------------------------------

/**
 * buttonVariants
 *
 * Standard button scale + brightness lift.
 * Works well for the primary solar CTA buttons.
 */
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: springTransition,
  },
  tap: {
    scale: 0.96,
    transition: { ...springTransition, stiffness: 600 },
  },
};

/**
 * glowButtonVariants
 *
 * Like buttonVariants but also animates the box-shadow to create a
 * solar-orange glow that pulses on hover.
 */
export const glowButtonVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 0 0px rgba(249,115,22,0)',
  },
  hover: {
    scale: 1.05,
    boxShadow: '0 0 30px rgba(249,115,22,0.6), 0 0 60px rgba(249,115,22,0.3)',
    transition: springTransition,
  },
  tap: {
    scale: 0.97,
    boxShadow: '0 0 10px rgba(249,115,22,0.4)',
    transition: { ...springTransition, stiffness: 600 },
  },
};

/**
 * iconButtonVariants
 *
 * Lighter scale used for small icon buttons where large movement would feel
 * clunky.
 */
export const iconButtonVariants: Variants = {
  rest:  { scale: 1, rotate: 0 },
  hover: { scale: 1.15, rotate: 5,  transition: springTransition },
  tap:   { scale: 0.90, rotate: -5, transition: { ...springTransition, stiffness: 600 } },
};

// ---------------------------------------------------------------------------
// Card variants
// ---------------------------------------------------------------------------

/**
 * cardVariants
 *
 * Lifts a card upward with a subtle scale on hover, creating a sense of
 * the card floating off the page.  Shadow deepens on hover.
 */
export const cardVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  },
  hover: {
    y: -6,
    scale: 1.01,
    boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 30px rgba(249,115,22,0.15)',
    transition: springTransition,
  },
};

/**
 * glassCardVariants
 *
 * Card variant with a border glow on hover – suited to the glassmorphism cards
 * used throughout the app.
 */
export const glassCardVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hover: {
    y: -4,
    scale: 1.015,
    boxShadow: '0 16px 56px rgba(0,0,0,0.6), 0 0 40px rgba(249,115,22,0.2)',
    borderColor: 'rgba(249,115,22,0.4)',
    transition: springTransition,
  },
};

// ---------------------------------------------------------------------------
// Classification option button (used in AnnotationPanel)
// ---------------------------------------------------------------------------

/**
 * classifyButtonVariants
 *
 * Larger scale with a colour-border glow.  The "selected" state has a
 * persistent glow so users always know their current selection.
 */
export const classifyButtonVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  },
  hover: {
    scale: 1.04,
    y: -3,
    boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
    transition: springTransition,
  },
  tap: {
    scale: 0.97,
    y: 0,
    transition: { ...springTransition, stiffness: 600 },
  },
  selected: {
    scale: 1.02,
    y: -2,
    boxShadow: '0 8px 32px rgba(249,115,22,0.4), 0 0 60px rgba(249,115,22,0.2)',
    transition: springTransition,
  },
};

// ---------------------------------------------------------------------------
// Scale-only helpers (for images, avatars, etc.)
// ---------------------------------------------------------------------------

/**
 * scaleOnHover – minimal scale transform only.
 */
export const scaleOnHover: Variants = {
  rest:  { scale: 1 },
  hover: { scale: 1.08, transition: springTransition },
  tap:   { scale: 0.95, transition: { ...springTransition, stiffness: 600 } },
};

// ---------------------------------------------------------------------------
// Glow ring (for the animated sun / decorative elements)
// ---------------------------------------------------------------------------

/**
 * glowRingVariants
 *
 * Used on the SVG corona rings around the animated sun.  Pulses the opacity
 * and scale in and out creating a living, breathing star effect.
 */
export const glowRingVariants: Variants = {
  pulse: {
    scale:   [1, 1.08, 1],
    opacity: [0.6, 0.9, 0.6],
    transition: {
      duration: 3,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
};

/**
 * rotateVariants
 *
 * Continuous rotation – used on orbit rings and solar corona decorations.
 */
export const rotateVariants: Variants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 20,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
  spinSlow: {
    rotate: 360,
    transition: {
      duration: 40,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
  spinReverse: {
    rotate: -360,
    transition: {
      duration: 25,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
};
