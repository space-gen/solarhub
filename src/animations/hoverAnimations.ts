import type { TargetAndTransition, Transition } from 'framer-motion'

/**
 * Standard hover lift + glow animation for interactive cards.
 */
export const cardHover: TargetAndTransition = {
  y: -4,
  scale: 1.02,
  boxShadow: '0 20px 40px rgba(255, 149, 0, 0.2)',
}

/**
 * Transition config for card hover.
 */
export const cardHoverTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
}

/**
 * Button press (tap) animation.
 */
export const buttonTap: TargetAndTransition = {
  scale: 0.96,
}

/**
 * Subtle icon hover spin.
 */
export const iconHoverSpin: TargetAndTransition = {
  rotate: 15,
  scale: 1.15,
  transition: { type: 'spring', stiffness: 400, damping: 15 },
}

/**
 * Pulsing glow effect for the solar orb.
 */
export const solarPulse: TargetAndTransition = {
  boxShadow: [
    '0 0 40px rgba(255, 149, 0, 0.4), 0 0 80px rgba(255, 69, 0, 0.2)',
    '0 0 60px rgba(255, 149, 0, 0.6), 0 0 120px rgba(255, 69, 0, 0.3)',
    '0 0 40px rgba(255, 149, 0, 0.4), 0 0 80px rgba(255, 69, 0, 0.2)',
  ],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

/**
 * Nav link underline expansion.
 */
export const navLinkHover: TargetAndTransition = {
  color: '#ffb300',
  transition: { duration: 0.15 },
}
