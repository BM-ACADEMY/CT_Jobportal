const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SITE_URL = 'https://velaivaaipu.in';
process.env.API_PUBLIC_URL = 'https://api.velaivaaipu.in';
const { buildJobResponse, buildSitemap, jobSlug, jobIdFromSlug, getShell, resetShellCache } = require('../../utils/seoPages');

const SHELL = '<!doctype html><html><head><meta name="description" content="old" /><meta property="og:title" content="old" /><link rel="canonical" href="https://velaivaaipu.in/" /><title>old</title></head><body><div id="root"></div></body></html>';
const ID = 'a'.repeat(24);
const job = { _id: ID, title: 'Telecaller <Exec> & "QA"', location: 'Puducherry', vacancies: 2, description: '<p>Call leads</p>', status: 'active', createdAt: '2026-11-01', validThrough: '2099-01-01', jobType: 'Full-time', company: { name: 'Acme', logo: '/uploads/logo.png' }, salary: { min: 300000, max: 500000 } };
const slug = jobSlug(job);
const run = (over = {}, s = slug) => buildJobResponse({ slug: s, job: { ...job, ...over }, shell: SHELL, now: new Date('2026-11-05') });

test('open job: own title, canonical keyword URL, JobPosting and Open Graph in the raw HTML', () => {
  const r = run();
  assert.equal(r.status, 200); assert.equal(r.tag, 'job');
  assert.ok(r.body.includes('"@type":"JobPosting"'));
  assert.ok(r.body.includes(`rel="canonical" href="https://velaivaaipu.in/job/${slug}"`));
  assert.ok(!r.body.includes('content="old"') && !r.body.includes('<title>old</title>'));
  assert.match(r.body, /og:image" content="https:\/\/api\.velaivaaipu\.in\/uploads\/logo\.png"|og:image" content="https:\/\/velaivaaipu\.in\/og-default\.png"/);
  assert.ok(r.body.includes('"unitText":"YEAR"'));
});
test('job text is HTML-escaped and cannot close the script tag', () => {
  const r = run({ description: '</script><script>alert(1)</script>' });
  assert.ok(r.body.includes('Telecaller &lt;Exec&gt; &amp; &quot;QA&quot;'));
  assert.ok(!r.body.includes('</script><script>alert(1)'));
});
test('old /job/<id> link and changed titles redirect (301) to the keyword URL', () => {
  const r = run({}, ID);
  assert.equal(r.status, 301);
  assert.equal(r.headers.Location, `https://velaivaaipu.in/job/${slug}`);
  assert.equal(run({}, `old-title-${ID}`).status, 301);
});
test('closed or expired job stays reachable, noindex, and has no JobPosting', () => {
  for (const over of [{ status: 'closed' }, { validThrough: '2026-01-01' }]) {
    const r = run(over);
    assert.equal(r.status, 200); assert.equal(r.tag, 'closed');
    assert.ok(r.body.includes('noindex, follow') && !r.body.includes('JobPosting'));
  }
});
test('missing job: app served, noindex, canonical to /jobs', () => {
  const r = buildJobResponse({ slug: `gone-${'d'.repeat(24)}`, job: null, shell: SHELL });
  assert.equal(r.status, 200); assert.equal(r.tag, 'unavailable');
  assert.ok(r.body.includes('noindex, follow') && r.body.includes('href="https://velaivaaipu.in/jobs"'));
});
test('remote job gets TELECOMMUTE; hidden salary is not published', () => {
  const r = run({ workMode: 'Remote', salary: { min: 1, isRangeHidden: true } });
  assert.ok(r.body.includes('TELECOMMUTE') && !r.body.includes('baseSalary'));
});
test('slug helpers match the client rule', () => {
  assert.equal(jobIdFromSlug(`x-y-${ID}`), ID);
  assert.equal(jobIdFromSlug('no-id'), '');
  assert.ok(slug.endsWith(ID) && /^[a-z0-9-]+$/.test(slug));
});
test('sitemap lists static pages, jobs by keyword URL and companies', () => {
  const xml = buildSitemap({ jobs: [{ _id: ID, title: 'Telecaller', location: 'Puducherry', updatedAt: '2026-11-02' }], companies: [{ _id: 'b'.repeat(24), updatedAt: '2026-11-02' }] });
  assert.ok(xml.includes('<loc>https://velaivaaipu.in/jobs</loc>'));
  assert.ok(xml.includes(`<loc>https://velaivaaipu.in/job/telecaller-puducherry-${ID}</loc>`));
  assert.ok(xml.includes(`/companies/${'b'.repeat(24)}`));
});
test('the app shell is fetched once and cached; a failed fetch is an error', async () => {
  resetShellCache(); delete process.env.CLIENT_INDEX_PATH;
  let n = 0;
  const ok = async () => { n += 1; return { ok: true, text: async () => SHELL }; };
  await getShell({ fetchImpl: ok, now: 1000 }); await getShell({ fetchImpl: ok, now: 2000 });
  assert.equal(n, 1);
  resetShellCache();
  await assert.rejects(getShell({ fetchImpl: async () => ({ ok: false, status: 500 }) }), /shell 500/);
});
