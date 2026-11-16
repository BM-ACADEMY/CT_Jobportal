const test = require('node:test');
const assert = require('node:assert/strict');
const { planOtp, TTL_MS } = require('../utils/otpReuse');

const now = new Date('2026-11-13T10:00:00Z');
const gen = () => '999999';

test('a code that is still valid is sent again, with the same guess counter', () => {
  const p = planOtp({ otp: '123456', otpExpiry: new Date(now.getTime() + 60000), otpAttempts: 2 }, gen, now);
  assert.equal(p.otp, '123456'); assert.equal(p.reused, true);
  assert.equal(p.otpAttempts, 2, 'resending must not give extra guesses');
  assert.equal(p.otpExpiry.getTime(), now.getTime() + TTL_MS);
});

test('an expired code, a missing code or a used-up code gets a fresh one', () => {
  for (const u of [
    { otp: '123456', otpExpiry: new Date(now.getTime() - 1), otpAttempts: 0 },
    { otp: null, otpExpiry: null },
    { otp: '123456', otpExpiry: new Date(now.getTime() + 60000), otpAttempts: 5 },
  ]) {
    const p = planOtp(u, gen, now);
    assert.equal(p.otp, '999999'); assert.equal(p.reused, false); assert.equal(p.otpAttempts, 0);
  }
});

test('both resend and unverified login use the helper, and forgot-password still makes a new code', () => {
  const src = require('fs').readFileSync(require.resolve('../controllers/authController.js'), 'utf8');
  assert.equal((src.match(/otpReuse'\)\.planOtp/g) || []).length, 2);
});
