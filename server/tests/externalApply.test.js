const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { cleanApplyUrl, cleanExternalApply, isExternal } = require('../utils/externalApply');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('apply link must be a real https employer link', () => {
  assert.ok(cleanApplyUrl('https://careers.acme.com/job/12?id=3').url);
  for (const bad of ['', 'http://acme.com/x', 'javascript:alert(1)', 'https://bit.ly/abc', 'https://localhost/x', 'https://10.0.0.1/x', 'https://user:pw@acme.com', 'not a link', 'https://wa.me/9199']) {
    assert.ok(cleanApplyUrl(bad).error, bad);
  }
});

test('external job needs the real employer name; clicks start at zero', () => {
  assert.ok(cleanExternalApply({ url: 'https://acme.com/j', employerName: '' }).error);
  const r = cleanExternalApply({ url: 'https://acme.com/j', employerName: ' Acme Ltd ', sourceName: 'Careers page' });
  assert.deepStrictEqual(r.data, { url: 'https://acme.com/j', employerName: 'Acme Ltd', sourceName: 'Careers page', clicks: 0 });
  assert.strictEqual(isExternal({ externalApply: r.data }), true);
  assert.strictEqual(isExternal({}), false);
});

test('only admin routes create external jobs; recruiters cannot set the link', () => {
  const admin = read('routes/adminRoutes.js');
  assert.ok(admin.indexOf("'/external-jobs'") > admin.indexOf("router.use(authorizeRoles('admin'))"));
  const jobs = read('controllers/jobController.js');
  assert.ok(/'externalApply', 'applicantsCount'/.test(jobs), 'updateJob strips it');
  assert.ok(/'renewedAt', 'externalApply'\]\.forEach\(\(k\) => \{ delete newJobData/.test(jobs), 'clone drops it');
  assert.ok(!/externalApply/.test(jobs.split('const createJob')[1].split('const cloneJob')[0] || ''), 'createJob never reads it');
});

test('in-portal apply refuses external jobs; search data says not direct apply', () => {
  assert.ok(/EXTERNAL_APPLY/.test(read('controllers/applicationController.js')));
  assert.ok(/directApply: !job\.externalApply\?\.url/.test(read('utils/seoPages.js')));
});
