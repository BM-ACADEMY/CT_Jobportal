'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildChanges, computeExpiry, checkUsageReset, readFields } = require('../../utils/planEntitlements');

const NOW = Date.parse('2026-11-09T10:00:00Z');
const DAY = 24 * 3600 * 1000;
const plus = { name: 'Plus', price: 499, duration: 'Monthly', hasResumeBuilder: true, resumeBuilderCount: 3, hasAiResumeReview: true, aiResumeReviewCount: 2, jobAlerts: 'Weekly' };

describe('changing one person\'s plan benefits', () => {
  it('Sharmi\'s example: resume count 3 -> 5 changes only that value, and the original is untouched', () => {
    const r = buildChanges(plus, { resumeBuilderCount: 5 });
    assert.deepEqual(r.errors, []);
    assert.equal(r.next.resumeBuilderCount, 5);
    assert.equal(plus.resumeBuilderCount, 3, 'the input copy is not modified');
    assert.deepEqual(r.diff.map((d) => [d.key, d.beforeText, d.afterText]), [['resumeBuilderCount', '3', '5']]);
    assert.equal(r.next.aiResumeReviewCount, 2, 'other values stay');
  });

  it('a value that is already the same is not listed as a change', () => {
    assert.equal(buildChanges(plus, { resumeBuilderCount: 3, hasResumeBuilder: true }).diff.length, 0);
  });

  it('numbers must be whole and in range; text numbers from a form are accepted', () => {
    assert.equal(buildChanges(plus, { resumeBuilderCount: '7' }).next.resumeBuilderCount, 7);
    for (const bad of [-1, 1.5, 100001, 'abc', null]) assert.ok(buildChanges(plus, { resumeBuilderCount: bad }).errors.length, String(bad));
  });

  it('switches need On or Off, selects need a known value, and unknown settings are refused (no price, no role, no id)', () => {
    assert.ok(buildChanges(plus, { hasResumeBuilder: 'yes' }).errors.length);
    assert.ok(buildChanges(plus, { jobAlerts: 'Hourly' }).errors.length);
    assert.equal(buildChanges(plus, { jobAlerts: 'Daily' }).next.jobAlerts, 'Daily');
    for (const key of ['price', 'role', 'name', '_id', 'duration', 'razorpayPlanId', 'isActive']) {
      assert.match(buildChanges(plus, { [key]: 1 }).errors[0], /not a setting that can be changed/, key);
    }
  });

  it('0 is shown as unlimited for counts where the code treats 0 that way', () => {
    assert.equal(buildChanges(plus, { resumeBuilderCount: 0 }).diff[0].afterText, '0 (unlimited)');
  });

  it('the screen gets every editable field with its current value', () => {
    const f = readFields(plus);
    assert.equal(f.find((x) => x.key === 'resumeBuilderCount').value, 3);
    assert.equal(f.find((x) => x.key === 'hasProfileBoost').value, false, 'missing switch shows Off');
  });
});

describe('changing the end date', () => {
  it('adds days from the later of today and the current end date', () => {
    const inTen = new Date(NOW + 10 * DAY);
    assert.equal(computeExpiry({ currentExpiry: inTen, extendDays: 5, now: NOW }).expiry.getTime(), NOW + 15 * DAY);
    const expired = new Date(NOW - 20 * DAY);
    assert.equal(computeExpiry({ currentExpiry: expired, extendDays: 5, now: NOW }).expiry.getTime(), NOW + 5 * DAY, 'an expired plan is extended from today');
  });

  it('accepts a future end date (to the end of that day) and refuses past, invalid, too far, or both at once', () => {
    assert.ok(computeExpiry({ expiry: '2026-12-31', now: NOW }).expiry > new Date('2026-12-31T00:00:00'));
    assert.ok(computeExpiry({ expiry: '2026-11-01', now: NOW }).error);
    assert.ok(computeExpiry({ expiry: 'not a date', now: NOW }).error);
    assert.ok(computeExpiry({ expiry: '2045-01-01', now: NOW }).error);
    assert.ok(computeExpiry({ expiry: '2026-12-31', extendDays: 3, now: NOW }).error);
    for (const bad of [0, -2, 2.5, 4000]) assert.ok(computeExpiry({ extendDays: bad, now: NOW }).error, String(bad));
  });

  it('asking for nothing is not an error and not a change', () => {
    assert.deepEqual(computeExpiry({ now: NOW }), { changed: false });
  });
});

describe('resetting usage', () => {
  it('accepts known counters only', () => {
    assert.deepEqual(checkUsageReset(['messagesUsed', 'messagesUsed']).keys, ['messagesUsed']);
    assert.ok(checkUsageReset(['password']).error);
    assert.ok(checkUsageReset('messagesUsed').error);
    assert.deepEqual(checkUsageReset(undefined).keys, []);
  });
});
