/**
 * postcss.config.js
 *
 * PostCSS is the CSS transformation pipeline used by Vite.
 *
 * Plugins applied in order:
 *  1. tailwindcss   – generates utility classes from our tailwind.config.js
 *  2. autoprefixer  – adds vendor prefixes (-webkit-, -moz-, etc.) so the
 *                     output CSS works across all modern browsers
 *
 * No additional PostCSS plugins are needed for this project.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
