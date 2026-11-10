const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

const created = []; const alerts = [];
let open = false;
const college = { _id: 'c1', name: 'ABC College', collegePhone: '9000000000' };
const stubs = {
  '../models/College': { findOne: async () => college },
  '../models/CollegePackPayment': {},
  '../models/AdminRequest': { exists: async () => open, create: async (d) => { created.push(d); return d; } },
  '../models/User': { findById: () => ({ select: async () => ({ name: 'TPO', email: 't@abc.edu', phone: '' }) }) },
  '../utils/inAppNotifications': { notifyRoles: async (n) => { alerts.push(n); }, notifyUser: async () => {} },
  '../utils/serviceRequestMessages': { receivedMessage: () => ({}) },
};
const realLoad = Module._load;
Module._load = function (request, ...rest) { return stubs[request] || realLoad.call(this, request, ...rest); };
const { requestUpgradeCall } = require('../controllers/collegePackController');
const res = () => { const r = { code: 200 }; r.status = (n) => { r.code = n; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const run = async (body) => { const r = res(); await requestUpgradeCall({ user: { id: 'u1' }, body }, r); return r; };

test('asking for a call makes one task for our team with what the college wants', async () => {
  const r = await run({ interest: 'plan', note: 'Principal wants a quote' });
  assert.equal(r.code, 201);
  assert.equal(created.length, 1);
  assert.equal(created[0].type, 'college_upgrade');
  assert.match(created[0].notes, /a bigger plan/); assert.match(created[0].notes, /Principal wants a quote/);
  assert.equal(created[0].bookingPhone, '9000000000', 'falls back to the college number');
  assert.equal(alerts.length, 1);
});

test('an unknown choice becomes "not sure", and a second ask while one is open makes no second task', async () => {
  created.length = 0; alerts.length = 0; open = false;
  await run({ interest: '<script>' });
  assert.match(created[0].notes, /not sure yet/);
  open = true;
  const r = await run({ interest: 'pack' });
  assert.equal(r.code, 200); assert.match(r.body.msg, /already have your request/);
  assert.equal(created.length, 1); assert.equal(alerts.length, 1);
});
