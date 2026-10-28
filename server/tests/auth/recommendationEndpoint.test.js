const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'r'.repeat(40);
const written = [];
const modelPath = require.resolve('../../models/RecommendationEvent');
require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: {
  bulkWrite: async (ops) => { written.push(...ops); },
  aggregate: async () => [
    { _id: { side: 'seeker', surface: 'jobs_matched', event: 'shown' }, count: 10 },
    { _id: { side: 'seeker', surface: 'jobs_matched', event: 'clicked' }, count: 2 },
  ],
} };
const { postEvents, getSummary } = require('../../controllers/recommendationController');

const J = 'b'.repeat(24);
const C = 'c'.repeat(24);
const res = () => { const r = { code: 200, body: null }; r.sendStatus = (c) => { r.code = c; return r; }; r.status = (c) => { r.code = c; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const body = { events: [{ event: 'shown', surface: 'jobs_matched', jobId: J, candidateId: C, score: 80 }] };

test('switch off: events are accepted but nothing is stored', async () => {
  delete process.env.RELEVANCE_ENGINE_ENABLED;
  written.length = 0;
  const r = res();
  await postEvents({ user: { id: 'a'.repeat(24), role: 'jobseeker' }, body }, r);
  assert.equal(r.code, 204);
  assert.equal(written.length, 0);
});

test('switch on: a job seeker stores a seeker event, a recruiter a recruiter event', async () => {
  process.env.RELEVANCE_ENGINE_ENABLED = 'true';
  written.length = 0;
  await postEvents({ user: { id: 'a'.repeat(24), role: 'jobseeker' }, body }, res());
  assert.equal(written.length, 1);
  assert.equal(written[0].updateOne.filter.side, 'seeker');
  written.length = 0;
  await postEvents({ user: { id: 'a'.repeat(24), role: 'company' }, body: { events: [{ event: 'shown', surface: 'top_candidates', candidateId: C, jobId: J }] } }, res());
  assert.equal(written[0].updateOne.filter.side, 'recruiter');
  delete process.env.RELEVANCE_ENGINE_ENABLED;
});

test('roles without suggestions (admin, college) store nothing', async () => {
  process.env.RELEVANCE_ENGINE_ENABLED = 'true';
  written.length = 0;
  const r = res();
  await postEvents({ user: { id: 'a'.repeat(24), role: 'admin' }, body }, r);
  assert.equal(r.code, 204);
  assert.equal(written.length, 0);
  delete process.env.RELEVANCE_ENGINE_ENABLED;
});

test('the summary returns rates and clamps the day range', async () => {
  const r = res();
  await getSummary({ query: { days: '9999' } }, r);
  assert.equal(r.body.days, 180);
  assert.equal(r.body.surfaces[0].clickRate, 20);
  const r2 = res();
  await getSummary({ query: {} }, r2);
  assert.equal(r2.body.days, 30);
});
