import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPortfolio } from '../server.mjs';

const localPassphrase = 'test-only disposable passphrase';
const sample = {
  kind: 'sample', title: 'A writing sample', description: '',
  category: 'Email copy', credit: 'Concept project', body: 'Sample copy.',
  published: false
};
let temp;
const origin = 'http://127.0.0.1:4173';
let socketPath;
let server;

async function start(options = {}) {
  server = createPortfolio({ origin, dataDir: temp, password: localPassphrase, ...options });
  server.listen(socketPath);
  await once(server, 'listening');
}

async function stop() {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

before(async () => {
  temp = await mkdtemp(join(tmpdir(), 'portfolio-test-'));
  socketPath = process.platform === 'win32'
    ? String.raw`\\.\pipe\nafiz-portfolio-test-` + process.pid
    : join(temp, 'portfolio.sock');
  await start();
});

after(async () => {
  if (server?.listening) await stop();
  if (temp) await rm(temp, { recursive: true, force: true });
});

function request(path, { method = 'GET', body, cookie, requestOrigin = origin } = {}) {
  const headers = { Origin: requestOrigin };
  const payload = body === undefined ? undefined : JSON.stringify(body);
  if (payload !== undefined) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(payload);
  }
  if (cookie) headers.Cookie = cookie;
  return new Promise((resolve, reject) => {
    const outgoing = httpRequest({ socketPath, path, method, headers, agent: false }, async incoming => {
      try {
        const chunks = [];
        for await (const chunk of incoming) chunks.push(chunk);
        const bytes = Buffer.concat(chunks);
        resolve({
          status: incoming.statusCode,
          headers: { get: name => incoming.headers[name]?.toString() },
          text: async () => bytes.toString(),
          json: async () => JSON.parse(bytes),
          arrayBuffer: async () => bytes
        });
      } catch (error) {
        reject(error);
      }
    });
    outgoing.on('error', reject);
    outgoing.end(payload);
  });
}
async function signIn(password = localPassphrase) {
  const result = await request('/api/session', { method: 'POST', body: { password } });
  assert.equal(result.status, 200);
  const setCookie = result.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly; SameSite=Strict/);
  return setCookie.split(';')[0];
}

test('public pages, headers, assets, and protected paths', async () => {
  for (const page of ['/', '/work.html', '/about.html', '/studio.html', '/privacy.html', '/terms.html']) {
    const result = await request(page);
    assert.equal(result.status, 200);
    assert.match(result.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal(result.headers.get('x-content-type-options'), 'nosniff');
    assert.match(await result.text(), /id="main"/);
  }
  for (const image of ['nafiz-portrait.jpg', 'cosmic-hero.jpg']) {
    const asset = await request('/images/' + image);
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('content-type'), 'image/jpeg');
  }
  const seeded = await (await request('/api/content.json')).json();
  assert.deepEqual(seeded.entries.map(entry => entry.id), ['sample-email', 'sample-sales', 'sample-landing', 'sample-bookstore', 'sample-lumaskin']);
  for (const name of ['/server.mjs', '/samples.json', '/data/portfolio.sqlite', '/.git/config']) {
    assert.equal((await request(name)).status, 404);
  }
  assert.equal((await request('/api/entries')).status, 401);
  assert.equal((await request('/api/entries', { method: 'POST', body: sample })).status, 401);
  assert.equal((await request('/api/session', { method: 'POST', requestOrigin: 'https://example.test', body: { password: localPassphrase } })).status, 403);
});

test('owner can draft, publish, edit, and delete a writing sample with conflict detection', async () => {
  const cookie = await signIn();
  const created = await request('/api/entries', { method: 'POST', body: sample, cookie });
  assert.equal(created.status, 201);
  const entry = await created.json();
  const url = '/api/entries/' + entry.id;
  assert.equal((await (await request('/api/content.json')).json()).entries.some(item => item.id === entry.id), false);
  const publish = { ...sample, published: true, version: entry.version };
  assert.equal((await request(url, { method: 'PUT', body: publish, cookie, requestOrigin: 'https://example.test' })).status, 403);
  const updated = await request(url, { method: 'PUT', body: publish, cookie });
  assert.equal(updated.status, 200);
  const published = await updated.json();
  assert.equal((await (await request('/api/content.json')).json()).entries.find(item => item.id === entry.id).body, sample.body);
  assert.equal((await request(url, { method: 'PUT', body: publish, cookie })).status, 409);
  assert.equal((await request(url, { method: 'DELETE', body: { version: entry.version }, cookie })).status, 409);
  assert.equal((await request(url, { method: 'DELETE', body: { version: published.version }, cookie })).status, 200);
  assert.equal((await (await request('/api/content.json')).json()).entries.some(item => item.id === entry.id), false);
  assert.equal((await request('/api/session', { method: 'DELETE', cookie })).status, 200);
  assert.equal((await request('/api/entries', { cookie })).status, 401);
});

