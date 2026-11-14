const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanHelpInput, cleanPageUrl } = require('../utils/helpRequest');
const { createHelpRequest } = require('../controllers/helpRequestController');
const { alertRequestOwner } = require('../utils/requestOwnerAlert');

const res = () => { const r = { code: 200 }; r.status = (c) => { r.code = c; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };

test('input: short messages are refused, page url keeps the path only', () => {
  assert.ok(cleanHelpInput({ message: 'hi' }).error);
  assert.equal(cleanPageUrl('https://velaivaaipu.in/candidate/jobs?token=abc#x'), '/candidate/jobs');
  assert.equal(cleanPageUrl('javascript:alert(1)'), '');
  assert.equal(cleanHelpInput({ message: '  I cannot upload my resume  ', pageUrl: '/candidate/settings?x=1' }).pageUrl, '/candidate/settings');
});

const deps = (over = {}) => {
  const created = [];
  return {
    created,
    AdminRequest: { countDocuments: async () => over.recent || 0, create: async (d) => { created.push(d); return { _id: 'r1', ...d }; } },
    User: { findById: () => ({ select: () => ({ lean: async () => (over.noUser ? null : { _id: 'u1', name: 'Asha', email: 'a@b.in', phone: '99' }) }) }) },
    alert: async () => ({ alerted: 'admin' })
  };
};

test('creates a help_request with the page and message', async () => {
  const d = deps(); const r = res();
  await createHelpRequest({ user: { id: 'u1' }, body: { message: 'Payment page is stuck', pageUrl: '/plans' } }, r, d);
  assert.equal(r.code, 201);
  assert.equal(d.created[0].type, 'help_request');
  assert.equal(d.created[0].pageUrl, '/plans');
  assert.equal(d.created[0].notes, 'Payment page is stuck');
});

test('refuses bad input, unknown accounts and floods', async () => {
  let r = res(); await createHelpRequest({ user: { id: 'u1' }, body: { message: '' } }, r, deps()); assert.equal(r.code, 400);
  r = res(); await createHelpRequest({ user: { id: 'x' }, body: { message: 'help me please' } }, r, deps({ noUser: true })); assert.equal(r.code, 403);
  const d = deps({ recent: 5 }); r = res(); await createHelpRequest({ user: { id: 'u1' }, body: { message: 'help me please' } }, r, d); assert.equal(r.code, 429); assert.equal(d.created.length, 0);
});

test('owner alert: assigned owner, rule owner, else Super Admin; never throws', async () => {
  const sent = [];
  const notify = { notifyUser: async (n) => sent.push(['user', n.recipientId]), notifyRoles: async (n) => sent.push(['roles', n.roles]) };
  const assigned = [];
  const mk = (assignment, rule) => ({ AdminAssignment: { findOne: () => ({ lean: async () => assignment }), updateOne: async (...a) => { assigned.push(a); } }, AdminRoutingRule: { findOne: () => ({ lean: async () => rule }) }, notify });
  assert.equal((await alertRequestOwner({ _id: 'r1' }, { deps: mk({ ownerId: 'o1' }, null) })).alerted, 'owner');
  assert.equal((await alertRequestOwner({ _id: 'r1' }, { deps: mk(null, { ownerId: 'o2', ownerName: 'Meena' }) })).alerted, 'owner');
  assert.equal(assigned.length, 1);
  assert.equal((await alertRequestOwner({ _id: 'r1' }, { deps: mk(null, null) })).alerted, 'admin');
  assert.deepEqual(sent.map((s) => s[1]), ['o1', 'o2', ['admin']]);
  assert.equal((await alertRequestOwner({ _id: 'r1' }, { deps: { AdminAssignment: null, AdminRoutingRule: null, notify } })).alerted, null);
});
