const test = require('node:test');
const assert = require('node:assert');
const V = require('../utils/publicVisibility');
const { buildSitemap, buildJobResponse, jobSlug } = require('../utils/seoPages');

const now = Date.UTC(2026, 10, 10);
const day = 86400000;
const base = { _id: 'a'.repeat(24), title: 'Sales Executive', location: 'Chennai', status: 'active', createdAt: new Date(now - 5 * day), company: { name: 'Acme', is_verified: true } };
const shell = '<html><head><title>x</title></head><body><div id="root"></div></body></html>';

test('jobIsPublic follows the public-list rules', () => {
  delete process.env.HIDE_UNVERIFIED_JOBS;
  assert.strictEqual(V.jobIsPublic(base, now), true);
  assert.strictEqual(V.jobIsPublic({ ...base, company: { is_verified: false } }, now), false, 'unverified company');
  assert.strictEqual(V.jobIsPublic({ ...base, hiddenFromPublic: true }, now), false, 'admin hidden');
  assert.strictEqual(V.jobIsPublic({ ...base, createdAt: new Date(now - 60 * day) }, now), false, 'older than 45 days');
  assert.strictEqual(V.jobIsPublic({ ...base, createdAt: new Date(now - 60 * day), renewedAt: new Date(now - day) }, now), true, 'renewed stays');
  assert.strictEqual(V.jobIsPublic({ ...base, company: { is_verified: true, hiddenFromPublic: true } }, now), false);
  process.env.HIDE_UNVERIFIED_JOBS = 'false';
  assert.strictEqual(V.jobIsPublic({ ...base, company: { is_verified: false } }, now), true, 'switch off');
  delete process.env.HIDE_UNVERIFIED_JOBS;
});

test('job page of a hidden job is noindex and has no JobPosting data', () => {
  const ok = buildJobResponse({ slug: jobSlug(base), job: base, shell, now: new Date(now) });
  assert.match(ok.body, /index, follow/);
  assert.match(ok.body, /JobPosting/);
  const hid = { ...base, company: { name: 'Acme', is_verified: false } };
  const r = buildJobResponse({ slug: jobSlug(hid), job: hid, shell, now: new Date(now) });
  assert.strictEqual(r.tag, 'hidden');
  assert.match(r.body, /noindex, follow/);
  assert.doesNotMatch(r.body, /JobPosting/);
});

test('sitemap gives list pages a lastmod from the newest job or post', () => {
  const xml = buildSitemap({ jobs: [{ ...base, updatedAt: new Date(now) }], posts: [] });
  assert.match(xml, /<loc>[^<]*\/jobs<\/loc><lastmod>2026-11-10<\/lastmod>/);
  assert.doesNotMatch(xml, /\/terms<\/loc><lastmod>/);
  assert.doesNotMatch(buildSitemap({}), /<lastmod>/);
});

test('a job with no company follows the verified-company rule', () => {
  const now = Date.now();
  const job = { createdAt: new Date(now - 86400000) };
  const prev = process.env.HIDE_UNVERIFIED_JOBS;
  try {
    process.env.HIDE_UNVERIFIED_JOBS = 'true';
    assert.strictEqual(V.jobIsPublic({ ...job, company: null }, now), false);
    process.env.HIDE_UNVERIFIED_JOBS = 'false';
    assert.strictEqual(V.jobIsPublic({ ...job, company: null }, now), true);
  } finally { if (prev === undefined) delete process.env.HIDE_UNVERIFIED_JOBS; else process.env.HIDE_UNVERIFIED_JOBS = prev; }
});
