/**
 * vite.config.ts
 *
 * Vite build tool configuration for SolarHub.
 *
 * Key settings:
 *  - @vitejs/plugin-react  : enables React Fast Refresh and JSX transform
 *  - base '/solarhub/'     : required so that asset paths are correct when the
 *                            app is deployed to GitHub Pages at
 *                            https://<org>.github.io/solarhub/
 *  - resolve.alias '@'     : maps the "@" import prefix to the "src" directory
 *                            so we can write  import Foo from '@/components/Foo'
 *                            instead of       import Foo from '../../components/Foo'
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Register the official React plugin – handles JSX, Fast Refresh, etc.
  plugins: [react()],

  // Base public path – MUST match the GitHub Pages sub-path.
  // When omitted (default '/') all built asset URLs would be absolute from the
  // root of the domain, which breaks GitHub Pages project sites.
  base: '/solarhub/',

  resolve: {
    alias: {
      // "@" resolves to the "src" directory at build time AND in the IDE.
      // The matching paths entry in tsconfig.json keeps TypeScript happy.
      '@': path.resolve(__dirname, './src'),
    },
  },
});
