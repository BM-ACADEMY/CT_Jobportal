const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');

const created = [];
const real = Module._load;
Module._load = function (request, ...rest) {
  if (request === '../models/OtpEvent') return { create: async (d) => { created.push(d); return d; } };
  return real.call(this, request, ...rest);
};
const ev = require('../utils/otpEvents');

test('summarize counts today and the last 7 days and the mail speed', () => {
  const now = new Date('2026-11-14T12:00:00+05:30');
  const e = (type, at, ms) => ({ type, at: new Date(at), ms });
  const s = ev.summarize([
    e('sent', '2026-11-14T09:00:00+05:30', 800), e('sent', '2026-11-14T10:00:00+05:30', 9000),
    e('wrong', '2026-11-14T10:05:00+05:30'), e('send_failed', '2026-11-13T10:00:00+05:30'),
    e('sent', '2026-11-01T10:00:00+05:30', 100), e('bogus', '2026-11-14T10:00:00+05:30'),
  ], now);
  assert.equal(s.today.sent, 2); assert.equal(s.today.wrong, 1); assert.equal(s.today.send_failed, 0);
  assert.equal(s.week.send_failed, 1); assert.equal(s.week.sent, 2);
  assert.equal(s.mailSpeed.slowCount, 1);
});

test('sendTracked records sent or send_failed with the time taken and returns the result', async () => {
  created.length = 0;
  assert.equal(await ev.sendTracked(async () => true, 'login', { _id: 'u1' }, {}), true);
  assert.equal(await ev.sendTracked(async () => false, 'resend', { _id: 'u2' }, {}), false);
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(created.map((c) => [c.type, c.purpose, c.user]), [['sent', 'login', 'u1'], ['send_failed', 'resend', 'u2']]);
  assert.ok(created.every((c) => typeof c.ms === 'number'));
});

test('recording never throws even if the database write fails', () => {
  assert.doesNotThrow(() => ev.record('wrong', '', null));
});

test('code checks and sends are wired into the auth controller, and the admin route and card exist', () => {
  const a = fs.readFileSync(path.join(__dirname, '..', 'controllers', 'authController.js'), 'utf8');
  for (const t of ["'wrong'", "'expired'", "'locked'", "'verified'"]) assert.ok(a.includes(`record(${t}`), t);
  for (const p of ['register', 'login', 'reset', 'resend']) assert.ok(a.includes(`sendTracked(sendEmail, '${p}'`), p);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'routes', 'adminRoutes.js'), 'utf8'), /\/otp-stats/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'src', 'pages', 'admin', 'Activity.jsx'), 'utf8'), /data-testid="otp-card"/);
});
