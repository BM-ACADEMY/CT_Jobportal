const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

const drives = [];
const users = { aaaaaaaaaaaaaaaaaaaaaaaa: { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Acme Hiring', role: { name: 'company' } }, bbbbbbbbbbbbbbbbbbbbbbbb: { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'A Seeker', role: { name: 'jobseeker' } } };
const driveStub = { create: async (d) => { const o = { _id: String(drives.length + 1).padStart(24, 'c'), ...d }; drives.push(o); return o; } };
const userStub = { findById: (id) => { const u = users[id] || null; const p = Promise.resolve(u); p.select = () => ({ populate: async () => u }); return p; } };
const real = Module._load;
Module._load = function (request, ...rest) {
  if (request === '../models/WalkInDrive') return driveStub;
  if (request === '../models/User') return userStub;
  if (request === '../models/DriveRegistration') return {};
  if (request === 'qrcode') return {};
  if (request === '../utils/sendEmail') return async () => true;
  if (request === '../utils/lifecycleEmails') return { unsubscribeLink: () => '' };
  return real.call(this, request, ...rest);
};
const c = require('../controllers/walkInDriveController');
Module._load = real;

const res = () => { const r = { code: 200 }; r.status = (n) => { r.code = n; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const future = () => new Date(Date.now() + 5 * 86400000).toISOString();
const body = (extra = {}) => ({ organiserId: 'aaaaaaaaaaaaaaaaaaaaaaaa', title: 'Walk-in for Sales Executives', date: future(), roles: [{ title: 'Sales', vacancies: 5, pay: '15000' }], slots: [{ label: '10:00 AM - 12:00 PM', capacity: 50 }], venue: { address: 'Main Road, Puducherry', city: 'Puducherry' }, plan: 'free', ...extra });

test('admin can publish a free drive for a company straight away', async () => {
  const r = res(); await c.adminCreateDrive({ user: { id: 'admin1' }, body: body() }, r);
  assert.equal(r.code, 201);
  assert.equal(drives.at(-1).status, 'published');
  assert.equal(drives.at(-1).organiser, 'aaaaaaaaaaaaaaaaaaaaaaaa');
});

test('a paid plan needs a payment note and is then marked paid', async () => {
  const none = res(); await c.adminCreateDrive({ user: { id: 'admin1' }, body: body({ plan: 'plus' }) }, none);
  assert.equal(none.code, 400);
  const ok = res(); await c.adminCreateDrive({ user: { id: 'admin1' }, body: body({ plan: 'plus', paymentNote: 'UPI 123456' }) }, ok);
  assert.equal(ok.code, 201);
  assert.equal(drives.at(-1).paid, true);
});

test('the organiser must be a company or recruiter account', async () => {
  const r = res(); await c.adminCreateDrive({ user: { id: 'admin1' }, body: body({ organiserId: 'bbbbbbbbbbbbbbbbbbbbbbbb' }) }, r);
  assert.equal(r.code, 400);
  const r2 = res(); await c.adminCreateDrive({ user: { id: 'admin1' }, body: body({ organiserId: 'nothex' }) }, r2);
  assert.equal(r2.code, 400);
});

test('both new routes sit below the admin-only gate', () => {
  const fs = require('fs');
  const src = fs.readFileSync(require.resolve('../routes/adminRoutes.js'), 'utf8');
  const gate = src.indexOf("authorizeRoles('admin')");
  assert.ok(gate > 0 && gate < src.indexOf("'/drives/create'") && gate < src.indexOf("'/drives/organisers'"));
});

test('public Drives page shows the organiser price list from the server settings, not hard-coded prices', () => {
  const fs = require('fs');
  const src = fs.readFileSync(require.resolve('../../client/src/pages/drives/Drives.jsx'), 'utf8');
  assert.match(src, /<OrganiserPlans \/>/);
  assert.match(src, /\/drives\/plans/);
  assert.doesNotMatch(src, /999|2,?999/);
});
