const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { buildMatchReasons, withMatchReasons, matchReasonsEnabled } = require('../../utils/matchReasons');

const user = {
  name: 'Priya', gender: 'f',
  profile: { skills: ['MS Excel', 'Tally'], location: 'Pondicherry', interestedCategories: ['finance-accounts'], experience: [], jobPreferences: { locationTypes: ['Remote'] } },
};
const job = { title: 'Accounts Assistant', skillsRequired: ['Excel', 'Tally', 'GST'], location: 'Pondicherry', workMode: 'On-site', category: 'finance-accounts', experience: { min: 0, max: 2 } };

test('reasons cover skills, location, field and experience band, at most 4', () => {
  const r = buildMatchReasons(user, job);
  assert.ok(r.length >= 3 && r.length <= 4);
  assert.match(r[0], /^Skills: /);
  assert.ok(r.includes('In Pondicherry'));
  assert.ok(r.some((x) => /Your field: Finance/.test(x)));
  assert.ok(r.includes('Open to freshers'));
});
test('no overlap gives no reasons; nothing is invented', () => {
  assert.deepEqual(buildMatchReasons({ profile: {} }, { skillsRequired: ['Welding'], location: 'Delhi', category: 'manufacturing', experience: { min: 5 } }), []);
  assert.deepEqual(buildMatchReasons(null, null), []);
});
test('personal fields do not change the reasons', () => {
  assert.deepEqual(buildMatchReasons({ ...user, name: 'Zed', gender: 'm' }, job), buildMatchReasons(user, job));
});
test('flag: off by default (the relevance engine is off by default); on adds matchReasons without mutating', () => {
  assert.equal(matchReasonsEnabled({}), false);
  assert.equal(matchReasonsEnabled({ MATCH_REASONS_ENABLED: 'true' }), true);
  const jobs = [job];
  assert.strictEqual(withMatchReasons(user, jobs, {}), jobs);
  const out = withMatchReasons(user, jobs, { MATCH_REASONS_ENABLED: 'true' });
  assert.ok(Array.isArray(out[0].matchReasons) && out[0].matchReasons.length);
  assert.equal(jobs[0].matchReasons, undefined);
  const doc = { toObject: () => ({ ...job }) };
  assert.ok(withMatchReasons(user, [doc], { MATCH_REASONS_ENABLED: 'true' })[0].matchReasons.length);
});
test('both matched-jobs paths go through the helper; the client shows at most 2 chips', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../controllers/jobController.js'), 'utf8');
  assert.match(src, /withMatchReasons\(user, await getRankedMatches/);
  assert.match(src, /withMatchReasons\(user, matchingJobs\)/);
  const ui = fs.readFileSync(path.join(__dirname, '../../../client/src/pages/Jobs.jsx'), 'utf8');
  assert.match(ui, /matchReasons\.slice\(0, 2\)/);
});
