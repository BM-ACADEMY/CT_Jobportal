'use strict';
// Platform staff (support, counsellor, college verifier) on the subadmin role.
//  1. requireAdminOr: who passes, who gets 403.
//  2. Every admin route a staff role may reach, proven per route with five callers: that staff role
//     with the permission passes, the same role without it gets 403, another staff role gets 403,
//     a normal user gets 403, admin still passes. Routes not opened to staff stay admin-only.
//  3. Request scoping helpers and the staff management controller.
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const path = require('node:path');
const fs = require('node:fs');

process.env.JWT_SECRET = 'x'.repeat(40);
const SRV = path.join(__dirname, '..', '..');

// --- stubs ------------------------------------------------------------------------------------------
let stubUser = null;            // what User.findById(...).select().lean() returns (middleware lookup)
const fakeDb = { users: [], saves: [] };
const noop = (req, res, next) => next && next();
const handlerProxy = () => new Proxy({}, { get: (t, name) => (name in t ? t[name] : name === '__esModule' ? false : noop) });
const chain = (result) => { const q = { populate: () => q, select: () => q, sort: () => q, lean: async () => result, then: (r, j) => Promise.resolve(result).then(r, j) }; return q; };
const UserStub = {
  findById: (id) => {
    const doc = fakeDb.users.find(u => String(u._id) === String(id)) || null;
    return { select: () => ({ lean: async () => stubUser }), populate: () => chain(doc), then: (r, j) => Promise.resolve(doc).then(r, j) };
  },
  findOne: (q) => chain(fakeDb.users.find(u => u.email === q.email) || null),
  find: () => chain(fakeDb.users.filter(u => u.role?.name === 'subadmin')),
};
const RoleStub = { findOne: ({ name }) => ({ select: async () => ({ _id: `${name}RoleId` }) }), find: () => ({ select: async () => [] }) };
const realLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (/models\/User$/.test(request)) return UserStub;
  if (/models\/Role$/.test(request)) return RoleStub;
  if (request === 'dotenv') return { config: () => ({}) };
  if (/controllers\/staffController$/.test(request)) return realLoad.call(this, request, parent, ...rest);
  if (/controllers\//.test(request) || /middleware\/upload$/.test(request) || /middlewares\/aiDailyCap$/.test(request) || /middlewares\/rateLimit$/.test(request) || /webhookRawBody$/.test(request)) {
    const p = handlerProxy();
    if (/middleware\/upload$/.test(request)) { p.single = () => noop; p.fields = () => noop; p.array = () => noop; p.convertImagesToWebp = noop; }
    if (/aiDailyCap$/.test(request)) return { aiDailyCap: () => noop };
    if (/rateLimit$/.test(request)) return { rateLimit: () => noop };
    return p;
  }
  return realLoad.call(this, request, parent, ...rest);
};

const { requireAdminOr, staffMayTouchRequestType, staffRequestTypeFilter } = require('../../middlewares/staffPermission');
const { STAFF_ROLES, STAFF_PERMISSION_KEYS, STAFF_REQUEST_TYPES } = require('../../config/staffPermissions');
const staffController = require('../../controllers/staffController');

const makeRes = () => { const res = { statusCode: 200, body: null }; res.status = (c) => { res.statusCode = c; return res; }; res.json = (b) => { res.body = b; return res; }; return res; };
const run = async (mw, user, staff) => {
  stubUser = staff === undefined ? null : { staff };
  const req = { user };
  const res = makeRes();
  let passed = false;
  await mw(req, res, () => { passed = true; });
  return { passed, status: res.statusCode, body: res.body };
};
const ADMIN = { id: 'a', role: 'admin' };
const STAFF = { id: 's', role: 'subadmin' };
const SEEKER = { id: 'j', role: 'jobseeker' };
const RECRUITER = { id: 'r', role: 'recruiter' };
const otherRoleFor = (key) => Object.values(STAFF_ROLES).find(r => !r.permissions.includes(key)).permissions;
const ownRoleFor = (key) => Object.values(STAFF_ROLES).find(r => r.permissions.includes(key)).permissions;

