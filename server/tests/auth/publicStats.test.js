const test = require('node:test');
const assert = require('node:assert/strict');
const { isTestEmail, computeHeroStats, createCache, TTL_MS } = require('../../utils/publicStats');

test('test, demo and QA emails are recognised; real ones are not', () => {
  for (const e of ['a@example.com', 'x@test.com', 'me+test1@gmail.com', 'demo@gmail.com', 'test.user@gmail.com', 'qa01@gmail.com', 'z@mailinator.com', 'Q@YOPMAIL.COM']) {
    assert.equal(isTestEmail(e), true, e);
  }
  for (const e of ['priya.s@gmail.com', 'ravi@tcs.com', 'contest.winner@gmail.com', 'latest@gmail.com', 'a@testimonials.in', '', null, undefined]) {
    assert.equal(isTestEmail(e), false, String(e));
  }
});

test('STATS_EXCLUDE_EMAIL_REGEX adds patterns, and a broken pattern is ignored', () => {
  process.env.STATS_EXCLUDE_EMAIL_REGEX = '@staging\\.velaivaaipu\\.in$';
  assert.equal(isTestEmail('a@staging.velaivaaipu.in'), true);
  process.env.STATS_EXCLUDE_EMAIL_REGEX = '([unclosed';
  assert.equal(isTestEmail('a@example.com'), true);
  assert.equal(isTestEmail('real@gmail.com'), false);
  delete process.env.STATS_EXCLUDE_EMAIL_REGEX;
});

// Minimal stand-ins for the Mongoose models: they record the filters they were given.
const makeModels = ({ testIds = ['t1', 't2'], openJobs = 12, companies = ['c1', 'c2', null, 'c3'], students = 40, role = { _id: 'r1' } } = {}) => {
  const calls = {};
  return {
    calls,
    User: {
      find: (f) => ({ select: () => ({ lean: async () => { calls.testFilter = f; return testIds.map((_id) => ({ _id })); } }) }),
      countDocuments: async (f) => { calls.studentFilter = f; return students; },
    },
    Job: {
      countDocuments: async (f) => { calls.jobFilter = f; return openJobs; },
      distinct: async (field, f) => { calls.distinctField = field; calls.distinctFilter = f; return companies; },
    },
    Role: { findOne: () => ({ lean: async () => role }) },
  };
};

test('hero stats: test accounts excluded from jobs, companies and students', async () => {
  const m = makeModels();
  const out = await computeHeroStats(m);
  assert.deepEqual(out, { openJobs: 12, companiesHiring: 3, students: 40 });
  assert.ok(m.calls.testFilter.email instanceof RegExp);
  assert.deepEqual(m.calls.jobFilter.recruiter, { $nin: ['t1', 't2'] });
  assert.equal(m.calls.jobFilter.status, 'active');
  assert.equal(m.calls.distinctField, 'company');
  assert.deepEqual(m.calls.distinctFilter.recruiter, { $nin: ['t1', 't2'] });
  assert.deepEqual(m.calls.studentFilter._id, { $nin: ['t1', 't2'] });
  assert.deepEqual(m.calls.studentFilter.isDeleted, { $ne: true });
  assert.deepEqual(m.calls.studentFilter.isAdminBlocked, { $ne: true });
  assert.equal(m.calls.studentFilter.role, 'r1');
});

test('hero stats: expired jobs are not counted as open', async () => {
  const m = makeModels();
  const now = new Date('2026-11-05T00:00:00Z');
  await computeHeroStats({ ...m, now });
  const clauses = m.calls.jobFilter.$or;
  assert.ok(clauses.some((c) => c.validThrough && c.validThrough.$gte === now));
  assert.ok(clauses.some((c) => c.validThrough === null));
});

test('hero stats: no jobseeker role means zero students, not a crash', async () => {
  const out = await computeHeroStats(makeModels({ role: null }));
  assert.equal(out.students, 0);
});

test('cache: one load per window, shared by concurrent callers, refreshed after the TTL', async () => {
  let now = 1000;
  let loads = 0;
  const cache = createCache(TTL_MS, () => now);
  const load = async () => { loads += 1; await new Promise((r) => setTimeout(r, 5)); return { n: loads }; };
  const [a, b] = await Promise.all([cache.get(load), cache.get(load)]);
  assert.equal(loads, 1);
  assert.equal(a, b);
  now += TTL_MS - 1;
  assert.equal((await cache.get(load)).n, 1);
  now += 2;
  assert.equal((await cache.get(load)).n, 2);
  assert.equal(loads, 2);
});

test('cache: a failed load is not cached', async () => {
  const cache = createCache(TTL_MS);
  await assert.rejects(cache.get(async () => { throw new Error('db down'); }), /db down/);
  assert.deepEqual(await cache.get(async () => ({ ok: true })), { ok: true });
});

test('cache window is about ten minutes', () => {
  assert.equal(TTL_MS, 10 * 60 * 1000);
});
