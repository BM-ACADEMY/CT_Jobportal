const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const stubAt = (rel, exports) => {
  const file = require.resolve(path.join(__dirname, '..', rel));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};

// ── controller stubs ──
let lastIn = null;
const created = []; const updates = [];
stubAt('models/WhatsAppMessage', {
  findOne: () => ({ sort: () => ({ lean: async () => lastIn }) }),
  create: async (d) => { created.push(d); return d; },
  updateMany: async (q, u) => { updates.push({ q, u }); return {}; },
});
let sendResult = { ok: true };
const sent = [];
stubAt('utils/whatsapp', { sendWhatsAppText: async (m) => { sent.push(m); return sendResult; } });

const { extractInbound, windowOpen, windowClosesAt, cleanReply, recordInbound, ACK_TEXT, last10 } = require('../utils/whatsappInbox');
const { groupThreads, replyToThread } = require('../controllers/whatsappInboxController');
const { buildNeedsAction } = require('../utils/needsAction');

const run = async (fn, req) => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await fn({ user: { name: 'Kamar' }, params: {}, body: {}, ...req }, res);
  return res;
};
const payload = (messages, contacts = []) => ({ entry: [{ changes: [{ value: { contacts, messages } }] }] });

test('reads a text message, the profile name and the time', () => {
  const out = extractInbound(payload([{ id: 'w1', from: '919876543210', type: 'text', timestamp: '1700000000', text: { body: 'So what shud i do now?' } }], [{ wa_id: '919876543210', profile: { name: 'Kamarudeen' } }]));
  assert.equal(out.length, 1);
  assert.equal(out[0].phone, '9876543210');
  assert.equal(out[0].name, 'Kamarudeen');
  assert.equal(out[0].body, 'So what shud i do now?');
  assert.equal(out[0].receivedAt.getTime(), 1700000000000);
});

test('a photo or voice note is kept as a labelled placeholder; junk and short numbers are skipped', () => {
  const out = extractInbound(payload([{ id: 'w2', from: '919876543210', type: 'image', image: {} }, { id: 'w3', from: '123', type: 'text', text: { body: 'x' } }, null].filter(Boolean)));
  assert.equal(out.length, 1);
  assert.equal(out[0].body, '[image]');
  assert.deepEqual(extractInbound(null), []);
  assert.deepEqual(extractInbound({}), []);
});

test('the 24 hour window opens and closes on time', () => {
  const t = new Date('2026-11-09T14:48:00Z');
  assert.equal(windowOpen(t, new Date('2026-11-10T14:47:00Z')), true);
  assert.equal(windowOpen(t, new Date('2026-11-10T14:49:00Z')), false);
  assert.equal(windowOpen(null), false);
  assert.equal(windowClosesAt(t).toISOString(), '2026-11-10T14:48:00.000Z');
});

test('replies are trimmed and capped', () => {
  assert.equal(cleanReply('  hi there  '), 'hi there');
  assert.equal(cleanReply('x'.repeat(2000)).length, 1000);
  assert.equal(cleanReply(null), '');
  assert.equal(last10('+91 98765-43210'), '9876543210');
});

// ── recordInbound with fakes ──
const fakeModel = () => {
  const docs = [];
  return {
    docs,
    findOne: (q) => ({ select: () => ({ lean: async () => docs.find((d) => (q.wamid ? d.wamid === q.wamid : d.phone === q.phone && d.autoAcked && d.receivedAt >= q.receivedAt.$gte)) || null }) }),
    create: async (d) => { const doc = { _id: `id${docs.length}`, ...d }; docs.push(doc); return doc; },
    updateOne: async (q, u) => { const d = docs.find((x) => x._id === q._id); Object.assign(d, u.$set); },
  };
};
const msg = (extra = {}) => ({ wamid: 'w1', phone: '9876543210', fullPhone: '919876543210', name: 'K', kind: 'text', body: 'hello', receivedAt: new Date(), ...extra });

test('a new message is saved, acknowledged once and the admins are told', async () => {
  const Msg = fakeModel(); const texts = []; const alerts = [];
  await recordInbound([msg()], { WhatsAppMessage: Msg, sendText: async (t) => { texts.push(t); return { ok: true }; }, notifyAdmins: async (n) => { alerts.push(n); } });
  assert.equal(Msg.docs.length, 1);
  assert.equal(Msg.docs[0].status, 'new');
  assert.equal(Msg.docs[0].autoAcked, true);
  assert.equal(texts.length, 1);
  assert.equal(texts[0].text, ACK_TEXT);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].link, '/admin/whatsapp');
});

test('a repeat delivery from Meta is ignored', async () => {
  const Msg = fakeModel(); const texts = [];
  const deps = { WhatsAppMessage: Msg, sendText: async (t) => { texts.push(t); return { ok: true }; }, notifyAdmins: async () => {} };
  await recordInbound([msg()], deps);
  await recordInbound([msg()], deps);
  assert.equal(Msg.docs.length, 1);
  assert.equal(texts.length, 1);
});

