import { createServer } from 'node:http';
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { promisify } from 'node:util';

const root = dirname(fileURLToPath(import.meta.url));
const scrypt = promisify(scryptCallback);
const imageLimit = 5_000_000;
const sessionDuration = 8 * 60 * 60;
const rateWindow = 15 * 60;
const now = () => Math.floor(Date.now() / 1000);
const digest = token => createHash('sha256').update(token).digest('hex');
const categories = ['Email copy', 'Sales page', 'Landing page', 'Website copy'];
const credits = ['Concept project', 'Client work', 'Personal project'];
const validId = /^[a-z0-9-]{1,50}$/;
const photoFormats = {
  'image/jpeg': buffer => buffer.length >= 4 && buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255])) && buffer.readUInt16BE(buffer.length - 2) === 0xffd9,
  'image/png': buffer => buffer.length >= 45 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && buffer.toString('ascii', 12, 16) === 'IHDR' && buffer.toString('ascii', buffer.length - 8, buffer.length - 4) === 'IEND',
  'image/webp': buffer => buffer.length >= 20 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' && buffer.readUInt32LE(4) === buffer.length - 8 && ['VP8 ', 'VP8L', 'VP8X'].includes(buffer.toString('ascii', 12, 16))
};
const assets = new Map([
  ['index.html', 'text/html'], ['about.html', 'text/html'], ['work.html', 'text/html'],
  ['terms.html', 'text/html'], ['privacy.html', 'text/html'], ['studio.html', 'text/html'],
  ['site.css', 'text/css'], ['site.js', 'text/javascript'], ['studio.js', 'text/javascript'],
  ['images/mark.svg', 'image/svg+xml'], ['images/nafiz-portrait.jpg', 'image/jpeg'], ['images/cosmic-hero.jpg', 'image/jpeg'],
  ['robots.txt', 'text/plain'], ['sitemap.xml', 'application/xml']
]);
const headers = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function readBody(request, limit) {
  if (Number(request.headers['content-length']) > limit) throw new HttpError(413, 'File or request is too large.');
  const chunks = [];
  let size = 0;
  // A rejected stream can still return a 413 before the server closes the connection.
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, 'File or request is too large.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

async function readJson(request, limit = 120_000) {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') throw new HttpError(415, 'Expected JSON.');
  const bytes = await readBody(request, limit);
  try {
    const value = JSON.parse(bytes.toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error();
    return value;
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}

function field(value, label, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    throw new HttpError(400, 'Check the ' + label + ' field.');
  }
  return value.trim();
}

function validateEntry(input) {
  const { kind, published } = input;
  if (!['sample', 'photo', 'vlog'].includes(kind) || typeof published !== 'boolean') throw new HttpError(400, 'Invalid entry type or status.');
  const entry = {
    kind, published,
    title: field(input.title, 'title', 100, true),
    description: field(input.description, 'description', 500),
    category: '', credit: '', body: '', alt: '', video: ''
  };
  if (kind === 'sample') {
    if (!categories.includes(input.category) || !credits.includes(input.credit)) throw new HttpError(400, 'Choose a category and project type.');
    entry.category = input.category;
    entry.credit = input.credit;
    entry.body = field(input.body, 'sample copy', 16_000, published);
  }
  if (kind === 'photo') entry.alt = field(input.alt, 'alternative text', 180, published);
  if (kind === 'vlog') {
    const link = field(input.video, 'YouTube link', 300, published);
    if (link) entry.video = youtubeId(link);
  }
  return entry;
}

function youtubeId(link) {
  let url;
  try { url = new URL(link); } catch { throw new HttpError(400, 'Enter a valid YouTube link.'); }
  const parts = url.pathname.split('/').filter(Boolean);
  let id = '';
  if (url.protocol === 'https:' && !url.username && !url.password && !url.port) {
    if (url.hostname === 'youtu.be' && parts.length === 1) id = parts[0];
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v') ?? '';
      if (parts.length === 2 && ['shorts', 'live', 'embed'].includes(parts[0])) id = parts[1];
    }
  }
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) throw new HttpError(400, 'Enter a valid YouTube link.');
  return id;
}

function asEntry(row) {
  const { id, kind, title, description, category, credit, body, alt, video, published, version, hasPhoto, photoVersion } = row;
  return { id, kind, title, description, category, credit, body, alt, video, published: Boolean(published), version, hasPhoto: Boolean(hasPhoto), photoVersion };
}

