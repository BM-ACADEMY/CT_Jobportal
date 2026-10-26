// Run with: node --test client/api/__tests__/seo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.API_BASE_URL = 'https://api.example.test/api';
process.env.SITE_URL = 'https://velaivaaipu.in';

const SHELL = '<!doctype html><html><head><meta charset="UTF-8" /><meta name="description" content="old" /><meta property="og:title" content="old" /><link rel="canonical" href="https://velaivaaipu.in/" /><title>old</title></head><body><div id="root"></div></body></html>';
const OPEN = 'a'.repeat(24);
const CLOSED = 'b'.repeat(24);

globalThis.fetch = async (url) => {
  const u = String(url);
  const ok = (data) => ({ ok: true, status: 200, json: async () => data, text: async () => SHELL });
  if (u.endsWith('/')) return { ok: true, status: 200, text: async () => SHELL };
  if (u.includes(`/jobs/${OPEN}`)) return ok({ _id: OPEN, title: 'React <Dev> & "QA"', location: 'Pondicherry', vacancies: 2, description: '<p>Build things</p>', createdAt: '2026-10-01', validThrough: '2026-11-01', jobType: 'Full-time', company: { name: 'Acme', logo: '/uploads/logo.png' }, salary: { min: 300000, max: 500000 } });
  if (u.includes(`/jobs/${CLOSED}`)) return ok({ _id: CLOSED, closed: true, title: 'Old role', location: 'Chennai', company: { name: 'Acme' } });
  if (u.includes('/jobs/')) return { ok: false, status: 404, json: async () => ({}) };
  if (u.includes('sitemap-feed')) return ok({ jobs: [{ id: OPEN, title: 'React Dev', location: 'Pondicherry', updatedAt: '2026-10-02' }], companies: [] });
  throw new Error(`unexpected fetch ${u}`);
};

const mkRes = () => {
  const r = { code: 0, headers: {}, body: '' };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.send = (b) => { r.body = b; return r; };
  return r;
};
const call = async (handler, req) => { const res = mkRes(); await handler(req, res); return res; };
const jobReq = (slug) => ({ query: { slug }, headers: { host: 'velaivaaipu.in' } });

const { default: job } = await import('../job.js');
const { default: sitemap } = await import('../sitemap.js');

test('open job: JobPosting, canonical slug URL and OG tags are in the raw HTML', async () => {
  const res = await call(job, jobReq(`react-dev-pondicherry-${OPEN}`));
  assert.equal(res.code, 200);
  assert.ok(res.body.includes('"@type":"JobPosting"'));
  assert.match(res.body, /rel="canonical" href="https:\/\/velaivaaipu\.in\/job\/react-dev-qa-pondicherry-a{24}"/);
  assert.match(res.body, /og:image" content="https:\/\/api\.example\.test\/uploads\/logo\.png"/);
  assert.equal((res.body.match(/rel="canonical"/g) || []).length, 1);
  assert.ok(!res.body.includes('content="old"'));
});

test('job text is HTML-escaped in tags', async () => {
  const res = await call(job, jobReq(OPEN));
  assert.ok(res.body.includes('React &lt;Dev&gt; &amp; &quot;QA&quot;'));
});

test('closed job stays reachable (200), is noindex and has no JobPosting', async () => {
  const res = await call(job, jobReq(`old-role-${CLOSED}`));
  assert.equal(res.code, 200);
  assert.ok(res.body.includes('noindex'));
  assert.ok(!res.body.includes('JobPosting'));
});

test('unknown job is 200 + noindex, never a hard 404', async () => {
  const res = await call(job, jobReq(`gone-${'d'.repeat(24)}`));
  assert.equal(res.code, 200);
  assert.ok(res.body.includes('noindex'));
});

test('sitemap lists static pages and slugged job URLs', async () => {
  const res = await call(sitemap, {});
  assert.match(res.headers['Content-Type'], /xml/);
  assert.ok(res.body.includes(`https://velaivaaipu.in/job/react-dev-pondicherry-${OPEN}`));
  assert.ok(res.body.includes('https://velaivaaipu.in/for-colleges'));
});
