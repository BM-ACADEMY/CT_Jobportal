const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('submitted fairs are forced to pending, own, not supported, and a scam-flagged fair is refused', () => {
  const c = read('controllers/jobFairController.js');
  const body = c.slice(c.indexOf('const submitFair'), c.indexOf('const myFairs'));
  assert.match(body, /kind: 'own'/);
  assert.match(body, /supportedByUs: false/);
  assert.match(body, /status: 'pending'/);
  assert.match(body, /jobScamFlags/);
  assert.match(body, /submittedBy: req\.user\.id/);
  assert.match(body, /MAX_OPEN_SUBMISSIONS/);
});
test('public lists only show published fairs, so pending ones stay hidden', () => {
  const c = read('controllers/jobFairController.js');
  assert.match(c, /status: 'published'/);
  assert.doesNotMatch(c.slice(c.indexOf('const listFairs'), c.indexOf('const loadPublic')), /pending/);
  assert.match(c, /status: \{ \$in: \['published', 'closed'\] \}/);
});
test('submit route is for company or recruiter only, rate limited, above the :slug routes', () => {
  const r = read('routes/jobFairs.js');
  const i = r.indexOf("router.post('/submit'");
  assert.ok(i > -1 && i < r.indexOf("router.get('/:slug'"));
  assert.match(r.slice(i, i + 200), /authorizeRoles\('company', 'recruiter'\)/);
  assert.match(r.slice(i, i + 200), /rateLimit/);
});
test('model has the pending status and submittedBy', () => {
  const m = read('models/JobFair.js');
  assert.match(m, /'pending'/);
  assert.match(m, /submittedBy/);
});
