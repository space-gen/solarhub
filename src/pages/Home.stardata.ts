/**
 * src/pages/Home.stardata.ts
 *
 * Pre-computed, deterministic star positions for the hero starfield.
 *
 * Keeping the star data in a separate module prevents it from cluttering
 * Home.tsx and means it's computed once at module load time, not on
 * every render.
 *
 * Generation algorithm:
 *  - Uses a simple Linear Congruential Generator (LCG) seeded by the star
 *    index so the positions are identical every time the module loads.
 *  - Larger stars (size 3) appear less frequently.
 *  - Roughly 60% of stars twinkle independently.
 */

export interface StarDatum {
  id:       number;
  x:        number;   // % of viewport width
  y:        number;   // % of viewport height
  size:     number;   // pixels (1 | 2 | 3)
  opacity:  number;   // 0.1 – 0.8
  twinkle:  boolean;  // whether this star plays an opacity animation
  duration: number;   // animation duration in seconds
  delay:    number;   // animation delay in seconds
}

/**
 * Simple deterministic hash function that maps (index, slot) → [0, 1).
 */
function rnd(i: number, slot: number): number {
  // Combine index and slot into a single seed with bit mixing
  let h = Math.imul(i + 1, 2654435761) ^ Math.imul(slot + 1, 1540483477);
  h ^= h >>> 16;
  h  = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h  = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  // Bring into [0, 1)
  return (h >>> 0) / 0x100000000;
}

// Generate 120 stars deterministically
export const STAR_DATA: StarDatum[] = Array.from({ length: 120 }, (_, i) => {
  const sizeRoll = rnd(i, 2);
  return {
    id:       i,
    x:        rnd(i, 0) * 100,
    y:        rnd(i, 1) * 100,
    size:     sizeRoll < 0.65 ? 1 : sizeRoll < 0.90 ? 2 : 3,
    opacity:  0.1 + rnd(i, 3) * 0.65,
    twinkle:  rnd(i, 4) > 0.40,
    duration: 2.5 + rnd(i, 5) * 4.5,
    delay:    rnd(i, 6) * 4,
  };
});


