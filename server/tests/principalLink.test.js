const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

// A tiny stand-in for the College collection: findOneAndUpdate with "attempts below the limit" and a counter.
const college = { _id: 'c1', principalPasskey: 'PK-abc', principalAccessCode: '4821', principalAccessCodeExpiry: new Date(Date.now() + 864e5), principalAccessAttempts: 0, name: 'X' };
const College = {
  findOneAndUpdate: async (f, u) => {
    if (f.principalPasskey !== college.principalPasskey) return null;
    if (!(college.principalAccessAttempts < f.principalAccessAttempts.$lt)) return null;
    const before = { ...college }; college.principalAccessAttempts += u.$inc.principalAccessAttempts; return before;
  },
  updateOne: async (f, u) => { if (u.$set) Object.assign(college, u.$set); },
};
const { tryPrincipalAccess } = require('../utils/principalCode');
const call = async (passkey, code) => ({ ok: !!(await tryPrincipalAccess(College, passkey, code)) });

test('a wrong code, an unknown link and an expired code all fail the same way', async () => {
  assert.equal((await call('PK-nope', '1111')).ok, false);
  assert.equal((await call('PK-abc', '1111')).ok, false);
  college.principalAccessCodeExpiry = new Date(Date.now() - 1000);
  assert.equal((await call('PK-abc', '4821')).ok, false);
});

test('the right code works and resets the count', async () => {
  college.principalAccessCodeExpiry = new Date(Date.now() + 864e5); college.principalAccessAttempts = 2;
  assert.equal((await call('PK-abc', '4821')).ok, true);
  assert.equal(college.principalAccessAttempts, 0);
});

test('after 5 tries even the right code is refused, and 30 parallel guesses only count 5', async () => {
  college.principalAccessAttempts = 0;
  await Promise.all(Array.from({ length: 30 }, (_, i) => call('PK-abc', String(1000 + i))));
  assert.equal(college.principalAccessAttempts, 5);
  assert.equal((await call('PK-abc', '4821')).ok, false);
});
