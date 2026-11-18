const test = require('node:test');
const assert = require('node:assert/strict');
const { checkPrincipalCode, MAX_WRONG_TRIES } = require('../utils/principalCode');

const now = new Date('2026-11-10T12:00:00Z');
const later = new Date('2026-11-11T12:00:00Z');
const base = { code: '8844', expiry: later, attempts: 0 };

test('right code is accepted', () => assert.equal(checkPrincipalCode(base, '8844', now), 'ok'));
test('wrong code is refused', () => assert.equal(checkPrincipalCode(base, '1234', now), 'wrong'));
test('missing or odd input is refused, not a crash', () => {
  assert.equal(checkPrincipalCode(base, undefined, now), 'wrong');
  assert.equal(checkPrincipalCode(base, { $ne: '' }, now), 'wrong');
});
test('expired code is refused', () => assert.equal(checkPrincipalCode({ ...base, expiry: new Date('2026-11-10T11:00:00Z') }, '8844', now), 'expired'));
test('no code issued is refused', () => assert.equal(checkPrincipalCode({ code: null, expiry: null }, '8844', now), 'expired'));
test('locks after too many wrong tries, even for the right code', () => {
  assert.equal(checkPrincipalCode({ ...base, attempts: MAX_WRONG_TRIES }, '8844', now), 'locked');
  assert.equal(checkPrincipalCode({ ...base, attempts: MAX_WRONG_TRIES - 1 }, '8844', now), 'ok');
});
