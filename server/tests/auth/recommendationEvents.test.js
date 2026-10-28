const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'e'.repeat(40);
const { buildClientEvents, recordClientEvents, recordOutcome, summarise, dayOf, MAX_PER_REQUEST } = require('../../utils/recommendationEvents');

const NOW = new Date('2026-11-01T20:00:00Z'); // 01:30 on 2 Nov in India
const U = 'a'.repeat(24);
const J = 'b'.repeat(24);
const C = 'c'.repeat(24);

test('the day is the India date', () => {
  assert.equal(dayOf(NOW), '2026-11-02');
});

test('seeker events need a valid job id; unknown events and surfaces are dropped', () => {
  const ops = buildClientEvents(U, 'seeker', [
    { event: 'shown', surface: 'jobs_matched', jobId: J, score: 82.4 },
    { event: 'clicked', surface: 'jobs_matched', jobId: 'not-an-id' },
    { event: 'applied', surface: 'jobs_matched', jobId: J },          // outcomes cannot be sent by the browser
    { event: 'shown', surface: 'somewhere_else', jobId: J },
    null,
  ], NOW);
  assert.equal(ops.length, 1);
  assert.deepEqual(ops[0].filter, { user: U, side: 'seeker', event: 'shown', surface: 'jobs_matched', job: J, candidate: null, day: '2026-11-02' });
  assert.equal(ops[0].update.$setOnInsert.score, 82);
});

test('recruiter events need a valid candidate id', () => {
  const ops = buildClientEvents(U, 'recruiter', [
    { event: 'shown', surface: 'top_candidates', candidateId: C, jobId: J, score: 71 },
    { event: 'shown', surface: 'top_candidates', jobId: J },
  ], NOW);
  assert.equal(ops.length, 1);
  assert.equal(ops[0].filter.candidate, C);
  assert.equal(ops[0].filter.side, 'recruiter');
});

test('scores are clamped, junk scores become null, and one request is capped', () => {
  const [a, b, c] = buildClientEvents(U, 'seeker', [
    { event: 'shown', surface: 'home_feed', jobId: J, score: 500 },
    { event: 'shown', surface: 'home_feed', jobId: J, score: 'abc' },
    { event: 'shown', surface: 'home_feed', jobId: J, score: null },
  ], NOW);
  assert.equal(a.update.$setOnInsert.score, 100);
  assert.equal(b.update.$setOnInsert.score, null);
  assert.equal(c.update.$setOnInsert.score, null);
  const many = Array.from({ length: 200 }, () => ({ event: 'shown', surface: 'home_feed', jobId: J }));
  assert.equal(buildClientEvents(U, 'seeker', many, NOW).length, MAX_PER_REQUEST);
  assert.deepEqual(buildClientEvents(U, 'seeker', 'nonsense', NOW), []);
});

test('events are written as per-day upserts, so a repeat view counts once a day', async () => {
  let written;
  const Model = { bulkWrite: async (ops, opts) => { written = { ops, opts }; } };
  const n = await recordClientEvents(Model, U, 'seeker', [{ event: 'shown', surface: 'jobs_matched', jobId: J }, { event: 'shown', surface: 'jobs_matched', jobId: J }], NOW);
  assert.equal(n, 2);
  assert.ok(written.ops.every((o) => o.updateOne.upsert === true));
  assert.equal(written.opts.ordered, false);
  assert.equal(await recordClientEvents({ bulkWrite: async () => { throw new Error('must not be called'); } }, U, 'seeker', [], NOW), 0);
});

const modelWith = (origin) => {
  const calls = {};
  return {
    calls,
    findOne: (q) => { calls.findOne = q; return { sort: () => ({ lean: async () => origin }) }; },
    updateOne: async (filter, update, opts) => { calls.updateOne = { filter, update, opts }; },
  };
};

test('an application counts only if the job was shown to that person in the last 30 days', async () => {
  const none = modelWith(null);
  assert.equal(await recordOutcome(none, { event: 'applied', applicantId: U, jobId: J }, NOW), false);
  assert.equal(none.calls.updateOne, undefined);
  assert.equal(none.calls.findOne.createdAt.$gte.getTime(), NOW.getTime() - 30 * 86400000);

  const shown = modelWith({ side: 'seeker', surface: 'jobs_matched', score: 77 });
  assert.equal(await recordOutcome(shown, { event: 'applied', applicantId: U, jobId: J }, NOW), true);
  assert.deepEqual(shown.calls.updateOne.filter, { user: U, side: 'seeker', event: 'applied', surface: 'jobs_matched', job: J, candidate: null, day: '2026-11-02' });
  assert.equal(shown.calls.updateOne.update.$setOnInsert.score, 77);
  assert.equal(shown.calls.updateOne.opts.upsert, true);
});

test('a candidate suggested to a recruiter who then applies is attributed to the recruiter surface', async () => {
  const m = modelWith({ side: 'recruiter', surface: 'top_candidates', score: 64 });
  await recordOutcome(m, { event: 'shortlisted', applicantId: U, jobId: J }, NOW);
  assert.deepEqual(m.calls.findOne.$or, [{ user: U, side: 'seeker' }, { candidate: U, side: 'recruiter' }]);
  assert.equal(m.calls.updateOne.filter.surface, 'top_candidates');
  assert.equal(m.calls.updateOne.filter.candidate, U);
});

test('only applied and shortlisted are outcomes, and ids must be valid', async () => {
  const m = modelWith({ side: 'seeker', surface: 'jobs_matched', score: 1 });
  assert.equal(await recordOutcome(m, { event: 'shown', applicantId: U, jobId: J }, NOW), false);
  assert.equal(await recordOutcome(m, { event: 'applied', applicantId: 'x', jobId: J }, NOW), false);
  assert.equal(await recordOutcome(m, { event: 'applied', applicantId: U, jobId: undefined }, NOW), false);
});

test('summary: click, apply and shortlist rates per side and surface', () => {
  const rows = [
    { _id: { side: 'seeker', surface: 'jobs_matched', event: 'shown' }, count: 200 },
    { _id: { side: 'seeker', surface: 'jobs_matched', event: 'clicked' }, count: 50 },
    { _id: { side: 'seeker', surface: 'jobs_matched', event: 'applied' }, count: 20 },
    { _id: { side: 'seeker', surface: 'jobs_matched', event: 'shortlisted' }, count: 5 },
    { _id: { side: 'recruiter', surface: 'top_candidates', event: 'shown' }, count: 40 },
  ];
  const out = summarise(rows);
  assert.equal(out.length, 2);
  const seeker = out.find((s) => s.side === 'seeker');
  assert.deepEqual([seeker.clickRate, seeker.applyRate, seeker.shortlistRate], [25, 10, 25]);
  const rec = out.find((s) => s.side === 'recruiter');
  assert.deepEqual([rec.clickRate, rec.applyRate, rec.shortlistRate], [0, 0, null]);
  assert.deepEqual(summarise([]), []);
});
