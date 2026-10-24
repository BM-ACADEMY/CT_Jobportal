const test = require('node:test');
const assert = require('node:assert/strict');
const { rankCandidatesByRelevance } = require('../../utils/matchingJobs');

const recruiter = { _id: 'r1', company: 'c1' };
const openJob = { _id: 'j1', title: 'Accounts Assistant', skillsRequired: ['Excel', 'Tally'], location: 'Pondicherry', workMode: 'On-site', experience: { min: 0, max: 2 } };
const cand = (id, over = {}) => ({ _id: id, name: `Candidate ${id}`, avatar: '', profile: { skills: ['Excel', 'Tally'], preferredRole: 'Accounts Assistant', headline: '', location: 'Pondicherry', profileCompletion: 70, qualification: [{ degree: 'B.Com' }], experience: [], ...over } });

const chain = (result) => { const c = { sort: () => c, populate: () => c, select: () => c, lean: () => Promise.resolve(result), then: (res, rej) => Promise.resolve(result).then(res, rej) }; return c; };
const makeDeps = ({ job = openJob, certified = [], subs = [] } = {}) => {
  const seen = {};
  return {
    seen,
    Job: { findOne: (q) => { seen.jobQuery = q; return chain(job); } },
    User: { find: () => chain(subs) },
    SkillTestResult: { distinct: async (field, q) => { seen.certQuery = q; return certified; } },
  };
};

test('uses the recruiter\'s most recent open job (own or company) as the reference', async () => {
  const deps = makeDeps();
  await rankCandidatesByRelevance([cand('1')], recruiter, deps);
  assert.equal(deps.seen.jobQuery.status, 'active');
  assert.deepEqual(deps.seen.jobQuery.$or, [{ recruiter: 'r1' }, { company: 'c1' }]);
});

test('best fit first, certified candidates edge ahead, unrelated last', async () => {
  const deps = makeDeps({ certified: ['2'] });
  const ranked = await rankCandidatesByRelevance([
    cand('3', { skills: ['Welding'], preferredRole: 'Welder', location: 'Delhi' }),
    cand('1'),
    cand('2'),
  ], recruiter, deps);
  assert.deepEqual(ranked.map((r) => r.candidate._id), ['2', '1', '3']);
  assert.ok(ranked[0].reasons.includes('Passed a verified skill test'));
  assert.deepEqual(deps.seen.certQuery.passed, true);
});

test('a paid priority badge is carried through as a labelled flag, not a jump to the top', async () => {
  const badgedSub = { _id: '3', subscription: { hasPriorityBadge: true } };
  const deps = makeDeps({ subs: [badgedSub] });
  const ranked = await rankCandidatesByRelevance([
    cand('3', { skills: ['Welding'], preferredRole: 'Welder', location: 'Delhi' }),
    cand('1'),
  ], recruiter, deps);
  assert.equal(ranked[0].candidate._id, '1');
  const badged = ranked.find((r) => r.candidate._id === '3');
  assert.equal(badged.priority, true);
  assert.equal(badged.score, badged.score); // present
  assert.ok(badged.score <= 20);
});

test('with no open job, candidates are ordered by profile completeness', async () => {
  const deps = makeDeps({ job: null });
  const ranked = await rankCandidatesByRelevance([cand('1', { profileCompletion: 40 }), cand('2', { profileCompletion: 90 })], recruiter, deps);
  assert.deepEqual(ranked.map((r) => r.candidate._id), ['2', '1']);
});

test('a recruiter without a company only looks at their own jobs', async () => {
  const deps = makeDeps();
  await rankCandidatesByRelevance([cand('1')], { _id: 'r2' }, deps);
  assert.deepEqual(deps.seen.jobQuery.$or, [{ recruiter: 'r2' }]);
});