describe('requireAdminOr', () => {
  it('rejects unknown keys at startup', () => {
    assert.throws(() => requireAdminOr('delete_everything'), /unknown staff permission/);
    assert.throws(() => requireAdminOr(), /unknown staff permission/);
  });
  it('admin passes without a lookup; normal users get the old "Admin only" 403 without a lookup', async () => {
    let lookups = 0; const before = UserStub.findById; UserStub.findById = (...a) => { lookups += 1; return before(...a); };
    assert.equal((await run(requireAdminOr('tickets_view'), ADMIN)).passed, true);
    for (const u of [SEEKER, RECRUITER, { id: 'c', role: 'company' }, { id: 'x', role: 'college' }, null]) {
      const r = await run(requireAdminOr('tickets_view'), u);
      assert.equal(r.status, 403); assert.equal(r.body.msg, 'Access denied: Admin only');
    }
    assert.equal(lookups, 0);
    UserStub.findById = before;
  });
  it('staff pass only with one of the listed keys, and the 403 names the missing permission', async () => {
    assert.equal((await run(requireAdminOr('tickets_view'), STAFF, { role: 'support', permissions: ['tickets_view'] })).passed, true);
    assert.equal((await run(requireAdminOr('tickets_update', 'tickets_view'), STAFF, { role: 'support', permissions: ['tickets_view'] })).passed, true);
    const r = await run(requireAdminOr('tickets_update'), STAFF, { role: 'support', permissions: ['tickets_view'] });
    assert.equal(r.status, 403); assert.match(r.body.msg, /Reply to and close tickets/); assert.equal(r.body.permission, 'tickets_update');
    assert.equal((await run(requireAdminOr('tickets_view'), STAFF, null)).status, 403, 'subadmin with no staff record');
    assert.equal((await run(requireAdminOr('tickets_view'), STAFF, { role: 'counsellor', permissions: STAFF_ROLES.counsellor.permissions })).status, 403);
  });
});

// --- route wiring + per-route five-caller proof ------------------------------------------------------
const gatesOf = (router) => {
  const out = { USE: [] };
  for (const layer of router.stack) {
    if (layer.route) {
      const gates = layer.route.stack.map(l => l.handle).filter(h => h.staffPermissionKeys);
      for (const method of Object.keys(layer.route.methods)) out[`${method.toUpperCase()} ${layer.route.path}`] = gates;
    } else if (layer.handle.staffPermissionKeys) out.USE.push(layer.handle);
  }
  return out;
};
const proveRoute = async (gate, label) => {
  const key = gate.staffPermissionKeys[0];
  assert.equal((await run(gate, ADMIN)).passed, true, `${label}: admin passes`);
  assert.equal((await run(gate, STAFF, { permissions: ownRoleFor(key) })).passed, true, `${label}: staff role with ${key} passes`);
  assert.equal((await run(gate, STAFF, { permissions: ownRoleFor(key).filter(k => !gate.staffPermissionKeys.includes(k)) })).status, 403, `${label}: same role without ${key} gets 403`);
  assert.equal((await run(gate, STAFF, { permissions: otherRoleFor(key) })).status, 403, `${label}: another staff role gets 403`);
  assert.equal((await run(gate, SEEKER)).status, 403, `${label}: job seeker gets 403`);
  assert.equal((await run(gate, RECRUITER)).status, 403, `${label}: recruiter gets 403`);
};
const expectGates = async (router, expected, routerName) => {
  const g = gatesOf(router);
  for (const [route, keys] of Object.entries(expected)) {
    assert.ok(g[route], `${routerName} ${route} exists`);
    assert.deepEqual(g[route].map(h => h.staffPermissionKeys), [keys], `${routerName} ${route}`);
    await proveRoute(g[route][0], `${routerName} ${route}`);
  }
  return g;
};

