const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const read = (rel) => fs.readFileSync(path.join(__dirname, '../../../', rel), 'utf8');

test('category pages: client route exists, sitemap lists every field of work, test links come only from the existing config', () => {
  const routes = read('client/src/routes/AppRoutes.jsx');
  assert.match(routes, /path="\/jobs\/category\/:slug"/);
  assert.match(routes, /path="\/certificate\/:code"/);
  const { STATIC_PAGES } = require('../../utils/seoPages');
  const { JOB_CATEGORIES } = require('../../config/jobCategories');
  for (const c of JOB_CATEGORIES) assert.ok(STATIC_PAGES.includes(`/jobs/category/${c.key}`), c.key);
  const { SKILL_CATEGORIES } = require('../../config/courseMap');
  const keys = new Set(SKILL_CATEGORIES.map((c) => c.key));
  const src = read('client/src/data/jobCategorySkillTests.js');
  for (const m of src.matchAll(/'([a-z-]+)'/g)) {
    if (JOB_CATEGORIES.some((c) => c.key === m[1])) continue;
    assert.ok(keys.has(m[1]), `${m[1]} is not an existing skill test`);
  }
});

test('Jobs page keeps sponsored handling and gains only the walk-in chip', () => {
  const jobs = read('client/src/pages/Jobs.jsx');
  assert.match(jobs, /job\.isSponsored/);
  assert.match(jobs, /label: 'Walk-in'/);
  assert.match(jobs, /const removalHints = \(\) =>/);
});

test('the home page already has the internships band, so none is added here', () => {
  assert.ok(fs.existsSync(path.join(__dirname, '../../../client/src/components/home/HomeInternships.jsx')));
});
