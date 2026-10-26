const test = require('node:test');
const assert = require('node:assert');
const { SKILL_CATEGORIES, getCategory, offerText, isSendWindow, PASS_RATIO } = require('../../config/courseMap');

test('seven categories, each with a course', () => {
  assert.equal(SKILL_CATEGORIES.length, 7);
  SKILL_CATEGORIES.forEach((c) => assert.ok(c.key && c.label && c.course));
});
test('getCategory rejects unknown and non-string keys', () => {
  assert.equal(getCategory('ms-excel').course, 'Data Analytics with Power BI');
  assert.equal(getCategory('hack'), null);
  assert.equal(getCategory({ $ne: 1 }), null);
  assert.equal(getCategory('__proto__'), null);
});
test('scholarship applies only inside the festival dates', () => {
  const env = { COURSE_SCHOLARSHIP_ACTIVE: 'true', COURSE_SCHOLARSHIP_PRICE: '2999', COURSE_SCHOLARSHIP_START: '2026-11-08', COURSE_SCHOLARSHIP_END: '2026-11-12' };
  assert.match(offerText(env, new Date('2026-11-10T06:00:00Z')), /2999/);
  assert.match(offerText(env, new Date('2026-11-12T17:00:00Z')), /2999/); // last day, 22:30 IST
  assert.match(offerText(env, new Date('2026-11-12T19:00:00Z')), /counselling/i); // 00:30 IST on the 13th
  assert.match(offerText(env, new Date('2026-11-01T06:00:00Z')), /counselling/i);
  assert.match(offerText({ ...env, COURSE_SCHOLARSHIP_ACTIVE: 'false' }, new Date('2026-11-10T06:00:00Z')), /counselling/i);
  assert.match(offerText({}), /counselling/i);
});
test('send window is 9:00-20:00 IST', () => {
  assert.equal(isSendWindow(new Date('2026-10-22T04:00:00Z')), true);  // 09:30 IST
  assert.equal(isSendWindow(new Date('2026-10-22T15:00:00Z')), false); // 20:30 IST
  assert.equal(isSendWindow(new Date('2026-10-22T20:00:00Z')), false); // 01:30 IST
});
test('pass ratio is 60%', () => assert.equal(PASS_RATIO, 0.6));