describe('admin routes opened to staff, proven per route', () => {
  it('support tickets', async () => {
    await expectGates(require('../../routes/ticketRoutes.js'), { 'GET /admin/all': ['tickets_view'], 'PATCH /admin/:id': ['tickets_update'] }, 'tickets');
  });
  it('requests (counsellor)', async () => {
    const g = await expectGates(require('../../routes/requests.js'), {
      'GET /admin': ['requests_view'], 'GET /admin/assignees': ['requests_assign'], 'PATCH /admin/:id': ['requests_update'], 'PATCH /admin/:id/assign': ['requests_assign'],
    }, 'requests');
    assert.deepEqual(g['POST /counselling'], [], 'job seeker routes carry no staff gate');
  });
  it('college verification', async () => {
    await expectGates(require('../../routes/collegeRoutes.js'), {
      'GET /admin/all-colleges': ['colleges_view'], 'GET /admin/colleges/:collegeId': ['colleges_view'], 'PUT /admin/verify/:collegeId': ['colleges_verify'],
    }, 'college');
  });
  it('admin users: read-only for support; everything else in the admin router stays admin-only', async () => {
    const router = require('../../routes/adminRoutes.js');
    const g = await expectGates(router, {
      'GET /users': ['users_view'], 'GET /users/:id': ['users_view'], 'GET /users/:id/applications': ['users_view'], 'GET /roles': ['users_view'],
    }, 'admin');
    // the router-wide admin gate sits after the staff reads and before every write
    const idx = (pred) => router.stack.findIndex(pred);
    const adminGateIdx = idx(l => !l.route && l.handle.name !== 'verifyToken' && !l.handle.staffPermissionKeys);
    assert.ok(adminGateIdx > idx(l => l.route?.path === '/users/:id/applications'), 'staff reads come before the admin-only gate');
    for (const p of ['/users/:id', '/staff', '/companies/:id', '/jobs/:id', '/dashboard-stats']) {
      const i = idx(l => l.route?.path === p && !l.route.methods.get);
      const anyIdx = idx(l => l.route?.path === p);
      assert.ok((i === -1 ? anyIdx : i) > adminGateIdx, `${p} is behind the admin-only gate`);
    }
    const adminGate = router.stack[adminGateIdx].handle;
    for (const u of [STAFF, SEEKER]) assert.equal((await run(adminGate, u)).status, 403, `${u.role} stopped by the admin gate`);
    assert.equal((await run(adminGate, ADMIN)).passed, true);
    assert.deepEqual(g['DELETE /users/:id'], [], 'delete user has no staff gate');
    assert.deepEqual(g['POST /staff'], [], 'staff management has no staff gate');
  });
  it('coupons are admin-only now (subadmin used to have full access)', async () => {
    const router = require('../../routes/couponRoutes.js');
    const uses = router.stack.filter(l => !l.route && l.handle.name !== 'verifyToken').map(l => l.handle);
    assert.ok(uses.length >= 1);
    const results = await Promise.all(uses.map(h => run(h, STAFF, { permissions: STAFF_PERMISSION_KEYS })));
    assert.ok(results.some(r => r.status === 403), 'a staff member with every permission is still refused');
    assert.ok((await Promise.all(uses.map(h => run(h, ADMIN)))).every(r => r.passed));
  });
  it('the client permission list matches the server list', () => {
    const client = fs.readFileSync(path.join(SRV, '..', 'client', 'src', 'config', 'staffPermissions.js'), 'utf8');
    assert.deepEqual([...client.matchAll(/key: '([a-z_]+)'/g)].map(m => m[1]), STAFF_PERMISSION_KEYS);
  });
});

describe('request scope for staff', () => {
  it('a counsellor only sees and touches counselling-type requests; admin is unchanged', () => {
    const staffReq = { user: STAFF }; const adminReq = { user: ADMIN };
    assert.deepEqual(staffRequestTypeFilter(staffReq, undefined), { $in: STAFF_REQUEST_TYPES });
    assert.deepEqual(staffRequestTypeFilter(staffReq, 'all'), { $in: STAFF_REQUEST_TYPES });
    assert.equal(staffRequestTypeFilter(staffReq, 'counselling'), 'counselling');
    assert.deepEqual(staffRequestTypeFilter(staffReq, 'website_request'), { $in: [] }, 'asking for a sales request returns nothing');
    assert.equal(staffRequestTypeFilter(adminReq, undefined), undefined);
    assert.equal(staffRequestTypeFilter(adminReq, 'website_request'), 'website_request');
    assert.equal(staffMayTouchRequestType(staffReq, 'mock_interview'), true);
    assert.equal(staffMayTouchRequestType(staffReq, 'website_request'), false);
    assert.equal(staffMayTouchRequestType(adminReq, 'website_request'), true);
  });
});

