const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const path = require('path');

const inert = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : inert()), apply: () => inert(), construct: () => inert() });
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  try { return realLoad.call(this, request, ...rest); }
  catch (err) { if (err.code === 'MODULE_NOT_FOUND' && !request.startsWith('.')) return inert(); throw err; }
};
const stubAt = (rel, exports) => { const f = require.resolve(path.join(__dirname, '..', rel)); require.cache[f] = { id: f, filename: f, loaded: true, exports }; };

const { pickCollegesToAsk, keyFor } = require('../utils/collegeReminder');

const DAY = 86400000;
const now = new Date('2026-11-12T10:00:00Z');
const college = (extra = {}) => ({ _id: 'c1', verificationStatus: 'pending', isTest: false, createdAt: new Date(now - 3 * DAY), infoRequests: [], tpoUser: { email: 'tpo@college.edu.in' }, ...extra });

test('a pending college older than 2 days with an email is asked once', () => {
  assert.equal(pickCollegesToAsk([college()], new Set(), now).length, 1);
});

test('not asked: too new, test, already verified, already asked, already mailed, or no email', () => {
  assert.equal(pickCollegesToAsk([college({ createdAt: new Date(now - 1 * DAY) })], new Set(), now).length, 0);
  assert.equal(pickCollegesToAsk([college({ isTest: true })], new Set(), now).length, 0);
  assert.equal(pickCollegesToAsk([college({ verificationStatus: 'verified' })], new Set(), now).length, 0);
  assert.equal(pickCollegesToAsk([college({ verificationStatus: 'rejected' })], new Set(), now).length, 0);
  assert.equal(pickCollegesToAsk([college({ infoRequests: [{ message: 'x' }] })], new Set(), now).length, 0);
  assert.equal(pickCollegesToAsk([college()], new Set([keyFor(college())]), now).length, 0);
  assert.equal(pickCollegesToAsk([college({ tpoUser: null })], new Set(), now).length, 0);
  assert.equal(pickCollegesToAsk([null, undefined], new Set(), now).length, 0);
  assert.equal(pickCollegesToAsk(undefined, new Set(), now).length, 0);
});

test('a college with only the college email or principal email can still be asked', () => {
  assert.equal(pickCollegesToAsk([college({ tpoUser: null, collegeEmail: 'office@x.edu' })], new Set(), now).length, 1);
  assert.equal(pickCollegesToAsk([college({ tpoUser: null, principalEmail: 'p@x.edu' })], new Set(), now).length, 1);
});

// ── ticket acknowledgement ──
const notices = [];
stubAt('models/Ticket', { create: async (d) => ({ _id: 'abcdef0123456789abcdef01', ...d }) });
stubAt('models/User', {});
stubAt('utils/inAppNotifications', { notifyUser: async (n) => { notices.push(n); }, notifyRoles: async () => {} });
const { createTicket } = require('../controllers/ticketController');

test('raising a ticket sends the person an acknowledgement with a short reference', async () => {
  notices.length = 0;
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await createTicket({ user: { id: 'u1' }, body: { category: 'billing', severity: 'major' }, io: null }, res);
  assert.equal(res.code, 201);
  const ack = notices.find((n) => n.type === 'ticket_received');
  assert.ok(ack);
  assert.equal(ack.recipientId, 'u1');
  assert.match(ack.message, /#[0-9A-F]{6}/);
  assert.match(ack.message, /24 hours/);
});
