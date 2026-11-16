const test = require('node:test');
const assert = require('node:assert');
const { buildPageResponse, buildJobResponse, buildSitemap, jobSlug, PAGE_TAGS, CITY_PAGES } = require('../utils/seoPages');

const shell = '<html><head><title>Home</title><meta name="description" content="home"><link rel="canonical" href="https://velaivaaipu.in/"></head><body><div id="root"></div></body></html>';

test('each public page gets its own title and canonical, never the homepage canonical', () => {
  for (const p of Object.keys(PAGE_TAGS).filter((x) => x !== '/')) {
    const b = buildPageResponse({ path: p, shell, openJobs: 50 }).body;
    assert.ok(b.includes(`<link rel="canonical" href="https://velaivaaipu.in${p}" />`), p);
    assert.doesNotMatch(b, /<title>Home<\/title>/);
    assert.ok((b.match(/rel="canonical"/g) || []).length === 1, 'one canonical: ' + p);
  }
});
test('home page keeps the root canonical and carries Organization data', () => {
  const b = buildPageResponse({ path: '/', shell }).body;
  assert.match(b, /href="https:\/\/velaivaaipu\.in\/" \/>/);
  assert.match(b, /"@type":"Organization"/);
  assert.match(b, /not a government website/i);
});
test('trailing slash and capitals map to the same page; unknown paths serve the plain app', () => {
  assert.strictEqual(buildPageResponse({ path: '/For-Colleges/', shell }).tag, 'page');
  const u = buildPageResponse({ path: '/something-else', shell });
  assert.strictEqual(u.tag, 'shell-unknown-page');
  assert.strictEqual(u.body, shell);
});
test('city pages below the minimum are noindex; others and unknown counts are indexable', () => {
  delete process.env.CITY_PAGE_MIN_JOBS;
  assert.match(buildPageResponse({ path: '/jobs/chennai', shell, openJobs: 3 }).body, /noindex, follow/);
  assert.match(buildPageResponse({ path: '/jobs/chennai', shell, openJobs: 10 }).body, /index, follow/);
  assert.match(buildPageResponse({ path: '/jobs/chennai', shell, openJobs: null }).body, /index, follow/);
  assert.match(buildPageResponse({ path: '/for-colleges', shell, openJobs: 0 }).body, /index, follow/, 'only city pages are thin-checked');
  process.env.CITY_PAGE_MIN_JOBS = '0';
  assert.match(buildPageResponse({ path: '/jobs/chennai', shell, openJobs: 0 }).body, /index, follow/);
  delete process.env.CITY_PAGE_MIN_JOBS;
});
test('sitemap leaves out the paths it is told to skip', () => {
  const xml = buildSitemap({ skipPaths: ['/jobs/chennai'] });
  assert.doesNotMatch(xml, /\/jobs\/chennai</);
  assert.match(xml, /\/jobs\/pondicherry</);
  assert.ok(Object.keys(CITY_PAGES).every((p) => buildSitemap({}).includes(p)));
});
test('job title does not repeat the brand when the company is Velaivaaipu itself', () => {
  const job = { _id: 'b'.repeat(24), title: 'Telecaller', location: 'Puducherry', status: 'active', createdAt: new Date(), company: { name: 'Velaivaaipu', is_verified: true } };
  const r = buildJobResponse({ slug: jobSlug(job), job, shell, now: new Date() });
  assert.match(r.body, /<title>Telecaller Job in Puducherry \| Velaivaaipu<\/title>/);
  assert.doesNotMatch(r.body, /Velaivaaipu \| Velaivaaipu/);
});
