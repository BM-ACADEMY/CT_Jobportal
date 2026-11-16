const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');

let db = [];
let mails = [];
let mailOk = true;
let seq = 0;
const hexId = () => String(++seq).padStart(24, '0');
const mk = (o) => ({ async save() {}, ...o });
const Admin = {
  findOne: async (q) => db.find((a) => a.email === q.email) || null,
  findById: (id) => { const a = db.find((x) => String(x._id) === String(id)) || null; const p = Promise.resolve(a); p.select = () => Promise.resolve(a); return p; },
  create: async (d) => { const a = mk({ _id: hexId(), admin_id: 'ADM-' + seq, createdAt: new Date(), ...d }); db.push(a); return a; },
  countDocuments: async () => db.length,
  deleteOne: async ({ _id }) => { db = db.filter((a) => a._id !== _id); },
  find: () => ({ select: () => ({ sort: () => ({ lean: async () => db }) }) }),
};
const real = Module._load;
Module._load = function (request, ...rest) {
  if (request === '../models/Admin') return Admin;
  if (request === '../utils/sendEmail') return async (m) => { mails.push(m); return mailOk; };
  if (request === 'bcryptjs') return { hash: async (v) => 'h:' + v };
  return real.call(this, request, ...rest);
};
const c = require('../controllers/adminInviteController');
Module._load = real;

const res = () => { const r = { code: 200 }; r.status = (n) => { r.code = n; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const run = async (fn, req) => { const r = res(); await fn(req, r); return r; };
const reset = () => { db = []; mails = []; mailOk = true; };
const tokenFrom = (m) => (m.html.match(/token=([a-f0-9]{64})/) || [])[1];
const idFrom = (m) => (m.html.match(/id=([a-f0-9]{24})/) || [])[1];

test('inviting creates an admin with a random password, 2-step on, and mails a one-time link', async () => {
  reset();
  const r = await run(c.inviteAdmin, { body: { name: 'Asha', email: ' Asha@Example.com ' }, user: { id: 'x' } });
  assert.equal(r.code, 201); assert.equal(r.body.mailed, true);
  const a = db[0];
  assert.equal(a.email, 'asha@example.com'); assert.equal(a.role, 'admin'); assert.equal(a.twoFactorAuth.enabled, true);
  assert.match(a.password, /^h:[a-f0-9]{64}$/);
  assert.equal(mails.length, 1); assert.equal(mails[0].email, 'asha@example.com');
  const token = tokenFrom(mails[0]);
  assert.ok(token); assert.ok(!JSON.stringify(a).includes(token), 'the token itself is never stored');
  assert.ok(a.invite.expiresAt > new Date());
});

test('bad names, bad emails and duplicate admins are refused', async () => {
  reset();
  assert.equal((await run(c.inviteAdmin, { body: { name: '', email: 'a@b.co' }, user: { id: 'x' } })).code, 400);
  assert.equal((await run(c.inviteAdmin, { body: { name: 'A', email: 'nope' }, user: { id: 'x' } })).code, 400);
  assert.equal((await run(c.inviteAdmin, { body: { name: 'A', email: { $ne: 1 } }, user: { id: 'x' } })).code, 400);
  await run(c.inviteAdmin, { body: { name: 'A', email: 'a@b.co' }, user: { id: 'x' } });
  assert.equal((await run(c.inviteAdmin, { body: { name: 'A', email: 'a@b.co' }, user: { id: 'x' } })).code, 400);
});

test('if the invite mail fails the admin is still added and can be re-invited', async () => {
  reset(); mailOk = false;
  const r = await run(c.inviteAdmin, { body: { name: 'A', email: 'a@b.co' }, user: { id: 'x' } });
  assert.equal(r.code, 201); assert.equal(r.body.mailed, false);
  mailOk = true;
  const r2 = await run(c.resendInvite, { params: { id: db[0]._id }, user: { id: 'x' } });
  assert.equal(r2.body.mailed, true);
  assert.equal(mails.length, 2);
});

test('the link sets the password once, rejects a wrong or old token, and then stops working', async () => {
  reset();
  await run(c.inviteAdmin, { body: { name: 'A', email: 'a@b.co' }, user: { id: 'x' } });
  const id = idFrom(mails[0]); const token = tokenFrom(mails[0]);
  assert.equal((await run(c.setPassword, { body: { id, token: 'a'.repeat(64), password: 'Longpass123' } })).code, 400);
  assert.equal((await run(c.setPassword, { body: { id, token, password: 'short1' } })).code, 400);
  assert.equal((await run(c.setPassword, { body: { id, token, password: 'onlyletterspassword' } })).code, 400);
  const ok = await run(c.setPassword, { body: { id, token, password: 'Longpass123' } });
  assert.equal(ok.code, 200);
  assert.equal(db[0].password, 'h:Longpass123'); assert.equal(db[0].invite, undefined);
  assert.equal((await run(c.setPassword, { body: { id, token, password: 'Another12345' } })).code, 400);
});

test('an expired link is refused', async () => {
  reset();
  await run(c.inviteAdmin, { body: { name: 'A', email: 'a@b.co' }, user: { id: 'x' } });
  db[0].invite.expiresAt = new Date(Date.now() - 1000);
  assert.equal((await run(c.setPassword, { body: { id: idFrom(mails[0]), token: tokenFrom(mails[0]), password: 'Longpass123' } })).code, 400);
});

test('you cannot remove yourself or the last admin, but can remove another', async () => {
  reset();
  const me = await Admin.create({ email: 'me@x.co', name: 'Me' });
  assert.equal((await run(c.removeAdmin, { params: { id: me._id }, user: { id: me._id } })).code, 400);
  const other = await Admin.create({ email: 'o@x.co', name: 'O' });
  const r = await run(c.removeAdmin, { params: { id: other._id }, user: { id: me._id } });
  assert.equal(r.code, 200); assert.equal(db.length, 1);
  assert.equal((await run(c.removeAdmin, { params: { id: me._id }, user: { id: other._id } })).code, 400, 'last admin stays');
});

test('routes, pages and menu are wired; set-password is public and rate limited, the rest is behind the admin gate', () => {
  const read = (...p) => fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');
  const routes = read('server', 'routes', 'adminRoutes.js');
  const gate = routes.indexOf("router.use(authorizeRoles('admin'))");
  assert.ok(routes.indexOf("'/set-password'") > 0 && routes.indexOf("'/set-password'") < routes.indexOf('router.use(verifyToken)'));
  assert.match(routes, /'\/set-password', adminRateLimit/);
  for (const p of ["router.get('/admins'", "router.post('/admins'", "'/admins/:id/resend-invite'", "router.delete('/admins/:id'"]) assert.ok(routes.indexOf(p) > gate, p);
  assert.match(read('client', 'src', 'routes', 'AppRoutes.jsx'), /path="\/admin\/admins"[\s\S]*?roles=\{\['admin'\]\}/);
  assert.match(read('client', 'src', 'routes', 'AppRoutes.jsx'), /path="\/admin\/set-password"/);
  assert.match(read('client', 'src', 'components', 'common', 'Sidebar.jsx'), /label: 'Admins'/);
  assert.match(read('client', 'src', 'pages', 'admin', 'ManageAdmins.jsx'), /data-testid="admin-login-url"/);
});
