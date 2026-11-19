// Same-origin proxy for GitHub's device flow, which does not allow browser CORS.
// Everything except the client's device_code is fixed here, so this cannot be
// used as a general proxy or on behalf of another OAuth app.
const GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code';
const MAX_BODY_CHARS = 2048;
const SDO_IMAGES = new Set(['HMIIC', 'HMIB', '0094', '0131', '0171', '0193', '0211', '0304', '0335', '1600', '1700']);
const SDO_CACHE_SECONDS = 1800;
const BROWSE_CACHE_SECONDS = 604800;
const BROWSE_PATH = /^\/api\/sdo\/browse\/(\d{4})\/(\d{2})\/(\d{2})\/((\d{8})_\d{6}_1024_(?:0094|0131|0171|0193|0211|0304|0335|1600|1700)\.jpg)$/;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function latestSolarImage(code, method) {
  if (!SDO_IMAGES.has(code)) return json(404, { error: 'not_found' });
  if (method !== 'GET' && method !== 'HEAD') return json(405, { error: 'method_not_allowed' });
  try {
    const response = await fetch(`https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_${code}.jpg`, {
      headers: { 'User-Agent': 'solarhub-image-proxy' },
      cf: { cacheEverything: true, cacheTtl: SDO_CACHE_SECONDS },
    });
    if (!response.ok) return json(502, { error: 'image_unavailable' });
    return new Response(method === 'HEAD' ? null : response.body, {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': `public, max-age=${SDO_CACHE_SECONDS}` },
    });
  } catch {
    return json(502, { error: 'image_unavailable' });
  }
}

// Same-origin copies let the browser read pixels, so drawn outlines can snap to features.
async function browseSolarImage(match, method) {
  const [, year, month, day, name, date] = match;
  if (date !== `${year}${month}${day}`) return json(404, { error: 'not_found' });
  if (method !== 'GET' && method !== 'HEAD') return json(405, { error: 'method_not_allowed' });
  try {
    const response = await fetch(`https://sdo.gsfc.nasa.gov/assets/img/browse/${year}/${month}/${day}/${name}`, {
      headers: { 'User-Agent': 'solarhub-image-proxy' },
      cf: { cacheEverything: true, cacheTtl: BROWSE_CACHE_SECONDS },
    });
    if (!response.ok) return json(502, { error: 'image_unavailable' });
    return new Response(method === 'HEAD' ? null : response.body, {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': `public, max-age=${BROWSE_CACHE_SECONDS}` },
    });
  } catch {
    return json(502, { error: 'image_unavailable' });
  }
}

async function buildUpstream(pathname, request, env) {
  if (pathname === '/api/github/device/code') {
    return {
      url: 'https://github.com/login/device/code',
      form: { client_id: env.GITHUB_CLIENT_ID, scope: env.GITHUB_SCOPE },
    };
  }

  const body = await request.text();
  if (body.length > MAX_BODY_CHARS) return null;
  const deviceCode = new URLSearchParams(body).get('device_code');
  if (!deviceCode) return null;
  return {
    url: 'https://github.com/login/oauth/access_token',
    form: { client_id: env.GITHUB_CLIENT_ID, device_code: deviceCode, grant_type: GRANT_TYPE },
  };
}

export default {
  async fetch(request, env) {
    const { pathname, origin } = new URL(request.url);
    const image = pathname.match(/^\/api\/sdo\/latest\/([0-9A-Z]+)\.jpg$/);
    if (image) return latestSolarImage(image[1], request.method);
    const browse = pathname.match(BROWSE_PATH);
    if (browse) return browseSolarImage(browse, request.method);

    if (pathname !== '/api/github/device/code' && pathname !== '/api/github/access_token') {
      return json(404, { error: 'not_found' });
    }
    if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });
    if (request.headers.get('Origin') !== origin) return json(403, { error: 'forbidden_origin' });

    const upstream = await buildUpstream(pathname, request, env);
    if (!upstream) return json(400, { error: 'invalid_request' });

    try {
      const response = await fetch(upstream.url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'solarhub-oauth-proxy',
        },
        body: new URLSearchParams(upstream.form).toString(),
      });
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') ?? 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    } catch {
      return json(502, { error: 'github_unreachable' });
    }
  },
};
