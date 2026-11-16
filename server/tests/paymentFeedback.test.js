const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const Module = require('node:module');
const realLoad = Module._load;
Module._load = function (req, ...a) { return req === 'jsonwebtoken' ? { sign: (p) => 'tok.' + Buffer.from(JSON.stringify(p)).toString('base64url'), verify: (t) => JSON.parse(Buffer.from(String(t).split('.')[1] || '', 'base64url').toString()) } : req === 'nodemailer' ? { createTransport: () => ({}) } : realLoad.call(this, req, ...a); };
process.env.JWT_SECRET = 'test-only-'.repeat(5);
process.env.FRONTEND_URL = 'https://velaivaaipu.in';
process.env.API_PUBLIC_URL = 'https://api.velaivaaipu.in';
const f = require('../utils/paymentFeedback');
const mails = require('../utils/lifecycle/mails');
const policy = require('../utils/lifecycle/emailPolicy');
const read = (p) => fs.readFileSync(require.resolve(p), 'utf8');

test('one tap gives a score and the summary lists the weakest item first', () => {
  assert.deepStrictEqual([f.MET_RATING.yes, f.MET_RATING.partly, f.MET_RATING.no], [5, 3, 1]);
  const s = f.summarise([
    { item: 'Premium', rating: 5, met: 'yes' }, { item: 'Premium', rating: 4, met: 'yes' },
    { item: 'Job Alerts', rating: 1, met: 'no' }, { item: 'Job Alerts', rating: 3, met: 'partly' },
  ]);
  assert.strictEqual(s.total, 4);
  assert.strictEqual(s.items[0].item, 'Job Alerts');
  assert.strictEqual(s.metPercent, 50);
  assert.strictEqual(s.notMet, 1);
  assert.strictEqual(f.summarise([]).average, null);
});
test('feedback link is bound to the payment and rejects other tokens', () => {
  const t = f.signFeedbackToken('u1', 'p1');
  const ok = f.verifyFeedbackToken(t);
  assert.strictEqual(ok.pid, 'p1');
  assert.strictEqual(f.verifyFeedbackToken('garbage'), null);
  const other = 'x.' + Buffer.from(JSON.stringify({ uid: 'u1', pid: 'p1', purpose: 'email-prefs' })).toString('base64url');
  assert.strictEqual(f.verifyFeedbackToken(other), null);
});
test('the ask mail has three answers, no fake urgency and an unsubscribe link', () => {
  const u = { _id: '507f1f77bcf86cd799439011', name: 'Asha M' };
  const m = mails.wrap(mails.paymentFeedbackAsk(u, { itemName: 'Premium', token: 'T' }), u._id);
  assert.match(m.html, /met=yes/); assert.match(m.html, /met=partly/); assert.match(m.html, /met=no/);
  assert.match(m.html, /unsubscribe/i);
  assert.ok(!/(hurry|last chance|act now)/i.test(m.html));
});
test('feedback mails are not held back by the weekly cap', () => {
  assert.ok(policy.isTransactional('paid_feedback-abc'));
});
test('cron: asks once per payment, 7 days after, skips answered', () => {
  const src = read('../cron/lifecycleMails.js');
  assert.match(src, /paid_feedback-\$\{p\._id\}/);
  assert.match(src, /Feedback\.exists\(\{ payment: p\._id \}\)/);
  assert.match(src, /status: 'completed'/);
  assert.ok(f.ASK_AFTER_DAYS === 7);
});
test('public form is token bound and rate limited; admin list is admin only and no money touched', () => {
  const pub = read('../routes/publicRoutes.js');
  assert.match(pub, /verifyFeedbackToken/);
  assert.match(pub, /router\.post\('\/payment-feedback'[\s\S]{0,200}rateLimit/);
  assert.match(read('../routes/feedbackRoutes.js'), /router\.get\('\/admin', verifyToken, authorizeRoles\('admin'\)/);
  const code = (read('../utils/paymentFeedback.js') + read('../controllers/feedbackController.js')).replace(/\/\/.*$/gm, '');
  assert.ok(!/razorpay|\.price|gst/i.test(code));
});
test('model: one feedback per payment', () => {
  const m = read('../models/Feedback.js');
  assert.match(m, /payment: 1 \}, \{ unique: true/);
  assert.match(m, /source: \{ type: String, enum: \['page', 'payment'\]/);
});
