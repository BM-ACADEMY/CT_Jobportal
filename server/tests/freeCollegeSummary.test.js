const test = require('node:test');
const assert = require('node:assert');
const S = require('../utils/freeCollegeSummary');

const base = { _id: 'c1', name: 'Test College', isActive: true, verificationStatus: 'verified', subscriptionTier: 'campus_free', principalEmail: 'p@college.edu' };
const now = new Date('2026-11-20T05:00:00Z');

test('only verified, active free colleges with an email and no summary this month are picked', () => {
  const colleges = [
    base,
    { ...base, _id: 'c2', subscriptionTier: 'campus_lite' },
    { ...base, _id: 'c3', verificationStatus: 'pending' },
    { ...base, _id: 'c4', isActive: false },
    { ...base, _id: 'c5', principalEmail: '', additionalReportRecipients: [] },
    { ...base, _id: 'c6', subscriptionTier: undefined },
    { ...base, _id: 'c7' },
  ];
  const due = S.pickDue({ colleges, sentKeys: new Set([S.keyFor('c7', now)]), now });
  assert.deepStrictEqual(due.map((c) => c._id), ['c1', 'c6']);
});
test('the once-a-month key follows India time and changes with the month', () => {
  assert.strictEqual(S.monthOf(new Date('2026-11-30T19:00:00Z')), '2026-12'); // 00:30 IST on 1 December
  assert.strictEqual(S.keyFor('c1', now), 'fcs:c1:2026-11');
  assert.notStrictEqual(S.keyFor('c1', now), S.keyFor('c1', new Date('2026-12-02T05:00:00Z')));
});
test('the summary shows three numbers, a next step and a pointer to the paid report, and escapes names', () => {
  const html = S.summaryHtml({ college: { ...base, name: 'A <b>&</b> College', principalName: 'Dr X' }, stats: { joined: 12, drives: 0, placed: 3 }, frontendUrl: 'https://velaivaaipu.in', emailWrapper: (t, b) => `<h1>${t}</h1>${b}` });
  assert.match(html, />12</); assert.match(html, />0</); assert.match(html, />3</);
  assert.match(html, /create a drive/i);
  assert.match(html, /velaivaaipu\.in\/college\/subscription/);
  assert.doesNotMatch(html, /<b>&<\/b>/);
});
test('next step depends on what happened', () => {
  assert.match(S.nextStep({ joined: 0, drives: 0 }), /QR code/);
  assert.match(S.nextStep({ joined: 5, drives: 0 }), /drive/);
  assert.match(S.nextStep({ joined: 5, drives: 1 }), /placement result/);
});
test('FREE_COLLEGE_SUMMARY=off switches it off', () => {
  assert.strictEqual(S.enabled({}), true);
  assert.strictEqual(S.enabled({ FREE_COLLEGE_SUMMARY: 'off' }), false);
});
