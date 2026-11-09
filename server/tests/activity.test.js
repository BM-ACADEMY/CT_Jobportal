const test = require('node:test');
const assert = require('node:assert/strict');
const { istDays, startOf, cleanDays, fill, funnel, compare, dayOf } = require('../utils/activity');

test('days are Indian calendar days, oldest first, today last', () => {
  assert.deepEqual(istDays(3, new Date('2026-11-10T20:00:00Z')), ['2026-11-09', '2026-11-10', '2026-11-11']); // 20:00Z is already 11 Nov in India
  assert.equal(dayOf(new Date('2026-11-10T18:29:00Z')), '2026-11-10'); assert.equal(dayOf(new Date('2026-11-10T18:31:00Z')), '2026-11-11');
  assert.equal(startOf('2026-11-10').toISOString(), '2026-11-09T18:30:00.000Z');
});
test('only the offered day windows are accepted', () => {
  assert.equal(cleanDays('30'), 30); assert.equal(cleanDays('5'), 14); assert.equal(cleanDays(undefined), 14); assert.equal(cleanDays('abc'), 14);
});
test('a day with no row counts as zero, and bad numbers do not break it', () => {
  assert.deepEqual(fill(['a', 'b', 'c'], [{ _id: 'b', n: 4 }, { _id: 'zz', n: 9 }, { _id: 'c', n: 'x' }]), [0, 4, 0]);
  assert.deepEqual(fill(['a'], [{ _id: 'a', v: 2 }], 'v'), [2]);
  assert.deepEqual(fill(['a'], undefined), [0]);
});
test('funnel shows each step against the first and the one before', () => {
  const f = funnel([['Registered', 200], ['Verified email', 120], ['Applied', 30], ['Paid', 3]]);
  assert.deepEqual(f.map((x) => [x.pctOfFirst, x.pctOfPrev]), [[100, 100], [60, 60], [15, 25], [2, 10]]);
  const z = funnel([['Registered', 0], ['Verified', 0]]); assert.deepEqual(z.map((x) => x.pctOfFirst), [0, 0]);
});
test('today is compared with the average of the 7 days before it', () => {
  const c = compare({ signups: [1, 2, 3, 4, 5, 6, 7, 8, 20], none: [] });
  assert.deepEqual(c.signups, { today: 20, avg7: 5 });
  assert.deepEqual(c.none, { today: 0, avg7: 0 });
});
