const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');

const mk = (o) => ({ saved: 0, async save() { this.saved++; }, ...o });
const users = {
  aaaaaaaaaaaaaaaaaaaaaaaa: mk({ _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', email: 'a@gmail.com', isVerified: false, otp: '123456', otpExpiry: new Date(), otpAttempts: 3, role: { name: 'jobseeker' } }),
  bbbbbbbbbbbbbbbbbbbbbbbb: mk({ _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', email: 'b@gmail.com', isVerified: true, role: { name: 'jobseeker' } }),
  cccccccccccccccccccccccc: mk({ _id: 'cccccccccccccccccccccccc', email: 'boss@gmail.com', isVerified: false, role: { name: 'admin' } }),
  dddddddddddddddddddddddd: mk({ _id: 'dddddddddddddddddddddddd', email: 'x@deleted.invalid', isVerified: false, role: { name: 'jobseeker' } }),
  eeeeeeeeeeeeeeeeeeeeeeee: mk({ _id: 'eeeeeeeeeeeeeeeeeeeeeeee', email: '9876543210@college.portal', isVerified: false, role: { name: 'jobseeker' } }),
};
const notified = [];
const real = Module._load;
Module._load = function (request, ...rest) {
  if (request === '../models/User') return { findById: (id) => ({ populate: async () => users[id] || null }) };
  if (request === '../utils/inAppNotifications') return { notifyUser: async (n) => { notified.push(n); } };
  return real.call(this, request, ...rest);
};
const { verifyUserEmail } = require('../controllers/adminVerifyEmailController');
Module._load = real;

const res = () => { const r = { code: 200 }; r.status = (n) => { r.code = n; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const call = async (id, body = {}) => { const r = res(); await verifyUserEmail({ params: { id }, body, user: { id: 'admin1' } }, r); return r; };

test('admin marks an unverified email verified, clears the old code and records who did it', async () => {
  const r = await call('aaaaaaaaaaaaaaaaaaaaaaaa', { note: 'code never arrived' });
  assert.equal(r.code, 200);
  const u = users.aaaaaaaaaaaaaaaaaaaaaaaa;
  assert.equal(u.isVerified, true);
  assert.equal(u.otp, null);
  assert.equal(u.otpExpiry, null);
  assert.equal(u.otpAttempts, 0);
  assert.equal(u.emailVerifiedByAdmin.by, 'admin1');
  assert.equal(u.emailVerifiedByAdmin.note, 'code never arrived');
  assert.equal(u.saved, 1);
  assert.equal(notified.length, 1);
});

test('an already verified email is left alone', async () => {
  const r = await call('bbbbbbbbbbbbbbbbbbbbbbbb');
  assert.equal(r.code, 200);
  assert.equal(r.body.alreadyVerified, true);
  assert.equal(users.bbbbbbbbbbbbbbbbbbbbbbbb.saved, 0);
});

test('admin accounts, deleted accounts and placeholder emails cannot be verified this way', async () => {
  for (const id of ['cccccccccccccccccccccccc', 'dddddddddddddddddddddddd', 'eeeeeeeeeeeeeeeeeeeeeeee']) {
    const r = await call(id);
    assert.equal(r.code, 400, id);
    assert.equal(users[id].isVerified, false, id);
    assert.equal(users[id].saved, 0, id);
  }
});

test('bad or unknown ids are refused', async () => {
  assert.equal((await call('nothex')).code, 400);
  assert.equal((await call('ffffffffffffffffffffffff')).code, 404);
});

test('the route sits below the admin-only gate so support staff cannot use it', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'routes', 'adminRoutes.js'), 'utf8');
  const gate = src.indexOf("router.use(authorizeRoles('admin'))");
  const route = src.indexOf("/users/:id/verify-email");
  assert.ok(gate > 0 && route > gate, 'verify-email route must come after the admin gate');
});

test('the button is hidden for read-only staff and for verified users', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'src', 'pages', 'admin', 'UserProfile.jsx'), 'utf8');
  assert.match(src, /!readOnly && !user\.isVerified && <Button/);
  assert.match(src, /admin\/users\/\$\{id\}\/verify-email/);
});
