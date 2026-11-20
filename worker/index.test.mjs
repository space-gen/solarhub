import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import worker from './index.js';

const ORIGIN = 'https://solarhub.skiono.me';
const env = { GITHUB_CLIENT_ID: 'real-client', GITHUB_SCOPE: 'public_repo' };
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function post(path, body = '', origin = ORIGIN) {
  return new Request(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

function captureUpstream() {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, form: new URLSearchParams(init.body) });
    return Response.json({ ok: true });
  };
  return calls;
}

test('device code request ignores client-supplied app and scope', async () => {
  const calls = captureUpstream();
  const res = await worker.fetch(post('/api/github/device/code', 'client_id=evil&scope=repo'), env);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.equal(calls[0].url, 'https://github.com/login/device/code');
  assert.equal(calls[0].form.get('client_id'), 'real-client');
  assert.equal(calls[0].form.get('scope'), 'public_repo');
});

test('token request forwards only device_code from the client', async () => {
  const calls = captureUpstream();
  await worker.fetch(post('/api/github/access_token', 'device_code=abc&client_id=evil&grant_type=x'), env);
  assert.equal(calls[0].url, 'https://github.com/login/oauth/access_token');
  assert.deepEqual(Object.fromEntries(calls[0].form), {
    client_id: 'real-client',
    device_code: 'abc',
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  });
});

test('rejects other origins, methods, paths and bad bodies without calling GitHub', async () => {
  const calls = captureUpstream();
  const cases = [
    [post('/api/github/device/code', '', 'https://evil.example'), 403],
    [new Request(`${ORIGIN}/api/github/device/code`), 405],
    [post('/api/github/other'), 404],
    [post('/api/github/access_token', 'grant_type=x'), 400],
    [post('/api/github/access_token', `device_code=${'a'.repeat(3000)}`), 400],
  ];
  for (const [request, status] of cases) {
    assert.equal((await worker.fetch(request, env)).status, status);
  }
  assert.equal(calls.length, 0);
});

test('serves only known live solar images', async () => {
  const urls = [];
  globalThis.fetch = async url => {
    urls.push(url);
    return new Response('image', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  };
  const ok = await worker.fetch(new Request(`${ORIGIN}/api/sdo/latest/0171.jpg`), env);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('Content-Type'), 'image/jpeg');
  assert.equal(urls[0], 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_0171.jpg');
  assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/sdo/latest/SECRET.jpg`), env)).status, 404);
  assert.equal(urls.length, 1);
});

test('serves only matching dated solar frames', async () => {
  const urls = [];
  globalThis.fetch = async url => {
    urls.push(url);
    return new Response('image', { status: 200 });
  };
  const name = '20261117_115558_1024_0171.jpg';
  const ok = await worker.fetch(new Request(`${ORIGIN}/api/sdo/browse/2026/11/17/${name}`), env);
  assert.equal(ok.status, 200);
  assert.equal(urls[0], `https://sdo.gsfc.nasa.gov/assets/img/browse/2026/11/17/${name}`);
  for (const path of [`2026/11/18/${name}`, '2026/11/17/20261117_115558_1024_HMIB.jpg', `2026/11/17/..%2F${name}`]) {
    assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/sdo/browse/${path}`), env)).status, 404);
  }
  assert.equal(urls.length, 1);
});

test('reports 502 when GitHub is unreachable', async () => {
  globalThis.fetch = async () => { throw new TypeError('network'); };
  const res = await worker.fetch(post('/api/github/device/code'), env);
  assert.equal(res.status, 502);
});

test('day listing returns only that day and channel, sorted and unique', async () => {
  globalThis.fetch = async url => {
    assert.equal(url, 'https://sdo.gsfc.nasa.gov/assets/img/browse/2020/03/04/');
    return new Response('<a href="20200304_001205_1024_0193.jpg">x</a> 20200304_000005_1024_0193.jpg 20200304_000005_1024_0193.jpg 20200304_000005_1024_0211.jpg 20200304_000005_512_0193.jpg');
  };
  const res = await worker.fetch(new Request(`${ORIGIN}/api/sdo/list/2020/03/04/0193.json`), env);
  assert.deepEqual(await res.json(), ['20200304_000005_1024_0193.jpg', '20200304_001205_1024_0193.jpg']);
});

test('day listing refuses dates outside the archive range and impossible dates', async () => {
  globalThis.fetch = async () => assert.fail('must not fetch');
  for (const path of ['2016/09/30', '2026/11/21', '2020/02/31']) {
    const res = await worker.fetch(new Request(`${ORIGIN}/api/sdo/list/${path}/0193.json`), env);
    assert.equal(res.status, 404, path);
  }
});

test('catalogue lookup sends only fixed HEK parameters around the asked hour', async () => {
  let asked;
  globalThis.fetch = async url => {
    asked = new URL(url);
    return Response.json({ result: [
      { event_type: 'CH', frm_name: 'SPoCA', event_starttime: '2021-03-06T09:37:05', hpc_boundcc: 'POLYGON((1 2,3 4,5 6))' },
      { event_type: 'FL', frm_name: 'x', hpc_boundcc: 'POLYGON((1 2,3 4,5 6))' },
    ] });
  };
  const res = await worker.fetch(new Request(`${ORIGIN}/api/hek/dark/2021-03-06T12.json`), env);
  assert.equal(asked.origin + asked.pathname, 'https://www.lmsal.com/hek/her');
  assert.equal(asked.searchParams.get('event_type'), 'ch,fi');
  assert.equal(asked.searchParams.get('event_starttime'), '2021-03-06T08:00:00');
  assert.deepEqual(await res.json(), [{ type: 'CH', catalogue: 'SPoCA', start: '2021-03-06T09:37:05', polygon: 'POLYGON((1 2,3 4,5 6))' }]);
});

test('catalogue lookup refuses impossible or out-of-range hours', async () => {
  globalThis.fetch = async () => assert.fail('must not fetch');
  for (const path of ['2021-02-30T12', '2021-03-06T25', '2016-09-30T12']) {
    const res = await worker.fetch(new Request(`${ORIGIN}/api/hek/dark/${path}.json`), env);
    assert.equal(res.status, 404, path);
  }
});
