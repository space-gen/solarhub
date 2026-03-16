/**
 * auth-worker.js — Puter Serverless Worker
 *
 * Handles GitHub OAuth code-for-token exchange.
 * Secrets are stored in YOUR Puter cloud KV — nothing secret in this file.
 *
 * ── ONE-TIME SETUP ──────────────────────────────────────────────────────────
 * Run these two lines once in your browser console at https://puter.com:
 *
 *   await puter.kv.set('gh_client_id', 'Ov23li8lNUPIqguWQbLq')
 *   await puter.kv.set('gh_client_secret', 'YOUR_GITHUB_CLIENT_SECRET')
 *
 * That stores them encrypted in your Puter account (me.puter.kv).
 * The worker reads them at runtime — they never appear in this file or the repo.
 *
 * ── DEPLOY ──────────────────────────────────────────────────────────────────
 * Deploy via puter.com → Workers → Create, or:
 *   const code = await fetch('auth-worker.js').then(r => r.text());
 *   const worker = await puter.workers.create(code);
 *   console.log(worker.url); // paste this as AUTH_CONFIG.workerUrl
 *
 * ── ENDPOINT ────────────────────────────────────────────────────────────────
 * POST /exchange   body: { code: string }
 *                  returns: { access_token: string } or { error: string }
 */

// POST /exchange — exchange GitHub OAuth code for access token
router.post('/exchange', async ({ request }) => {
  // Read secrets from deployer's Puter KV (me.puter = your account, not the user's)
  const clientId     = await me.puter.kv.get('gh_client_id');
  const clientSecret = await me.puter.kv.get('gh_client_secret');

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({
      error: 'not_configured',
      error_description: 'Run one-time setup: puter.kv.set("gh_client_id", ...) and puter.kv.set("gh_client_secret", ...)',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  let code;
  try {
    ({ code } = await request.json());
  } catch {
    return new Response(JSON.stringify({
      error: 'invalid_request',
      error_description: 'Body must be JSON with a "code" field',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!code) {
    return new Response(JSON.stringify({
      error: 'missing_code',
      error_description: '"code" is required',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Exchange code with GitHub — runs server-side, no CORS issues
  try {
    const ghResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });

    const data = await ghResponse.json();
    return data; // Puter worker runtime auto-serializes to JSON
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'upstream_error',
      error_description: String(err),
    }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
});

// Catch-all 404
router.get('/*page', async () => {
  return new Response(JSON.stringify({
    error: 'not_found',
    message: 'Only POST /exchange is supported',
  }), { status: 404, headers: { 'Content-Type': 'application/json' } });
});