test('upload validation, draft photo privacy, persistence, and YouTube links', async () => {
  const cookie = await signIn();
  const bytes = await readFile(new URL('../images/nafiz-portrait.jpg', import.meta.url));
  const image = bytes.toString('base64');
  const photo = { kind: 'photo', title: 'Photo test', description: 'Caption', alt: 'A test portrait', image, mime: 'image/jpeg', published: false };
  const create = body => request('/api/entries', { method: 'POST', body, cookie });
  assert.equal((await create({ ...photo, image: Buffer.from('<svg></svg>').toString('base64') })).status, 415);
  assert.equal((await create({ ...photo, mime: 'image/svg+xml' })).status, 415);
  assert.equal((await create({ ...photo, image: Buffer.alloc(5_000_001).toString('base64') })).status, 413);
  assert.equal((await create({ ...photo, published: true, alt: '' })).status, 400);
  const photoResult = await create(photo);
  assert.equal(photoResult.status, 201);
  const entry = await photoResult.json();
  const photoUrl = '/api/entries/' + entry.id + '/photo';
  assert.equal((await request(photoUrl)).status, 404);
  assert.equal((await request(photoUrl, { cookie })).status, 200);
  const edit = { ...photo, image: null, published: true, version: entry.version };
  const published = await request('/api/entries/' + entry.id, { method: 'PUT', body: edit, cookie });
  assert.equal(published.status, 200);
  const guest = await request(photoUrl);
  assert.equal(guest.headers.get('content-type'), 'image/jpeg');
  assert.deepEqual(Buffer.from(await guest.arrayBuffer()), bytes);
  const vlog = { kind: 'vlog', title: 'A vlog', description: '', published: true };
  assert.equal((await create({ ...vlog, video: 'https://youtube.example/watch?v=dQw4w9WgXcQ' })).status, 400);
  const stored = await create({ ...vlog, video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
  assert.equal(stored.status, 201);
  assert.equal((await stored.json()).video, 'dQw4w9WgXcQ');
  await stop();
  await start({ password: 'changed test-only passphrase' });
  assert.equal((await request('/api/entries', { cookie })).status, 401);
  assert.equal((await request(photoUrl)).status, 200);
  const entries = (await (await request('/api/content.json')).json()).entries;
  assert.equal(entries.filter(item => item.id === 'sample-email').length, 1);
  assert.ok(entries.some(item => item.kind === 'vlog' && item.title === 'A vlog'));
});

test('repeated invalid sign-ins are rate limited', async () => {
  for (let count = 0; count < 12; count++) {
    assert.equal((await request('/api/session', { method: 'POST', body: { password: 'wrong' } })).status, 401);
  }
  const limited = await request('/api/session', { method: 'POST', body: { password: localPassphrase } });
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '900');
});

test('HTTPS configuration issues secure owner cookies and serves the canonical origin', async () => {
  await stop();
  const deploymentOrigin = 'https://portfolio.example.test';
  const salt = randomBytes(16);
  const passwordHash = salt.toString('hex') + ':' + scryptSync(localPassphrase, salt, 64).toString('hex');
  await start({ origin: deploymentOrigin, dataDir: join(temp, 'production'), password: undefined, passwordHash });
  const home = await request('/');
  assert.equal(home.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.match(await home.text(), /rel="canonical" href="https:\/\/portfolio\.example\.test\/"/);
  const signedIn = await request('/api/session', {
    method: 'POST', requestOrigin: deploymentOrigin, body: { password: localPassphrase }
  });
  assert.equal(signedIn.status, 200);
  const cookie = signedIn.headers.get('set-cookie');
  assert.match(cookie, /^__Host-nafiz_session=[a-f0-9]{64}; Path=\/; HttpOnly; SameSite=Strict; Max-Age=28800; Secure$/);
  assert.equal((await request('/api/entries', { cookie: cookie.split(';')[0] })).status, 200);
});

test('public feedback validates submissions and survives restarting the server', async () => {
  await stop();
  const dataDir = join(temp, 'feedback');
  const frontend = 'https://spacyg.github.io';
  await start({ dataDir, feedbackFrontendOrigin: frontend });
  const path = '/api/feedback';
  const message = { name: 'Test visitor', message: 'Helpful sample.' };
  const preflight = await request(path, { method: 'OPTIONS', requestOrigin: frontend });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), frontend);
  assert.equal((await request(path, { method: 'POST', requestOrigin: 'https://other.example', body: message })).status, 403);
  assert.equal((await request(path, { method: 'POST', body: { ...message, message: ' ' } })).status, 400);
  const saved = await request(path, { method: 'POST', requestOrigin: frontend, body: message });
  assert.equal(saved.status, 201);
  assert.deepEqual((await saved.json()).feedback, [message]);
  await stop();
  await start({ dataDir });
  assert.deepEqual((await (await request(path)).json()).feedback, [message]);
  assert.match((await request('/')).headers.get('content-security-policy'), /script-src 'self' 'sha256-/);
});


test('custom 404 links resolve to the running portfolio with a 404 status', async () => {
  const missing = await request('/missing/nested/path');
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get('content-type'), /^text\/html/);
  const html = await missing.text();
  assert.match(html, /This page is missing/);
  assert.match(html, /href="https?:\/\/[^"]+\/site\.css\?/);
  assert.match(html, /name="robots" content="noindex, follow"/);
  assert.equal((await request('/site.css')).status, 200);
  assert.match((await request('/')).headers.get('content-security-policy'), /form-action 'self' https:\/\/formspree\.io/);
});

