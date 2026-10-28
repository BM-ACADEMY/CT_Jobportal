const test = require('node:test');
const assert = require('node:assert/strict');
const { getRankedMatches, engineEnabled, MIN_SCORE } = require('../../utils/matchingJobs');

const NOW = new Date('2026-11-01T10:00:00Z');
const daysAgo = (d) => new Date(NOW.getTime() - d * 86400000);

const user = {
  _id: 'u1', blockedEntities: ['co-bad'], hiddenJobs: ['hid'],
  profile: {
    skills: ['MS Excel', 'Tally'], preferredRole: 'Accounts Assistant', location: 'Pondicherry', profileCompletion: 80,
    qualification: [{ degree: 'B.Com' }], experience: [], jobPreferences: { locationTypes: ['On-site'], onSiteLocations: [{ city: 'Pondicherry' }] },
  },
};

const jobDoc = (over = {}) => {
  const plain = { _id: 'j', title: 'Accounts Assistant', status: 'active', skillsRequired: ['Excel', 'Tally'], location: 'Pondicherry', workMode: 'On-site', experience: { min: 0, max: 2 }, createdAt: daysAgo(1), validThrough: daysAgo(-20), recruiter: { _id: 'r1', subscription: { hasPriorityListing: false } }, company: { _id: 'c1', name: 'Acme' }, ...over };
  return { toObject: () => ({ ...plain }) };
};

// Minimal chainable stubs for the three models.
const makeDeps = (jobs, applied = []) => {
  const seen = { jobQuery: null };
  const chain = (result) => { const c = { populate: () => c, sort: () => c, limit: () => c, select: () => c, then: (res, rej) => Promise.resolve(result).then(res, rej) }; return c; };
  return {
    seen,
    Job: { find: (q) => { seen.jobQuery = q; return chain(jobs); } },
    User: { find: () => chain([{ _id: 'admin-blocked' }]) },
    Application: { find: () => chain(applied.map((id) => ({ job: id }))) },
  };
};

test('the engine is off unless the switch is exactly "true"', () => {
  assert.equal(engineEnabled({}), false);
  assert.equal(engineEnabled({ RELEVANCE_ENGINE_ENABLED: 'false' }), false);
  assert.equal(engineEnabled({ RELEVANCE_ENGINE_ENABLED: '1' }), false);
  assert.equal(engineEnabled({ RELEVANCE_ENGINE_ENABLED: 'true' }), true);
});

test('returns ranked jobs with a why-list, recruiter as an id, and the priority flag', async () => {
  const deps = makeDeps([
    jobDoc({ _id: 'good' }),
    jobDoc({ _id: 'prio', recruiter: { _id: 'r2', subscription: { hasPriorityListing: true } } }),
  ]);
  const out = await getRankedMatches(user, deps, { now: NOW });
  assert.equal(out.length, 2);
  const prio = out.find((j) => j._id === 'prio');
  assert.equal(prio.recruiter, 'r2');
  assert.equal(prio.isPriority, true);
  assert.equal(prio.relevance.priority, true);
  assert.ok(out[0].relevance.score >= out[1].relevance.score);
  assert.ok(out.every((j) => Array.isArray(j.relevance.reasons) && j.relevance.reasons.length > 0));
});

test('applied jobs and unrelated jobs are dropped', async () => {
  const deps = makeDeps([
    jobDoc({ _id: 'applied' }), jobDoc({ _id: 'ok' }),
    jobDoc({ _id: 'welder', title: 'Welder', skillsRequired: ['Welding'], location: 'Delhi' }),
  ], ['applied']);
  const out = await getRankedMatches(user, deps, { now: NOW });
  assert.deepEqual(out.map((j) => j._id), ['ok']);
  assert.ok(out.every((j) => j.relevance.score >= MIN_SCORE));
});

test('the database query excludes closed/expired jobs, blocked owners and hidden jobs', async () => {
  const deps = makeDeps([]);
  await getRankedMatches(user, deps, { now: NOW });
  const q = deps.seen.jobQuery;
  assert.equal(q.status, 'active');
  assert.deepEqual(q.validThrough, { $gt: NOW });
  assert.deepEqual(q.recruiter.$nin.sort(), ['admin-blocked', 'co-bad']);
  assert.deepEqual(q._id, { $nin: ['hid'] });
});

test('a thin profile still gets nearby jobs, flagged so the client can show the checklist', async () => {
  const thin = { _id: 'u2', profile: { location: 'Pondicherry', profileCompletion: 5, skills: [], jobPreferences: {} } };
  const deps = makeDeps([jobDoc({ _id: 'near' }), jobDoc({ _id: 'far', location: 'Chennai', createdAt: daysAgo(0) })]);
  const out = await getRankedMatches(thin, deps, { now: NOW });
  assert.deepEqual(out.map((j) => j._id), ['near', 'far']);
  assert.ok(out.every((j) => j.relevance.thin === true));
});
