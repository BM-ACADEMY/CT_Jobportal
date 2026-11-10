const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');

// Stand-ins for the database models, so the admin "record a pack" handler can run without MongoDB.
const state = { payments: [], saveFails: false, college: null };
const stubs = {
  College: { findById: async () => state.college },
  CollegePackPayment: {
    findOne: (q) => ({ lean: async () => state.payments.find((p) => Date.now() - p.createdAt < 30000) || null }),
    create: async (d) => { const p = { ...d, _id: 'p' + (state.payments.length + 1), createdAt: Date.now() }; state.payments.push(p); return p; },
    deleteOne: async ({ _id }) => { state.payments = state.payments.filter((p) => p._id !== _id); },
  },
  AdminRequest: { updateMany: async () => ({}) },
  User: {},
};
const realLoad = Module._load;
Module._load = function (req, ...a) {
  const m = req.match(/models\/(College|CollegePackPayment|AdminRequest|User)$/);
  if (m) return stubs[m[1]];
  if (/inAppNotifications$/.test(req)) return { notifyRoles: async () => {}, notifyUser: async () => {} };
  return realLoad.call(this, req, ...a);
};
const { recordPack } = require('../controllers/collegePackController');
Module._load = realLoad;

const res = () => { const r = { code: 200 }; r.status = (c) => { r.code = c; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const mkCollege = () => ({ verificationStatus: 'verified', studentLimit: 100, extraStudents: 0, extraUntil: null, save: async function () { if (state.saveFails) throw new Error('db down'); } });
const call = async () => { const r = res(); await recordPack({ params: { id: 'a'.repeat(24) }, body: { packs: 1, note: 'UPI, 12 Nov' }, user: { id: 'admin1' } }, r); return r; };

test('a pack is recorded once, and the same pack tapped twice in a row is refused', async () => {
  Object.assign(state, { payments: [], saveFails: false, college: mkCollege() });
  const a = await call(); assert.equal(a.code, 200);
  const b = await call(); assert.equal(b.code, 409);
  assert.equal(state.payments.length, 1);
});
test('if saving the college fails, the payment record is removed so a retry is not counted twice', async () => {
  Object.assign(state, { payments: [], saveFails: true, college: mkCollege() });
  const a = await call(); assert.equal(a.code, 500);
  assert.equal(state.payments.length, 0);
  state.saveFails = false;
  const b = await call(); assert.equal(b.code, 200);
  assert.equal(state.payments.length, 1);
});
test('a plan that does not change the tier (Campus Starter) never lowers a college\'s student limit', () => {
  const src = fs.readFileSync(__dirname + '/../utils/paymentFulfillment.js', 'utf8');
  assert.match(src, /COLLEGE_TIER_MAP\[plan\.name\] \? newLimit : Math\.max\(Number\(college\.studentLimit\) \|\| 0, newLimit\)/);
});
test('re-running the campus plan seed keeps a plan the admin switched off', () => {
  const src = fs.readFileSync(__dirname + '/../scripts/seedCampusPlans.js', 'utf8');
  assert.match(src, /const \{ isActive: _ignored, \.\.\.rest \} = plan;/);
  assert.match(src, /Object\.assign\(existing, rest\)/);
});
