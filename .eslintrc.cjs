/**
 * .eslintrc.cjs
 *
 * ESLint configuration for SolarHub.
 *
 * Uses:
 *  - @typescript-eslint    : TypeScript-aware linting rules
 *  - eslint-plugin-react-hooks : enforces React hooks rules (no conditional hooks, etc.)
 *  - eslint-plugin-react-refresh : warns when components can't be hot-reloaded
 */

module.exports = {
  root: true,

  env: {
    browser: true,   // window, document, localStorage, etc.
    es2020:  true,   // modern JS globals
  },

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],

  ignorePatterns: ['dist', '.eslintrc.cjs'],

  parser: '@typescript-eslint/parser',

  plugins: ['react-refresh'],

  rules: {
    // Allow components to be exported as named or default without restriction
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // Allow unused variables that start with underscore (convention for intentional no-ops)
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
};
