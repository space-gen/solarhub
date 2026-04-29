/**
 * src/animations/pageTransitions.ts
 *
 * Framer Motion animation variants used for page-level transitions and
 * staggered list entrances throughout SolarHub.
 *
 * Framer Motion variants are plain objects that map named states
 * ("hidden", "visible", "exit", …) to animation targets.  They are
 * consumed by <motion.*> components via the `variants`, `initial`, and
 * `animate` props.
 *
 * Usage:
 *   import { pageVariants, containerVariants, itemVariants } from '@/animations/pageTransitions';
 *
 *   <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit">
 *     <motion.ul variants={containerVariants}>
 *       {items.map(i => <motion.li key={i.id} variants={itemVariants} />)}
 *     </motion.ul>
 *   </motion.div>
 */

import type { Variants } from 'framer-motion';

// ---------------------------------------------------------------------------
// Page wrapper transitions
// ---------------------------------------------------------------------------

/**
 * pageVariants
 *
 * Used on the top-level <motion.div> that wraps each route page.
 * Provides a smooth fade + slight upward slide when entering and a
 * downward fade when leaving.
 *
 * "hidden"  – initial state before the page mounts
 * "visible" – fully rendered state
 * "exit"    – state as the page unmounts (triggered by AnimatePresence)
 */
export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,                  // start 24 px below final position
    scale: 0.98,            // very slight scale-down feels premium
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],  // custom cubic-bezier – fast-in, smooth-out
      when: 'beforeChildren',    // parent finishes before children animate
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

// ---------------------------------------------------------------------------
// Container / list stagger
// ---------------------------------------------------------------------------

/**
 * containerVariants
 *
 * Applied to a list/grid container.  When "visible", Framer Motion staggers
 * the children's animations so they cascade rather than all firing at once.
 */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.10,   // 100 ms delay between each child
      delayChildren:   0.15,   // first child waits 150 ms after container
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
};

/**
 * containerVariantsFast
 *
 * Same concept as containerVariants but with tighter timing for smaller lists.
 */
export const containerVariantsFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren:   0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

// ---------------------------------------------------------------------------
// Individual list items
// ---------------------------------------------------------------------------

/**
 * itemVariants
 *
 * Each card/list-row in a staggered container should use this variant.
 * Slides up from 20 px below and fades in.
 */
export const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

/**
 * itemVariantsLeft
 *
 * Variant that slides in from the left – useful for detail panels.
 */
export const itemVariantsLeft: Variants = {
  hidden:  { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.25 } },
};

/**
 * itemVariantsRight
 *
 * Variant that slides in from the right – useful for panels entering from
 * the opposite side to itemVariantsLeft.
 */
export const itemVariantsRight: Variants = {
  hidden:  { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, x: 20, transition: { duration: 0.25 } },
};

// ---------------------------------------------------------------------------
// Cosmic entrance (hero elements)
// ---------------------------------------------------------------------------

/**
 * cosmicEntrance
 *
 * A dramatic entrance for hero-level elements: fades in from a larger scale
 * and slight blur.  Used on the main title and hero sun on the Home page.
 */
export const cosmicEntrance: Variants = {
  hidden: {
    opacity: 0,
    scale: 1.15,
    filter: 'blur(12px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 1.0,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

/**
 * cosmicEntranceUp
 *
 * Like cosmicEntrance but combines a scale with an upward-slide.
 */
export const cosmicEntranceUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// ---------------------------------------------------------------------------
// Fade-only (no movement) – for overlays and modals
// ---------------------------------------------------------------------------

export const fadeVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit:    { opacity: 0, transition: { duration: 0.25 } },
};

// ---------------------------------------------------------------------------
// Slide-down (for mobile menus / dropdowns)
// ---------------------------------------------------------------------------

export const slideDown: Variants = {
  hidden:  { opacity: 0, height: 0, overflow: 'hidden' },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};
