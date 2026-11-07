'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { computeExpiry, computeNextRenewalDate } = require('../../utils/pricing');

const DAY = 24 * 3600 * 1000;

test('a Daily plan runs for exactly one day (and N days for N periods), not zero', () => {
  const t = Date.now();
  const one = computeExpiry({ duration: 'Daily' }, 1).getTime();
  assert.ok(one - t > 23.9 * 3600 * 1000 && one - t < 24.1 * 3600 * 1000, 'about 24 hours');
  const three = computeExpiry({ duration: 'Daily' }, 3).getTime();
  assert.ok(three - t > 71.9 * 3600 * 1000 && three - t < 72.1 * 3600 * 1000, 'about 72 hours');
});

test('an unknown duration is the only thing that would expire at once, and Daily is not unknown', () => {
  assert.ok(computeExpiry({ duration: 'Daily' }, 1).getTime() > Date.now() + DAY / 2);
  assert.ok(computeExpiry({ duration: 'Monthly' }, 1).getTime() > Date.now() + 27 * DAY, 'monthly unchanged');
});

test('next renewal of a daily plan is a day later', () => {
  const from = new Date('2026-11-07T10:00:00Z');
  assert.equal(computeNextRenewalDate('Daily', from).toISOString(), '2026-11-08T10:00:00.000Z');
});
