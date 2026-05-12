/**
 * src/main.tsx
 *
 * Application entry point.
 *
 * This file is the module that Vite treats as the "root" of the client bundle.
 * It:
 *  1. Imports global styles (TailwindCSS base + custom CSS) so they apply
 *     to the entire application.
 *  2. Locates the <div id="root"> element declared in index.html.
 *  3. Mounts the React component tree using React 18's concurrent-mode API
 *     (ReactDOM.createRoot) which enables features like automatic batching
 *     and Suspense streaming.
 *  4. Wraps the tree in <React.StrictMode> during development so React can
 *     warn about deprecated APIs and potential bugs.
 *
 * Note: <React.StrictMode> intentionally renders components twice in
 * development (to detect side effects) – this is expected behaviour.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles – must be imported here so they are bundled and injected
// into the page before any component renders.
import './styles/globals.css';

// ---------------------------------------------------------------------------
// Mount point
// ---------------------------------------------------------------------------

/**
 * Locate the root DOM element.
 * If it's missing (shouldn't happen in production) we throw early with a
 * helpful message rather than letting React give a cryptic error.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    '[SolarHub] Could not find #root element in the document.\n' +
    'Make sure index.html contains <div id="root"></div>.',
  );
}

// ---------------------------------------------------------------------------
// React 18 concurrent-mode root
// ---------------------------------------------------------------------------

ReactDOM.createRoot(rootElement).render(
  /*
   * React.StrictMode:
   *  - Only active in development builds (React strips it from production).
   *  - Enables extra runtime warnings about legacy lifecycle methods,
   *    accidental side-effects in render, etc.
   */
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
