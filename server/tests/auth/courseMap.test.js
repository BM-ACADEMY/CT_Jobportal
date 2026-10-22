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
test('offer is scholarship only while it is running', () => {
  assert.match(offerText({ COURSE_SCHOLARSHIP_ACTIVE: 'true', COURSE_SCHOLARSHIP_PRICE: '2999' }), /2999/);
  assert.match(offerText({}), /counselling/i);
});
test('send window is 9:00-20:00 IST', () => {
  assert.equal(isSendWindow(new Date('2026-10-22T04:00:00Z')), true);  // 09:30 IST
  assert.equal(isSendWindow(new Date('2026-10-22T15:00:00Z')), false); // 20:30 IST
  assert.equal(isSendWindow(new Date('2026-10-22T20:00:00Z')), false); // 01:30 IST
});
test('pass ratio is 60%', () => assert.equal(PASS_RATIO, 0.6));
