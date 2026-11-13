const test = require('node:test');
const assert = require('node:assert');
const H = require('../utils/homeSummary');

test('unverified employer is told to finish verification first', () => {
  assert.strictEqual(H.employerNextAction({ verified: false, openJobs: 3, newApplicants: 5 }).key, 'verify');
});
test('employer next action order', () => {
  assert.strictEqual(H.employerNextAction({ verified: true, openJobs: 0 }).key, 'post');
  assert.strictEqual(H.employerNextAction({ verified: true, openJobs: 2, newApplicants: 4, staleJobs: 1 }).key, 'review');
  assert.match(H.employerNextAction({ verified: true, openJobs: 2, newApplicants: 1 }).text, /1 new applicant is/);
  assert.strictEqual(H.employerNextAction({ verified: true, openJobs: 2, newApplicants: 0, staleJobs: 2 }).key, 'renew');
  assert.strictEqual(H.employerNextAction({ verified: true, openJobs: 2 }).key, 'drive');
  assert.strictEqual(H.employerNextAction({ openJobs: 2, newApplicants: 0 }).key, 'drive'); // verified unknown (recruiter with no company) is not blocked
});
test('college next action', () => {
  assert.strictEqual(H.collegeNextAction({}).key, 'invite');
  assert.strictEqual(H.collegeNextAction({ students: 40, applied: 0 }).key, 'drive');
  assert.strictEqual(H.collegeNextAction({ students: 40, applied: 5 }).key, 'internships');
});
test('unlock tips are small, honest and capped at 3', () => {
  const t = H.unlockTips({ profile: { skills: ['a'], interestedCategories: [] } });
  assert.deepStrictEqual(t.map((x) => x.key), ['skills', 'resume', 'fields']);
  assert.match(t[0].text, /Add 4 more skills/);
  assert.strictEqual(H.unlockTips({ profile: { skills: [1, 2, 3, 4, 5], resumeUrl: 'x', interestedCategories: ['a', 'b', 'c'] } }).length, 0);
});
test('fill rows: matches first and untouched, then same field, then newest, no duplicates', () => {
  const m = [{ _id: 'm1' }, { _id: 'm2' }];
  const all = [
    { _id: 'm1', category: 'it', createdAt: '2026-11-01' },
    { _id: 'a', category: 'it', createdAt: '2026-10-01' },
    { _id: 'b', category: 'hr', createdAt: '2026-11-05' },
    { _id: 'c', category: 'hr', createdAt: '2026-11-08' },
  ];
  const r = H.fillRows({ matches: m, allJobs: all, interestedCategories: ['it'], limit: 5 });
  assert.deepStrictEqual(r.map((x) => `${x.job._id}:${x.why}`), ['m1:match', 'm2:match', 'a:field', 'c:new', 'b:new']);
  assert.strictEqual(H.fillRows({ matches: [], allJobs: [], limit: 6 }).length, 0);
});
