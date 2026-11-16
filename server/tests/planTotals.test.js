const test = require('node:test');
const assert = require('node:assert/strict');
const { mergePlanTotals } = require('../utils/planTotals');

test('plans with the same name are added together, biggest first', () => {
  const out = mergePlanTotals([
    { name: 'Free', value: 300 }, { name: 'Premium', value: 4 }, { name: 'Free', value: 200 }, { name: 'Free', value: 1 }
  ]);
  assert.deepEqual(out, [{ name: 'Free', value: 501 }, { name: 'Premium', value: 4 }]);
});

test('bad input gives an empty list and missing names are labelled', () => {
  assert.deepEqual(mergePlanTotals(null), []);
  assert.deepEqual(mergePlanTotals([{ value: 2 }]), [{ name: 'Unnamed plan', value: 2 }]);
});
