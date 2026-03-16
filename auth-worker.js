/**
 * auth-worker.js — Puter Serverless Worker
 *
 * POST /exchange  { code }  → exchanges GitHub OAuth code for an access token.
 *
 * This file contains NO secrets. You store secrets in Puter KV, and the worker
 * reads them at runtime.
 */

// ── Placeholders / configuration ───────────────────────────────────────────
// Where secrets live:
//   - 'me'   : YOUR (deployer) Puter KV — recommended.
//   - 'user' : the CALLER's Puter KV (requires calling via puter.workers.exec).
//             Not recommended for GitHub OAuth app secrets.
const SECRET_OWNER = 'me'; // 'me' | 'user'

// KV keys for the GitHub OAuth app credentials.
const KV_GH_CLIENT_ID_KEY     = 'gh_client_id';
const KV_GH_CLIENT_SECRET_KEY = 'gh_client_secret';

// Helper: pick which KV to read from.
function getKV(user) {
  if (SECRET_OWNER === 'user') return user?.puter?.kv ?? null;
  return me?.puter?.kv ?? null;
}

// POST /exchange — exchange GitHub OAuth code for access token
router.post('/exchange', async ({ request, user }) => {
  const kv = getKV(user);
  if (!kv) {
    return new Response(JSON.stringify({
      error: 'not_authenticated',
      error_description: 'Call this worker via puter.workers.exec() so user.puter is available (or set SECRET_OWNER="me").',
    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const clientId     = await kv.get(KV_GH_CLIENT_ID_KEY);
  const clientSecret = await kv.get(KV_GH_CLIENT_SECRET_KEY);

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({
      error: 'not_configured',
      error_description:
        `Missing secrets in Puter KV. Set ${KV_GH_CLIENT_ID_KEY} and ${KV_GH_CLIENT_SECRET_KEY} in ${SECRET_OWNER}.puter.kv`,
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
