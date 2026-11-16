const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const { cleanReferrer, optInNumber, inviteLink } = require('../utils/referral');

test('invite codes: only a 24-character account id is kept', () => {
  assert.equal(cleanReferrer('a'.repeat(24)), 'a'.repeat(24));
  for (const bad of ['', 'abc', 'g'.repeat(24), { $ne: 1 }, null, undefined, ['a'.repeat(24)]]) assert.equal(cleanReferrer(bad), '');
});

test('opt-in needs a real mobile number, from the form or the profile', () => {
  assert.deepEqual(optInNumber('+91 98765 43210', ''), { number: '9876543210' });
  assert.deepEqual(optInNumber('', '9876543210'), { number: '9876543210' });
  assert.deepEqual(optInNumber('123', '5555555555'), { error: 'Please add a valid 10-digit mobile number first' });
});

test('invite link', () => assert.equal(inviteLink('u1', 'https://velaivaaipu.in/'), 'https://velaivaaipu.in/register?role=jobseeker&ref=u1'));

let doc; let verifiedCount = 0;
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === '../models/User') return { findById: () => ({ select: async () => doc }), countDocuments: async (q) => { assert.equal(q.isVerified, true); return verifiedCount; } };
  return realLoad.call(this, request, ...rest);
};
const C = require('../controllers/whatsappReferralController');
const res = () => { const r = { code: 200 }; r.status = (n) => { r.code = n; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const run = async (fn, body) => { const r = res(); await fn({ body, user: { id: 'u1' } }, r); return r; };

test('opting in records the number and time; opting out records the time', async () => {
  doc = { profile: { phone: '' }, save: async () => {} };
  assert.equal((await run(C.setWhatsAppOptIn, { enabled: 'yes' })).code, 400);
  assert.equal((await run(C.setWhatsAppOptIn, { enabled: true })).code, 400);
  const on = await run(C.setWhatsAppOptIn, { enabled: true, number: '9876543210' });
  assert.deepEqual(on.body, { optIn: true, number: '9876543210' }); assert.ok(doc.whatsapp.optInAt);
  const off = await run(C.setWhatsAppOptIn, { enabled: false });
  assert.equal(off.body.optIn, false); assert.ok(doc.whatsapp.optOutAt);
});

test('the referral count only counts verified friends', async () => {
  verifiedCount = 3; doc = { whatsapp: { optIn: true, number: '9876543210' } };
  const r = await run(C.getReferrals, {});
  assert.equal(r.body.joined, 3); assert.match(r.body.link, /ref=u1$/); assert.equal(r.body.whatsapp.optIn, true);
});
