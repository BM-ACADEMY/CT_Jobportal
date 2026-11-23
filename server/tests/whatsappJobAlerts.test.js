const test = require('node:test');
const assert = require('node:assert/strict');
const { runWhatsAppJobAlerts, weekId, eligibleUserFilter } = require('../cron/whatsappJobAlerts');

const ENV_ON = { WHATSAPP_JOB_ALERTS_ENABLED: 'true', WA_TEMPLATE_JOB_ALERT: 'job_alert', FRONTEND_URL: 'https://velaivaaipu.in/' };
const mk = ({ users = [{ _id: 'u1', name: 'Asha Kumar', whatsapp: { number: '9876543210' } }], jobs = [{ title: 'Clerk' }, { title: 'Driver' }], logged = new Set(), sends = [], sendResult = { ok: true } } = {}) => ({
  env: ENV_ON,
  Role: { findOne: () => ({ select: () => ({ lean: async () => ({ _id: 'r1' }) }) }) },
  Job: { find: () => ({ populate: () => ({ sort: () => ({ limit: () => ({ lean: async () => jobs }) }) }) }) },
  User: { find: (f) => ({ limit: () => ({ lean: async () => { mk.filter = f; return users; } }) }) },
  Log: {
    create: async ({ user, period }) => { const k = `${user}|${period}`; if (logged.has(k)) { const e = new Error('dup'); e.code = 11000; throw e; } logged.add(k); },
    updateOne: async () => {},
  },
  send: async (m) => { sends.push(m); return sendResult; },
  rank: (u, js, n) => js.slice(0, n),
  sends, logged,
});

test('off by default and when the template or site address is missing', async () => {
  assert.deepEqual(await runWhatsAppJobAlerts({ deps: { env: {} } }), { skipped: 'off' });
  assert.deepEqual(await runWhatsAppJobAlerts({ deps: { env: { WHATSAPP_JOB_ALERTS_ENABLED: 'true' } } }), { skipped: 'off' });
});

test('sends one message with first name, count, titles and a tagged link', async () => {
  const d = mk();
  const r = await runWhatsAppJobAlerts({ now: new Date('2026-11-17T06:00:00Z'), deps: d });
  assert.equal(r.sent, 1);
  assert.equal(d.sends.length, 1);
  assert.equal(d.sends[0].template, 'job_alert');
  assert.deepEqual(d.sends[0].params, ['Asha', 2, 'Clerk, Driver', 'https://velaivaaipu.in/jobs?source=wa_alert']);
});

test('never sends twice in the same week', async () => {
  const d = mk();
  const now = new Date('2026-11-17T06:00:00Z');
  await runWhatsAppJobAlerts({ now, deps: d });
  const again = await runWhatsAppJobAlerts({ now: new Date('2026-11-20T06:00:00Z'), deps: d });
  assert.equal(again.sent, 0);
  assert.equal(d.sends.length, 1);
});

test('only opted-in, not opted-out people are asked for', () => {
  const f = eligibleUserFilter('r1');
  assert.equal(f['whatsapp.optIn'], true);
  assert.equal(f['whatsapp.optOutAt'], null);
  assert.deepEqual(f['whatsapp.number'], { $ne: '' });
  assert.deepEqual(f.isAdminBlocked, { $ne: true });
});

test('no matching jobs means no message; failed sends are not counted', async () => {
  const none = mk({ jobs: [] });
  assert.deepEqual(await runWhatsAppJobAlerts({ deps: none }), { sent: 0 });
  const fail = mk({ sendResult: { ok: false } });
  assert.equal((await runWhatsAppJobAlerts({ deps: fail })).sent, 0);
});

test('week id is stable inside a week', () => {
  assert.equal(weekId(new Date('2026-11-16T00:00:00Z')), weekId(new Date('2026-11-22T20:00:00Z')));
  assert.notEqual(weekId(new Date('2026-11-16T00:00:00Z')), weekId(new Date('2026-11-23T00:00:00Z')));
});
