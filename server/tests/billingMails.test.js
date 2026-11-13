const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');
const realLoad = Module._load;
Module._load = function (req, ...a) { return req === 'jsonwebtoken' ? { sign: () => 't', verify: () => ({}) } : req === 'nodemailer' ? { createTransport: () => ({}) } : realLoad.call(this, req, ...a); };
const { expiryStage, failedPaymentDue } = require('../utils/lifecycle/billing');
const mails = require('../utils/lifecycle/mails');

const NOW = Date.UTC(2026, 10, 9, 6);
const inDays = (d) => new Date(NOW + d * 86400000);

test('expiry stages', () => {
  assert.strictEqual(expiryStage(inDays(5), NOW).stage, 'd7');
  assert.strictEqual(expiryStage(inDays(1), NOW).stage, 'd1');
  assert.strictEqual(expiryStage(inDays(-1), NOW).stage, 'expired');
  assert.strictEqual(expiryStage(inDays(20), NOW), null);
  assert.strictEqual(expiryStage(inDays(-10), NOW), null);
  assert.strictEqual(expiryStage(null, NOW), null);
});
test('the key changes with the expiry date so a renewed plan is mailed again next time', () => {
  assert.notStrictEqual(expiryStage(inDays(5), NOW).key, expiryStage(inDays(6), NOW).key);
});
test('failed payment retry window', () => {
  const ago = (h) => new Date(NOW - h * 3600000);
  assert.ok(failedPaymentDue([{ status: 'failed', createdAt: ago(3) }], NOW));
  assert.strictEqual(failedPaymentDue([{ status: 'failed', createdAt: ago(0.2) }], NOW), null);
  assert.strictEqual(failedPaymentDue([{ status: 'failed', createdAt: ago(60) }], NOW), null);
  assert.strictEqual(failedPaymentDue([{ status: 'failed', createdAt: ago(5) }, { status: 'completed', createdAt: ago(2) }], NOW), null);
});
test('mails are honest and have one button', () => {
  process.env.FRONTEND_URL = 'https://velaivaaipu.in';
  const a = mails.planEnding({ name: 'Asha K' }, 'd1', 'Pro');
  const b = mails.paymentRetry({ name: 'Asha K' }, 'Pro');
  for (const m of [a, b]) assert.strictEqual((m.html.match(/<a /g) || []).length, 1);
  assert.match(a.html, /ends tomorrow/);
  assert.match(b.html, /did not complete/);
});
