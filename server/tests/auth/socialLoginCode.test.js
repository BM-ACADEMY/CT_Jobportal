const test = require('node:test');
const assert = require('node:assert/strict');
const { issueSocialLoginCode, consumeSocialLoginCode, TTL_MS } = require('../../utils/socialLoginCode');

test('a code returns the user once', () => {
  const code = issueSocialLoginCode('u1');
  assert.equal(consumeSocialLoginCode(code), 'u1');
  assert.equal(consumeSocialLoginCode(code), null);
});

test('an unknown or empty code returns nothing', () => {
  assert.equal(consumeSocialLoginCode('nope'), null);
  assert.equal(consumeSocialLoginCode(undefined), null);
});

test('a code expires after its lifetime', () => {
  const now = Date.now();
  const code = issueSocialLoginCode('u2', now);
  assert.equal(consumeSocialLoginCode(code, now + TTL_MS + 1), null);
});