describe('staff management (Super Admin only)', () => {
  const call = async (fn, { body = {}, params = {} } = {}) => { const res = makeRes(); await fn({ user: ADMIN, body, params }, res); return res; };
  const person = (over) => ({ _id: 'u1', name: 'Priya', email: 'priya@example.com', role: { name: 'jobseeker' }, staff: { role: null, permissions: [] }, async save() { fakeDb.saves.push(this); }, ...over });
  beforeEach(() => { fakeDb.users = []; fakeDb.saves = []; });

  it('turns a job seeker into staff with the preset permissions, or an explicit list', async () => {
    fakeDb.users = [person()];
    let res = await call(staffController.addStaff, { body: { email: 'Priya@Example.com', staffRole: 'support' } });
    assert.equal(res.statusCode, 201);
    assert.equal(fakeDb.users[0].role, 'subadminRoleId');
    assert.deepEqual(fakeDb.users[0].staff.permissions, STAFF_ROLES.support.permissions);
    assert.equal(fakeDb.users[0].staff.grantedBy, 'a');
    fakeDb.users = [person({ email: 'k@example.com' })];
    res = await call(staffController.addStaff, { body: { email: 'k@example.com', staffRole: 'counsellor', permissions: ['requests_view'] } });
    assert.equal(res.statusCode, 201);
    assert.deepEqual(fakeDb.users[0].staff.permissions, ['requests_view']);
  });
  it('refuses unknown roles or permissions, missing accounts, and non-job-seeker accounts', async () => {
    fakeDb.users = [person(), person({ _id: 'u2', email: 'co@example.com', role: { name: 'company' } }), person({ _id: 'u3', email: 'st@example.com', role: { name: 'subadmin' } })];
    assert.equal((await call(staffController.addStaff, { body: { email: 'priya@example.com', staffRole: 'boss' } })).statusCode, 400);
    assert.equal((await call(staffController.addStaff, { body: { email: 'priya@example.com', staffRole: 'support', permissions: ['delete_users'] } })).statusCode, 400);
    assert.equal((await call(staffController.addStaff, { body: { email: 'nobody@example.com', staffRole: 'support' } })).statusCode, 404);
    assert.equal((await call(staffController.addStaff, { body: { email: 'co@example.com', staffRole: 'support' } })).statusCode, 400);
    assert.equal((await call(staffController.addStaff, { body: { email: 'st@example.com', staffRole: 'support' } })).statusCode, 400);
    assert.equal(fakeDb.saves.length, 0);
  });
  it('updates permissions, resets to the preset when the role changes, and removes staff back to job seeker', async () => {
    fakeDb.users = [person({ role: { name: 'subadmin' }, staff: { role: 'support', permissions: ['tickets_view'] } })];
    let res = await call(staffController.updateStaff, { params: { id: 'u1' }, body: { permissions: ['tickets_view', 'users_view'] } });
    assert.equal(res.statusCode, 200); assert.deepEqual(fakeDb.users[0].staff.permissions, ['tickets_view', 'users_view']);
    res = await call(staffController.updateStaff, { params: { id: 'u1' }, body: { staffRole: 'college_verifier' } });
    assert.deepEqual(fakeDb.users[0].staff.permissions, STAFF_ROLES.college_verifier.permissions);
    assert.equal((await call(staffController.updateStaff, { params: { id: 'u1' }, body: { permissions: ['nope'] } })).statusCode, 400);
    res = await call(staffController.removeStaff, { params: { id: 'u1' } });
    assert.equal(res.statusCode, 200); assert.equal(fakeDb.users[0].role, 'jobseekerRoleId'); assert.deepEqual(fakeDb.users[0].staff.permissions, []);
    fakeDb.users = [person()];
    assert.equal((await call(staffController.removeStaff, { params: { id: 'u1' } })).statusCode, 404, 'a non-staff account cannot be "removed"');
  });
});
