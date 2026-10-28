const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'w'.repeat(40);

// Stub the models the endpoint touches so no database is needed.
const stub = (path, exports) => { const p = require.resolve(path); require.cache[p] = { id: p, filename: p, loaded: true, exports }; };
let jobRow = null;
let userRow = null;
stub('../../models/Job', { findById: async () => jobRow });
stub('../../models/User', { findById: async () => userRow, find: () => ({ select: () => ({ lean: async () => [] }) }) });
stub('../../models/Role', { findOne: async () => null });

const { getTopCandidates } = require('../../controllers/jobController');

const res = () => { const r = { code: 200, body: null }; r.status = (c) => { r.code = c; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const makeJob = (over = {}) => ({ recruiter: { toString: () => 'r1' }, company: { toString: () => 'c1' }, toObject() { return { _id: 'j1', recruiter: 'r1', company: 'c1' }; }, ...over });

test('switch off: the endpoint says disabled and returns nothing', async () => {
  delete process.env.RELEVANCE_ENGINE_ENABLED;
  const r = res();
  await getTopCandidates({ user: { id: 'r1' }, params: { jobId: 'j1' } }, r);
  assert.deepEqual(r.body, { enabled: false, candidates: [] });
});

test('the job owner gets a result; another recruiter gets 403', async () => {
  process.env.RELEVANCE_ENGINE_ENABLED = 'true';
  jobRow = makeJob();
  userRow = { company: null };
  const owner = res();
  await getTopCandidates({ user: { id: 'r1' }, params: { jobId: 'j1' } }, owner);
  assert.equal(owner.code, 200);
  assert.equal(owner.body.enabled, true);
  assert.deepEqual(owner.body.candidates, []);

  const other = res();
  await getTopCandidates({ user: { id: 'someone-else' }, params: { jobId: 'j1' } }, other);
  assert.equal(other.code, 403);
  delete process.env.RELEVANCE_ENGINE_ENABLED;
});

test('an unknown job is a 404', async () => {
  process.env.RELEVANCE_ENGINE_ENABLED = 'true';
  jobRow = null;
  userRow = { company: null };
  const r = res();
  await getTopCandidates({ user: { id: 'r1' }, params: { jobId: 'nope' } }, r);
  assert.equal(r.code, 404);
  delete process.env.RELEVANCE_ENGINE_ENABLED;
});
