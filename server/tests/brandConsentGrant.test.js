const test = require('node:test');
const assert = require('node:assert/strict');
const { grantFromForm } = require('../utils/brandConsentGrant');

test('ticking the box records consent with its source and time', () => {
  const u = {}; const now = new Date('2026-11-10T04:00:00Z');
  assert.equal(grantFromForm(u, { brandContact: true }, 'counselling', now), true);
  assert.deepEqual(u.brandConsent, { contact: true, at: now, withdrawnAt: null, source: 'counselling' });
});
test('unticked, missing or text values never grant consent', () => {
  for (const body of [{}, { brandContact: false }, { brandContact: 'true' }, { brandContact: 1 }, undefined]) {
    const u = {}; assert.equal(grantFromForm(u, body), false); assert.equal(u.brandConsent, undefined);
  }
});
test('someone who already agreed keeps their original date', () => {
  const at = new Date('2026-11-01'); const u = { brandConsent: { contact: true, at } };
  assert.equal(grantFromForm(u, { brandContact: true }), false); assert.equal(u.brandConsent.at, at);
});
