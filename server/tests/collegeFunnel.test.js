const test = require('node:test');
const assert = require('node:assert/strict');
const { flagsFor, nextStep, summarise } = require('../utils/collegeFunnel');

test('a brand new college has only signed up, and its next step is the call', () => {
  const f = flagsFor({});
  assert.deepEqual(Object.keys(f).filter((k) => f[k]), ['signedUp']);
  assert.equal(nextStep(f), 'called');
});

test('steps are read from what the college has actually done', () => {
  const f = flagsFor({ students: 80, limit: 100, called: true, drive: true, report: false, tier: 'campus_free' });
  assert.equal(f.nearLimit, true); assert.equal(f.paid, false);
  assert.equal(nextStep(f), 'report');
  assert.equal(nextStep(flagsFor({ students: 5, limit: 100, called: true })), 'drive');
  assert.equal(nextStep(flagsFor({ students: 0, limit: 100, called: true })), 'students');
  assert.equal(nextStep(flagsFor({ students: 5, limit: 1000, called: true, drive: true, report: true, tier: 'campus_lite' })), null);
});

test('counts add up per step', () => {
  const rows = [flagsFor({}), flagsFor({ called: true, students: 3, limit: 100 }), flagsFor({ called: true, students: 100, limit: 100, tier: 'campus_lite' })].map((flags) => ({ flags }));
  const s = Object.fromEntries(summarise(rows).map((x) => [x.key, x.count]));
  assert.deepEqual(s, { signedUp: 3, called: 2, students: 2, drive: 0, report: 0, nearLimit: 1, paid: 1 });
});
