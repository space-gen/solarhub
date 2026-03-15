/**
 * auth-worker.js — Puter.js Worker
 *
 * Stateless edge worker that handles GitHub OAuth code-for-token exchange.
 * Deploy via: puter worker deploy auth-worker.js
 *
 * Environment variables (set in Puter dashboard or CLI):
 *   GH_CLIENT_ID     — GitHub OAuth App client ID
 *   GH_CLIENT_SECRET — GitHub OAuth App client secret
 *
 * Endpoints:
 *   POST /exchange  — body: { code: string }
 *                   — returns GitHub's token JSON
 *   OPTIONS /exchange — CORS preflight
 */

// ---------------------------------------------------------------------------
// CORS — allow requests from the GitHub Pages static site
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://space-gen.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function corsResponse(body, init = {}) {
  const headers = { ...CORS_HEADERS, 'Content-Type': 'application/json', ...(init.headers ?? {}) };
  return new Response(body, { ...init, headers });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // ── CORS preflight ──────────────────────────────────────────────────────
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // ── POST /exchange ───────────────────────────────────────────────────────
  if (url.pathname === '/exchange' && request.method === 'POST') {
    let code;
    try {
      ({ code } = await request.json());
    } catch {
      return corsResponse(JSON.stringify({ error: 'invalid_request', error_description: 'Body must be JSON with a "code" field' }), { status: 400 });
    }

    if (!code) {
      return corsResponse(JSON.stringify({ error: 'missing_code', error_description: '"code" is required' }), { status: 400 });
    }

    // Exchange code for access token with GitHub
    let ghResponse;
    try {
      ghResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':        'application/json',
        },
        body: JSON.stringify({
          client_id:     process.env.GH_CLIENT_ID,
          client_secret: process.env.GH_CLIENT_SECRET,
          code,
        }),
      });
    } catch (err) {
      return corsResponse(JSON.stringify({ error: 'upstream_error', error_description: String(err) }), { status: 502 });
    }

    const data = await ghResponse.text();
    return corsResponse(data, { status: ghResponse.status });
  }

  // ── 404 for anything else ────────────────────────────────────────────────
  return corsResponse(JSON.stringify({ error: 'not_found' }), { status: 404 });
}
