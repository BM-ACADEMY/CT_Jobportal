const test = require('node:test');
const assert = require('node:assert/strict');

// Stub the Subscription model: findOne returns whatever the test sets.
let freePlanRow = null;
const modelPath = require.resolve('../../models/Subscription');
require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: { findOne: async () => freePlanRow } };
const { getEffectivePlanLimit, getEffectiveSearchLimit } = require('../../utils/getEffectivePlanLimit');

const freeUser = { subscription: null };

test('no plan and a seeded Free plan: uses the Free plan value', async () => {
  freePlanRow = { activeJobPostings: 2 };
  assert.equal(await getEffectivePlanLimit(freeUser, 'company'), 2);
});

test('no plan and NO Free plan row: falls back to a limit, never unlimited', async () => {
  freePlanRow = null;
  delete process.env.DEFAULT_FREE_JOB_LIMIT;
  assert.equal(await getEffectivePlanLimit(freeUser, 'company'), 2);
  process.env.DEFAULT_FREE_JOB_LIMIT = '5';
  assert.equal(await getEffectivePlanLimit(freeUser, 'recruiter'), 5);
  delete process.env.DEFAULT_FREE_JOB_LIMIT;
});

test('expired paid plan and no Free plan row: also falls back, not unlimited', async () => {
  freePlanRow = null;
  const user = { subscription: { price: 999, duration: 'Monthly', activeJobPostings: 10 }, subscriptionExpiry: new Date(Date.now() - 86400000) };
  assert.equal(await getEffectivePlanLimit(user, 'company'), 2);
});

test('a real plan with 0 jobs still means unlimited', async () => {
  const user = { subscription: { price: 2499, duration: 'Monthly', activeJobPostings: 0 }, subscriptionExpiry: new Date(Date.now() + 86400000) };
  assert.equal(await getEffectivePlanLimit(user, 'company'), 0);
});

test('a valid paid plan returns its own limit', async () => {
  const user = { subscription: { price: 999, duration: 'Monthly', activeJobPostings: 10 }, subscriptionExpiry: new Date(Date.now() + 86400000) };
  assert.equal(await getEffectivePlanLimit(user, 'company'), 10);
});

test('search limit: no plan gets the Free default (10), a plan keeps its own, 0 stays unlimited', () => {
  delete process.env.DEFAULT_FREE_SEARCH_LIMIT;
  assert.equal(getEffectiveSearchLimit(null), 10);
  assert.equal(getEffectiveSearchLimit(undefined), 10);
  assert.equal(getEffectiveSearchLimit({ candidateSearchPerDay: 25 }), 25);
  assert.equal(getEffectiveSearchLimit({ candidateSearchPerDay: 0 }), 0);
  process.env.DEFAULT_FREE_SEARCH_LIMIT = '5';
  assert.equal(getEffectiveSearchLimit(null), 5);
  delete process.env.DEFAULT_FREE_SEARCH_LIMIT;
});