test('a second message from the same person inside 24 hours is saved but not acknowledged again', async () => {
  const Msg = fakeModel(); const texts = [];
  const deps = { WhatsAppMessage: Msg, sendText: async (t) => { texts.push(t); return { ok: true }; }, notifyAdmins: async () => {} };
  await recordInbound([msg({ wamid: 'a' })], deps);
  await recordInbound([msg({ wamid: 'b', body: 'also this' })], deps);
  assert.equal(Msg.docs.length, 2);
  assert.equal(texts.length, 1);
});

test('if the automatic reply fails the message is still saved and the admins still hear', async () => {
  const Msg = fakeModel(); const alerts = [];
  await recordInbound([msg()], { WhatsAppMessage: Msg, sendText: async () => ({ ok: false }), notifyAdmins: async (n) => { alerts.push(n); } });
  assert.equal(Msg.docs.length, 1);
  assert.equal(Msg.docs[0].autoAcked, false);
  assert.equal(alerts.length, 1);
});

test('a failing admin alert does not lose the message', async () => {
  const Msg = fakeModel();
  await recordInbound([msg()], { WhatsAppMessage: Msg, sendText: async () => ({ ok: true }), notifyAdmins: () => Promise.reject(new Error('x')) });
  assert.equal(Msg.docs.length, 1);
});

// ── threads ──
test('threads group by person, show new ones first, and know whether a reply is still allowed', () => {
  const now = new Date('2026-11-09T21:00:00Z');
  const rows = [
    { _id: '1', phone: '9111111111', direction: 'in', body: 'old', receivedAt: new Date('2026-11-07T10:00:00Z'), status: 'done' },
    { _id: '2', phone: '9222222222', direction: 'in', body: 'hi', name: 'Asha', receivedAt: new Date('2026-11-09T20:00:00Z'), status: 'new' },
    { _id: '3', phone: '9222222222', direction: 'out', body: 'ack', receivedAt: new Date('2026-11-09T20:01:00Z'), status: 'done', sentBy: 'Kamar' },
  ];
  const t = groupThreads(rows, now);
  assert.equal(t[0].phone, '9222222222');
  assert.equal(t[0].newCount, 1);
  assert.equal(t[0].canReply, true);
  assert.equal(t[0].name, 'Asha');
  assert.equal(t[0].messages.length, 2);
  assert.equal(t[1].canReply, false);
});

// ── reply ──
test('a reply inside the window is sent, saved, and clears the new marker', async () => {
  sent.length = 0; created.length = 0; updates.length = 0; sendResult = { ok: true };
  lastIn = { phone: '9876543210', fullPhone: '919876543210', receivedAt: new Date(Date.now() - 3600000), matched: { kind: 'college', name: 'Christ' } };
  const res = await run(replyToThread, { body: { phone: '9876543210', text: 'No documents needed.' } });
  assert.equal(res.code, 200);
  assert.equal(sent[0].text, 'No documents needed.');
  assert.equal(created[0].direction, 'out');
  assert.equal(created[0].sentBy, 'Kamar');
  assert.equal(updates.length, 1);
});

test('a reply after 24 hours is refused and nothing is sent', async () => {
  sent.length = 0; created.length = 0;
  lastIn = { phone: '9876543210', receivedAt: new Date(Date.now() - 25 * 3600000) };
  const res = await run(replyToThread, { body: { phone: '9876543210', text: 'Hello again' } });
  assert.equal(res.code, 409);
  assert.equal(res.body.code, 'WINDOW_CLOSED');
  assert.equal(sent.length, 0);
  assert.equal(created.length, 0);
});

test('bad input, an unknown number and a failed send are all refused without saving', async () => {
  created.length = 0;
  assert.equal((await run(replyToThread, { body: { phone: '12', text: 'hello there' } })).code, 400);
  assert.equal((await run(replyToThread, { body: { phone: '9876543210', text: ' ' } })).code, 400);
  lastIn = null;
  assert.equal((await run(replyToThread, { body: { phone: '9876543210', text: 'hello there' } })).code, 404);
  lastIn = { phone: '9876543210', receivedAt: new Date() };
  sendResult = { ok: false, error: 'x' };
  assert.equal((await run(replyToThread, { body: { phone: '9876543210', text: 'hello there' } })).code, 502);
  sendResult = { skipped: true, reason: 'not_configured' };
  assert.match((await run(replyToThread, { body: { phone: '9876543210', text: 'hello there' } })).body.msg, /not set up/);
  assert.equal(created.length, 0);
});

// ── needs action ──
test('unanswered WhatsApp messages show up in Needs action with their age', () => {
  const now = new Date('2026-11-12T10:00:00Z');
  const { items, summary } = buildNeedsAction({ whatsapp: [{ _id: '9222222222', phone: '9222222222', name: 'Asha', body: 'So what shud i do now?', createdAt: new Date('2026-11-09T10:00:00Z') }] }, [], now);
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, 'whatsapp');
  assert.equal(items[0].link, '/admin/whatsapp');
  assert.equal(items[0].level, 'overdue');
  assert.equal(summary.total, 1);
});
