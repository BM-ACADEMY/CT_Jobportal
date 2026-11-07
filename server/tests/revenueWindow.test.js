const test = require('node:test');
const assert = require('node:assert/strict');
const { REVENUE_START, chartStart } = require('../utils/revenueWindow');

test('revenue starts on launch day, 5 Nov 2026 IST', () => {
  assert.equal(REVENUE_START.toISOString(), '2026-11-04T18:30:00.000Z');
});

test('chart window never starts before launch', () => {
  assert.ok(chartStart(new Date('2026-11-07T08:00:00Z')) >= REVENUE_START);
  assert.equal(chartStart(new Date('2026-11-07T08:00:00Z')).getTime(), REVENUE_START.getTime());
});

test('chart window goes back three months once launch is old enough', () => {
  const start = chartStart(new Date('2027-06-15T08:00:00Z'));
  assert.equal(start.getMonth(), 2); // March
  assert.equal(start.getDate(), 1);
});
