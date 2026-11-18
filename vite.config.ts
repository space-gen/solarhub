import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Register the official React plugin – handles JSX, Fast Refresh, etc.
  plugins: [react()],

  // Served from the root of solarhub.skiono.me.
  base: '/',

  server: {
    proxy: {
      '^/api/sdo/latest/.*': {
        target: 'https://sdo.gsfc.nasa.gov',
        changeOrigin: true,
        secure: true,
        rewrite: requestPath => requestPath.replace(/^\/api\/sdo\/latest\/(.+)\.jpg$/, '/assets/img/latest/latest_512_$1.jpg'),
      },
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