export function createPortfolio({ origin, dataDir, host = '127.0.0.1', passwordHash, password, feedbackFrontendOrigin }) {
  const publicUrl = new URL(origin);
  if (feedbackFrontendOrigin && (new URL(feedbackFrontendOrigin).origin !== feedbackFrontendOrigin ||
      !feedbackFrontendOrigin.startsWith('https://'))) throw Error('FEEDBACK_FRONTEND_ORIGIN must be an HTTPS origin.');
  const splashScripts = [...readFileSync(resolve(root, 'index.html'), 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const splashHashes = splashScripts.map(([, script]) =>
    "'sha256-" + createHash('sha256').update(script.replace(/\r\n?/g, '\n')).digest('base64') + "'").join(' ');
  const secure = publicUrl.protocol === 'https:';
  if (publicUrl.origin !== origin || (!secure && !/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(origin))) {
    throw Error('SITE_ORIGIN must be an HTTPS origin, or a local HTTP origin for development.');
  }
  if ((!secure && !['127.0.0.1', '::1', 'localhost'].includes(host)) || (secure && password)) {
    throw Error('HTTP is for loopback development only. HTTPS deployments require OWNER_PASSWORD_HASH.');
  }
  if (passwordHash && !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(passwordHash)) throw Error('OWNER_PASSWORD_HASH format is invalid.');
  if (password && (password.length < 20 || password.length > 256)) throw Error('A local owner passphrase must be 20 to 256 characters.');
  const [salt, key] = passwordHash?.split(':') ?? [];
  const expected = key ? Promise.resolve(Buffer.from(key, 'hex')) : password ? scrypt(password, 'nafiz-local-development', 64) : null;
  const sessionDigest = token => digest((passwordHash ?? password) + ':' + token);
  const cookieName = secure ? '__Host-nafiz_session' : 'nafiz_local_session';
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(resolve(dataDir, 'portfolio.sqlite'));
  db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
      category TEXT NOT NULL, credit TEXT NOT NULL, body TEXT NOT NULL, alt TEXT NOT NULL,
      video TEXT NOT NULL, published INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 1,
      image BLOB, mime TEXT, photo_version INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts (bucket INTEGER PRIMARY KEY, expires INTEGER NOT NULL, count INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, message TEXT NOT NULL, created INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS feedback_created ON feedback(created);
  `);
  const feedbackSelect = db.prepare('SELECT name, message FROM feedback ORDER BY id DESC LIMIT 20');
  const feedbackInsert = db.prepare('INSERT INTO feedback (name, message, created) VALUES (?, ?, ?)');
  const recentFeedback = db.prepare('SELECT count(*) AS total FROM feedback WHERE created >= ?');
  const entryFields = 'id, kind, title, description, category, credit, body, alt, video, published, version, image IS NOT NULL AS hasPhoto, photo_version AS photoVersion';
  const findEntry = db.prepare('SELECT ' + entryFields + ' FROM entries WHERE id = ?');
  const insertEntry = db.prepare('INSERT INTO entries (id, kind, title, description, category, credit, body, alt, video, published, image, mime, photo_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  function transaction(action) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = action();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  transaction(() => {
    if (!db.prepare("INSERT OR IGNORE INTO metadata (key) VALUES ('seed-v1')").run().changes) return;
    for (const sample of JSON.parse(readFileSync(resolve(root, 'samples.json'), 'utf8'))) {
      const entry = validateEntry(sample);
      insertEntry.run(sample.id, entry.kind, entry.title, entry.description, entry.category, entry.credit, entry.body, entry.alt, entry.video, 1, null, null, 0);
    }
  });

  const readSession = db.prepare('SELECT expires FROM sessions WHERE id = ? AND expires > ?');
  function session(request) {
    const token = request.headers.cookie?.split(';').map(pair => pair.trim()).find(pair => pair.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    if (!expected || !token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const id = sessionDigest(token);
    return readSession.get(id, now()) ? id : null;
  }
  function cookie(value, age) {
    return cookieName + '=' + value + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + age + (secure ? '; Secure' : '');
  }
  function limited() {
    return transaction(() => {
      const timestamp = now();
      db.prepare('DELETE FROM attempts WHERE expires <= ?').run(timestamp);
      const bucket = db.prepare('SELECT count FROM attempts WHERE bucket = 1').get();
      if ((bucket?.count ?? 0) >= 12) return true;
      db.prepare('INSERT INTO attempts VALUES (1, ?, 1) ON CONFLICT(bucket) DO UPDATE SET count = count + 1').run(timestamp + rateWindow);
      return false;
    });
  }
  function protectWrite(request) {
    if (request.headers.origin !== origin || request.headers['sec-fetch-site'] === 'cross-site') {
      throw new HttpError(403, 'This request must come from the owner dashboard.');
    }
  }
  const hasSession = request => {
    if (!session(request)) throw new HttpError(401, 'Please sign in.');
  };
  function json(response, status, value) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(value));
  }
  function routeEntry(request, response, segments) {
    const id = segments[0];
    if (!validId.test(id) || segments.length > 2 || (segments.length === 2 && segments[1] !== 'photo')) throw new HttpError(404, 'Entry not found.');
    const row = findEntry.get(id);
    if (!row) throw new HttpError(404, 'Entry not found.');
    if (segments[1] === 'photo' && ['GET', 'HEAD'].includes(request.method)) {
      if (!row.hasPhoto || (!row.published && !session(request))) throw new HttpError(404, 'Photo not found.');
      const { image, mime } = db.prepare('SELECT image, mime FROM entries WHERE id = ?').get(id);
      response.writeHead(200, { 'Content-Type': mime, 'Content-Length': image.length, 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : image);
      return true;
    }
    return false;
  }
  async function saveEntry(request, response, id) {
    const input = await readJson(request, 7_000_000);
    const entry = validateEntry(input);
    let image = null;
    let mime = null;
    if (input.image != null) {
      if (entry.kind !== 'photo' || !Object.hasOwn(photoFormats, input.mime) || typeof input.image !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.image)) {
        throw new HttpError(415, 'Use a JPEG, PNG, or WebP image.');
      }
      image = Buffer.from(input.image, 'base64');
      if (image.length > imageLimit) throw new HttpError(413, 'Use a photo under 5 MB.');
      if (!photoFormats[input.mime](image)) throw new HttpError(415, 'The uploaded file does not match its image format.');
      mime = input.mime;
    }
    const result = transaction(() => {
      const row = id ? findEntry.get(id) : null;
      if (id && !row) throw new HttpError(404, 'Entry not found.');
      if (row && (input.version !== row.version || entry.kind !== row.kind)) {
        throw new HttpError(409, 'This entry changed. Reopen it before saving.');
      }
      if (entry.kind === 'photo' && entry.published && !image && !row?.hasPhoto) {
        throw new HttpError(400, 'Add a photo before publishing.');
      }
      const values = [entry.kind, entry.title, entry.description, entry.category, entry.credit, entry.body, entry.alt, entry.video, Number(entry.published)];
      if (!row) {
        if (db.prepare('SELECT count(*) AS total FROM entries').get().total >= 200) throw new HttpError(409, 'The dashboard supports up to 200 entries.');
        const newId = randomUUID();
        insertEntry.run(newId, ...values, image, mime, image ? 1 : 0);
        return findEntry.get(newId);
      }
      db.prepare(`
        UPDATE entries SET kind = ?, title = ?, description = ?, category = ?, credit = ?, body = ?,
          alt = ?, video = ?, published = ?, image = COALESCE(?, image), mime = COALESCE(?, mime),
          photo_version = photo_version + ?, version = version + 1 WHERE id = ?
      `).run(...values, image, mime, image ? 1 : 0, id);
      return findEntry.get(id);
    });
    json(response, id ? 200 : 201, asEntry(result));
  }

  async function handle(request, response) {
    const path = (request.url ?? '/').split('?')[0];
    const method = request.method;
    const segments = path.match(/^\/api\/entries\/([a-z0-9-]{1,50})(\/photo)?$/);
    if (segments?.[2] && routeEntry(request, response, [segments[1], 'photo'])) return;
    const retrieval = method === 'GET' || method === 'HEAD';
    if (retrieval && path === '/healthz') return json(response, 200, { ok: true });
    if (method === 'GET' && path === '/api/content.json') {
      const published = db.prepare('SELECT ' + entryFields + ' FROM entries WHERE published = 1 ORDER BY rowid').all();
      return json(response, 200, { entries: published.map(asEntry) });
    }
    if (path === '/api/feedback') {
      const visitorOrigin = request.headers.origin;
      const external = Boolean(feedbackFrontendOrigin && visitorOrigin === feedbackFrontendOrigin);
      response.setHeader('Vary', 'Origin');
      if (external) response.setHeader('Access-Control-Allow-Origin', feedbackFrontendOrigin);
      if (method === 'OPTIONS' && external) {
        response.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type' });
        return response.end();
      }
      if (method === 'GET') return json(response, 200, { feedback: feedbackSelect.all() });
      if (method === 'POST') {
        if (visitorOrigin !== origin && !external) throw new HttpError(403, 'Publish feedback from the portfolio.');
        const input = await readJson(request, 8000);
        const name = field(input.name, 'display name', 60, true);
        const message = field(input.message, 'feedback', 800, true);
        const published = transaction(() => {
          const timestamp = now();
          if (recentFeedback.get(timestamp - 60).total >= 8) {
            response.setHeader('Retry-After', '60');
            throw new HttpError(429, 'Too many submissions. Try again in a minute.');
          }
          feedbackInsert.run(name, message, timestamp);
          return feedbackSelect.all();
        });
        return json(response, 201, { feedback: published });
      }
      throw new HttpError(405, 'Method not allowed.');
    }
    if (path.startsWith('/api/')) {
      if (method === 'GET' && path === '/api/session') return json(response, 200, { signedIn: Boolean(session(request)), enabled: Boolean(expected) });
      if (!retrieval) protectWrite(request);
      if (method === 'POST' && path === '/api/session') {
        if (!expected) throw new HttpError(503, 'The owner dashboard is disabled.');
        const input = await readJson(request, 3072);
        if (typeof input.password !== 'string' || input.password.length > 256) throw new HttpError(400, 'Invalid passphrase.');
        if (limited()) {
          response.setHeader('Retry-After', String(rateWindow));
          throw new HttpError(429, 'Too many sign-in attempts. Try again in 15 minutes.');
        }
        const actual = await scrypt(input.password, salt ? Buffer.from(salt, 'hex') : 'nafiz-local-development', 64);
        if (!timingSafeEqual(actual, await expected)) throw new HttpError(401, 'Invalid passphrase.');
        const token = randomBytes(32).toString('hex');
        transaction(() => {
          db.prepare('DELETE FROM sessions WHERE expires <= ? OR id = ?').run(now(), session(request));
          db.prepare('INSERT INTO sessions VALUES (?, ?)').run(sessionDigest(token), now() + sessionDuration);
          db.prepare('DELETE FROM attempts').run();
        });
        response.setHeader('Set-Cookie', cookie(token, sessionDuration));
        return json(response, 200, { signedIn: true });
      }
      if (method === 'DELETE' && path === '/api/session') {
        const id = session(request);
        if (id) db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
        response.setHeader('Set-Cookie', cookie('', 0));
        return json(response, 200, { signedIn: false });
      }
      if (path === '/api/entries' || (segments && !segments[2])) {
        hasSession(request);
        if (path === '/api/entries' && method === 'GET') {
          return json(response, 200, db.prepare('SELECT ' + entryFields + ' FROM entries ORDER BY rowid DESC').all().map(asEntry));
        }
        if (path === '/api/entries' && method === 'POST') return saveEntry(request, response);
        if (segments && method === 'PUT') return saveEntry(request, response, segments[1]);
        if (segments && method === 'DELETE') {
          const { version } = await readJson(request, 256);
          if (!Number.isSafeInteger(version)) throw new HttpError(400, 'Entry version is required.');
          const deleted = db.prepare('DELETE FROM entries WHERE id = ? AND version = ?').run(segments[1], version);
          if (!deleted.changes) throw new HttpError(409, 'This entry changed. Reopen it before deleting.');
          return json(response, 200, { deleted: true });
        }
      }
      throw new HttpError(404, 'Endpoint not found.');
    }
    const name = path === '/' ? 'index.html' : path.slice(1);
    const mime = assets.get(name);
    if (!retrieval || !mime) throw new HttpError(404, 'Page not found.');
    let content = await readFile(resolve(root, name));
    if (secure && ['text/html', 'text/plain', 'application/xml'].includes(mime)) {
      content = Buffer.from(content.toString('utf8').replaceAll('https://spacyg.github.io/nafizkhan/', origin + '/'));
    }
    if (name === 'index.html') {
      response.setHeader('Content-Security-Policy', headers['Content-Security-Policy'].replace(
        "script-src 'self';", "script-src 'self' " + splashHashes + ";"
      ));
    }
    response.writeHead(200, {
      'Content-Type': mime.startsWith('image/') ? mime : mime + '; charset=utf-8',
      'Content-Length': content.length,
      'Cache-Control': mime.startsWith('image/') ? 'public, max-age=86400' : 'no-cache'
    });
    response.end(method === 'HEAD' ? undefined : content);
  }

  const server = createServer({ requestTimeout: 30_000, headersTimeout: 10_000, maxHeaderSize: 8192 }, (request, response) => {
    for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
    if (secure) response.setHeader('Strict-Transport-Security', 'max-age=31536000');
    handle(request, response).catch(error => {
      const status = error instanceof HttpError ? error.status : 500;
      if (status === 500) console.error(error.code ?? error.name);
      if (response.headersSent) return response.destroy();
      if (status === 413) response.setHeader('Connection', 'close');
      json(response, status, { error: status === 500 ? 'The server could not complete the request.' : error.message });
    });
  });
  server.once('close', () => db.close());
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4173);
  const origin = process.env.SITE_ORIGIN ?? 'http://127.0.0.1:' + port;
  const host = process.env.HOST ?? '127.0.0.1';
  const server = createPortfolio({
    origin, host,
    dataDir: resolve(process.env.DATA_DIR ?? resolve(root, 'data')),
    passwordHash: process.env.OWNER_PASSWORD_HASH,
    feedbackFrontendOrigin: process.env.FEEDBACK_FRONTEND_ORIGIN,
    password: process.env.OWNER_PASSWORD
  });
  server.listen(port, host, () => console.log('Portfolio ready at ' + origin));
}
