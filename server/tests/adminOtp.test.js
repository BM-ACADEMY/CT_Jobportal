const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
process.env.JWT_SECRET = 'z'.repeat(40);
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === '../config/jwt') return { getJwtSecret: () => process.env.JWT_SECRET };
  return realLoad.call(this, request, ...rest);
};
const { newOtp, hashOtp, twoFactorRequired, checkOtp, MAX_ATTEMPTS } = require('../utils/adminOtp');

const fresh = (otp, extra = {}) => ({ storedHash: hashOtp(otp), expires: new Date(Date.now() + 60000), attempts: 0, ...extra });

test('codes are six digits and the stored value is a hash, not the code', () => {
  for (let i = 0; i < 200; i++) assert.match(newOtp(), /^\d{6}$/);
  assert.notEqual(hashOtp('123456'), '123456');
  assert.equal(hashOtp('123456').length, 64);
});

test('the right code passes, a wrong one does not', () => {
  assert.equal(checkOtp(fresh('123456'), '123456').status, 'ok');
  assert.equal(checkOtp(fresh('123456'), ' 123456 ').status, 'ok');
  const wrong = checkOtp(fresh('123456'), '654321');
  assert.equal(wrong.status, 'wrong');
  assert.equal(wrong.nextAttempts, 1);
  assert.equal(checkOtp(fresh('123456'), '').status, 'wrong');
  assert.equal(checkOtp(fresh('123456'), undefined).status, 'wrong');
});

test('an expired code is refused', () => {
  assert.equal(checkOtp(fresh('123456', { expires: new Date(Date.now() - 1000) }), '123456').status, 'expired');
});

test('no code asked for means nothing passes', () => {
  assert.equal(checkOtp({ storedHash: undefined, expires: undefined }, '123456').status, 'none');
  assert.equal(checkOtp({ storedHash: undefined, expires: undefined }, '').status, 'none');
});

test('after five wrong tries even the right code is locked out', () => {
  assert.equal(checkOtp(fresh('123456', { attempts: MAX_ATTEMPTS }), '123456').status, 'locked');
  assert.equal(checkOtp(fresh('123456', { attempts: MAX_ATTEMPTS - 1 }), '123456').status, 'ok');
});

test('the switch is off by default and turns the second step on for every admin', () => {
  const plain = { twoFactorAuth: { enabled: false } };
  assert.equal(twoFactorRequired(plain, {}), false);
  assert.equal(twoFactorRequired(plain, { ADMIN_2FA_ENABLED: 'false' }), false);
  assert.equal(twoFactorRequired(plain, { ADMIN_2FA_ENABLED: 'true' }), true);
  assert.equal(twoFactorRequired({ twoFactorAuth: { enabled: true } }, {}), true);
  assert.equal(twoFactorRequired({}, {}), false);
});
