const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

const sent = [];
const company = { _id: 'c1', name: 'Acme', is_verified: false, save: async () => company };
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === '../models/Company') return { findById: async () => company };
  if (request === '../models/User') return { find: () => ({ select: () => ({ lean: async () => [{ _id: 'u1' }, { _id: 'u2' }] }) }) };
  if (request === '../utils/inAppNotifications') return { notifyUsers: async (n) => { sent.push(n); return []; } };
  return realLoad.call(this, request, ...rest);
};
const { setCompanyVerified } = require('../controllers/companyVerificationController');
const res = () => { const r = { code: 200 }; r.status = (n) => { r.code = n; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const run = async (body) => { const r = res(); await setCompanyVerified({ params: { id: 'a'.repeat(24) }, body, user: { id: 'adm' } }, r); await new Promise((x) => setImmediate(x)); return r; };

test('the first time a company is verified, everyone in it is told', async () => {
  const r = await run({ verified: true, note: 'Checked GST and website' });
  assert.equal(r.code, 200);
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].recipientIds, ['u1', 'u2']);
  assert.match(sent[0].message, /Acme/);
});

test('verifying again does not send a second notice, and taking the badge back sends none', async () => {
  await run({ verified: true, note: 'Checked again' });
  assert.equal(sent.length, 1);
  await run({ verified: false });
  assert.equal(sent.length, 1);
});
