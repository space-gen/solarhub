import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Determine base path from environment or branch
const isDev = process.env.VITE_ENV === 'dev' || process.env.GIT_BRANCH?.includes('dev');
const base = isDev ? '/solarhub/dev/' : '/solarhub/';

export default defineConfig({
  // Register the official React plugin – handles JSX, Fast Refresh, etc.
  plugins: [react()],

  // Base public path – MUST match the GitHub Pages sub-path.
  // When omitted (default '/') all built asset URLs would be absolute from the
  // root of the domain, which breaks GitHub Pages project sites.
  // For dev branch: /solarhub/dev/
  // For main branch: /solarhub/
  base,

  server: {
    proxy: {
      '/api/github/device/code': {
        target: 'https://github.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/login/device/code',
      },
      '/api/github/access_token': {
        target: 'https://github.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/login/oauth/access_token',
      },
    },
  },

  resolve: {
    alias: {
      // "@" resolves to the "src" directory at build time AND in the IDE.
      // The matching paths entry in tsconfig.json keeps TypeScript happy.
      '@': path.resolve(__dirname, './src'),
    },
  },
});
