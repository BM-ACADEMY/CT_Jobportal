const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const { isSafeLogo, buildStrip, MIN_LOGOS, MAX_LOGOS } = require('../utils/logoStrip');

test('only png, jpg and webp from our uploads count as safe logos', () => {
  for (const ok of ['/uploads/a.png', 'uploads/b.JPG', '/uploads/c-1.jpeg', '/uploads/d.webp']) assert.equal(isSafeLogo(ok), true, ok);
  for (const bad of ['/uploads/a.svg', 'https://evil.com/a.png', '/uploads/a.png.exe', '/uploads/../etc/a.png', '', null, '/other/a.png']) assert.equal(isSafeLogo(bad), false, String(bad));
});

test('the strip hides itself under four, drops bad rows, and never shows more than twelve', () => {
  const row = (i, logo = `/uploads/${i}.png`) => ({ _id: i, name: `Org ${i}`, logo });
  assert.deepEqual(buildStrip([row(1), row(2), row(3)]), []);
  assert.deepEqual(buildStrip([row(1), row(2), row(3), row(4, '/uploads/x.svg')]), [], 'a bad file leaves only 3');
  assert.equal(buildStrip(Array.from({ length: 4 }, (_, i) => row(i))).length, MIN_LOGOS);
  assert.equal(buildStrip(Array.from({ length: 30 }, (_, i) => row(i))).length, MAX_LOGOS);
  assert.deepEqual(buildStrip([row(1), row(2), row(3), row(4)], () => 0).map((r) => r._id).sort(), [1, 2, 3, 4]);
});

const store = { company: null, college: null, user: { company: 'c' } };
const wrap = (o) => o && Object.assign(o, { save: async () => o });
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === '../models/Company') return { findById: async () => wrap(store.company) };
  if (request === '../models/College') return { findById: async () => wrap(store.college) };
  if (request === '../models/User') return { findById: () => ({ select: async () => store.user }) };
  if (request === '../models/Job') return {};
  return realLoad.call(this, request, ...rest);
};
const C = require('../controllers/logoController');
const res = () => { const r = { code: 200 }; r.status = (n) => { r.code = n; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const run = async (fn, req) => { const r = res(); await fn({ params: { id: 'a'.repeat(24) }, body: {}, user: { id: 'u' }, ...req }, r); return r; };

test('a company agrees; withdrawing also removes approval', async () => {
  store.company = { showLogo: false, logoApproved: true };
  assert.equal((await run(C.setLogoConsent, { body: { show: 'yes' } })).code, 400);
  const on = await run(C.setLogoConsent, { body: { show: true } });
  assert.deepEqual(on.body, { showLogo: true, logoApproved: true });
  const off = await run(C.setLogoConsent, { body: { show: false } });
  assert.deepEqual(off.body, { showLogo: false, logoApproved: false });
});

test('admin approval needs a verified company that agreed, with a safe file', async () => {
  const ap = (body) => run(C.approveCompanyLogo, { body });
  store.company = { is_verified: false, showLogo: true, logo: '/uploads/a.png' };
  assert.match((await ap({ approved: true })).body.msg, /Verify/);
  store.company = { is_verified: true, showLogo: false, logo: '/uploads/a.png' };
  assert.match((await ap({ approved: true })).body.msg, /not agreed/);
  store.company = { is_verified: true, showLogo: true, logo: '/uploads/a.svg' };
  assert.match((await ap({ approved: true })).body.msg, /PNG/);
  store.company = { is_verified: true, showLogo: true, logo: '/uploads/a.png' };
  assert.equal((await ap({ approved: true })).body.logoApproved, true);
  assert.equal((await ap({ approved: false })).body.logoApproved, false);
  assert.equal((await run(C.approveCompanyLogo, { params: { id: 'x' }, body: { approved: true } })).code, 400);
});

test('a college logo needs a verified college, a safe file and a note of how it agreed', async () => {
  const set = (body) => run(C.setCollegeLogo, { body });
  store.college = { verificationStatus: 'pending', logo: '/uploads/a.png' };
  assert.match((await set({ show: true, note: 'agreed by phone' })).body.msg, /Verify/);
  store.college = { verificationStatus: 'verified', logo: '/uploads/a.png' };
  assert.match((await set({ show: true, note: 'ok' })).body.msg, /how the college agreed/);
  const ok = await set({ show: true, note: 'agreed by phone, 9 Nov' });
  assert.equal(ok.body.showLogo, true); assert.equal(store.college.logoApproved, true);
  await set({ show: false });
  assert.equal(store.college.logoApproved, false); assert.equal(store.college.logoConsentNote, '');
});
