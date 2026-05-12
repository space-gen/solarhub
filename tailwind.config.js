/**
 * tailwind.config.js
 *
 * TailwindCSS configuration for SolarHub.
 *
 * Highlights:
 *  - Dark mode via the 'class' strategy (we add the "dark" class to <html>)
 *  - Extended colour palette:
 *      solar.*   – warm orange/amber tones used for primary actions & glows
 *      cosmic.*  – deep blue/purple tones used for backgrounds & cards
 *      nebula.*  – pink/violet tones used for accents
 *  - Custom keyframe animations: orbit, pulse-glow, shimmer, twinkle
 *  - Custom animation utilities mapped to those keyframes
 *  - Extra backdrop-blur steps for deep glassmorphism
 */

/** @type {import('tailwindcss').Config} */
export default {
  // ---------------------------------------------------------------------------
  // Content paths – Tailwind scans these files and tree-shakes unused classes.
  // ---------------------------------------------------------------------------
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  // ---------------------------------------------------------------------------
  // Dark mode – 'class' means we control the theme by toggling the "dark" class
  // on the root <html> element rather than relying on the OS preference alone.
  // ---------------------------------------------------------------------------
  darkMode: 'class',

  theme: {
    extend: {
      // -----------------------------------------------------------------------
      // Custom colour palette
      // -----------------------------------------------------------------------
      colors: {
        // Solar warm tones – primary brand colour
        solar: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // primary orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },

        // Cosmic deep-space blues and purples – used for backgrounds/cards
        cosmic: {
          50:  '#f0f0ff',
          100: '#e0e0ff',
          200: '#c4c4ff',
          300: '#a3a3ff',
          400: '#7c7cff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#3730a3',
          800: '#1e1b4b',
          900: '#0d0d2b',
          950: '#0a0a1a', // main background
        },

        // Nebula (now Space Black) accents
        nebula: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#1a1a1a', // Space Black
          600: '#121212',
          700: '#0a0a0a',
          800: '#050505',
          900: '#020202',
          950: '#000000',
        },
      },

      // -----------------------------------------------------------------------
      // Background gradients (used as arbitrary value utilities)
      // -----------------------------------------------------------------------
      backgroundImage: {
        'solar-radial':
          'radial-gradient(ellipse at center, #f97316 0%, #ea580c 30%, transparent 70%)',
        'cosmic-gradient':
          'linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 50%, #1e1b4b 100%)',
        'nebula-glow':
          'radial-gradient(ellipse at 60% 40%, rgba(0,0,0,0.15) 0%, transparent 60%)',
      },

      // -----------------------------------------------------------------------
      // Extra backdrop-blur steps for deep glassmorphism effects
      // -----------------------------------------------------------------------
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '60px',
      },

      // -----------------------------------------------------------------------
      // Custom keyframe animations
      // -----------------------------------------------------------------------
      keyframes: {
        // Slow rotation – used for the sun's corona / outer rings
        orbit: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Breathing glow effect
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(249,115,22,0.4)' },
          '50%':       { boxShadow: '0 0 60px rgba(249,115,22,0.8)' },
        },
        // Horizontal shimmer – used on skeleton loaders
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        // Random star twinkle
        twinkle: {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':       { opacity: '0.3', transform: 'scale(0.8)' },
        },
        // Slow counter-rotation for inner orbit rings
        'orbit-reverse': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        // Gentle vertical float
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
      },

      // -----------------------------------------------------------------------
      // Animation utility classes referencing the keyframes above
      // -----------------------------------------------------------------------
      animation: {
        'orbit':         'orbit 20s linear infinite',
        'orbit-slow':    'orbit 40s linear infinite',
        'orbit-reverse': 'orbit-reverse 15s linear infinite',
        'pulse-glow':    'pulse-glow 2s ease-in-out infinite',
        'shimmer':       'shimmer 2s infinite linear',
        'twinkle':       'twinkle 3s ease-in-out infinite',
        'float':         'float 4s ease-in-out infinite',
      },

      // -----------------------------------------------------------------------
      // Font families
      // -----------------------------------------------------------------------
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      // -----------------------------------------------------------------------
      // Extended box shadows for glow effects
      // -----------------------------------------------------------------------
      boxShadow: {
        'solar':      '0 0 30px rgba(249,115,22,0.5)',
        'solar-lg':   '0 0 60px rgba(249,115,22,0.6)',
        'cosmic':     '0 0 30px rgba(99,102,241,0.4)',
        'nebula':     '0 0 30px rgba(0,0,0,0.4)',
        'glass':      '0 8px 32px rgba(0,0,0,0.4)',
        'glass-lg':   '0 16px 64px rgba(0,0,0,0.6)',
      },
    },
  },

  plugins: [],
};
