const test = require('node:test');
const assert = require('node:assert/strict');
const { extractNotices, fingerprint, normaliseUrl, scanSource, fetchPage } = require('../utils/govtNotices');

const PAGE = `
<ul>
  <li><a href="/notices/recruitment-clerk-2026.pdf">Recruitment of Junior Assistant 2026 - 120 posts</a></li>
  <li><a href="https://dept.gov.in/walkin?utm_source=x">Walk-in interview for Staff Nurse on 20 Dec</a></li>
  <li><a href="/about">About us and our history</a></li>
  <li><a href="http://insecure.gov.in/recruitment">Recruitment notice on http only</a></li>
  <li><a href="mailto:hr@dept.gov.in">Email us about recruitment</a></li>
  <li><a href="/notices/recruitment-clerk-2026.pdf">Recruitment of Junior Assistant 2026 - 120 posts</a></li>
  <li><a href="/x">Hi</a></li>
</ul>`;

test('picks recruitment links, https only, no duplicates, tracking removed', () => {
  const out = extractNotices(PAGE, 'https://dept.gov.in/home');
  assert.deepEqual(out.map((o) => o.url), ['https://dept.gov.in/notices/recruitment-clerk-2026.pdf', 'https://dept.gov.in/walkin']);
  assert.match(out[0].title, /Junior Assistant/);
});

test('fingerprint is stable across tracking bits and trailing slash', () => {
  assert.equal(fingerprint('https://a.gov.in/x/?utm_source=q'), fingerprint('https://a.gov.in/x'));
  assert.notEqual(fingerprint('https://a.gov.in/x'), fingerprint('https://a.gov.in/y'));
  assert.equal(normaliseUrl('not a url'), '');
});

const okFetch = (html, url = 'https://dept.gov.in/home') => async () => ({ ok: true, url, text: async () => html });

test('first scan is a baseline, later scans return only unseen notices', async () => {
  const src = { url: 'https://dept.gov.in/home', lastScanAt: null };
  const first = await scanSource(src, [], { fetchImpl: okFetch(PAGE) });
  assert.equal(first.baseline, true);
  assert.equal(first.fresh.length, 2);
  const known = first.fresh.map((n) => n.fingerprint);
  const later = await scanSource({ ...src, lastScanAt: new Date() }, known, { fetchImpl: okFetch(PAGE + '<a href="/notices/new-vacancy.pdf">New vacancy for Driver posts</a>') });
  assert.equal(later.baseline, false);
  assert.deepEqual(later.fresh.map((n) => n.url), ['https://dept.gov.in/notices/new-vacancy.pdf']);
});

test('private addresses and bad redirects are refused, failures are reported not thrown', async () => {
  assert.ok((await fetchPage('https://localhost/x', { fetchImpl: okFetch('') })).error);
  assert.ok((await fetchPage('http://dept.gov.in/x', { fetchImpl: okFetch('') })).error);
  assert.ok((await fetchPage('https://dept.gov.in/x', { fetchImpl: okFetch('', 'https://127.0.0.1/admin') })).error);
  assert.ok((await fetchPage('https://dept.gov.in/x', { fetchImpl: async () => ({ ok: false, status: 404, url: 'https://dept.gov.in/x' }) })).error);
  assert.ok((await fetchPage('https://dept.gov.in/x', { fetchImpl: async () => { throw new Error('boom'); } })).error);
});

test('admin routes for the watcher exist and the cron is registered', () => {
  const fs = require('node:fs');
  const r = fs.readFileSync(require('node:path').join(__dirname, '../routes/adminRoutes.js'), 'utf8');
  for (const p of ["'/govt-notices'", "'/govt-notices/sources'", "'/govt-notices/sources/:id'", "'/govt-notices/:id'"]) assert.ok(r.includes(p), p);
  assert.match(fs.readFileSync(require('node:path').join(__dirname, '../cron/index.js'), 'utf8'), /runGovtWatch/);
});
