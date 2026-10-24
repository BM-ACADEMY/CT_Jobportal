const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('node:http');

process.env.BREVO_WEBHOOK_SECRET = 'test-secret-value';
const calls = [];
const modelPath = require.resolve('../../models/User');
require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: { updateMany: async (q, u) => { calls.push({ q, u }); return {}; } } };
const router = require('../../routes/emailWebhook');

const app = express();
app.use(express.json());
app.use('/api/webhooks/email', router);

const post = (path, payload) => new Promise((resolve, reject) => {
  const server = app.listen(0, () => {
    const req = http.request({ port: server.address().port, path, method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
      res.resume(); res.on('end', () => { server.close(); resolve(res.statusCode); });
    });
    req.on('error', reject);
    req.end(JSON.stringify(payload));
  });
});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const OK = '/api/webhooks/email/brevo?secret=test-secret-value';

test('wrong or missing secret is rejected and changes nothing', async () => {
  calls.length = 0;
  assert.equal(await post('/api/webhooks/email/brevo', { event: 'hard_bounce', email: 'a@b.com' }), 401);
  assert.equal(await post('/api/webhooks/email/brevo?secret=nope', { event: 'hard_bounce', email: 'a@b.com' }), 401);
  await wait(30);
  assert.equal(calls.length, 0);
});

test('an unset secret never authorises', async () => {
  const saved = process.env.BREVO_WEBHOOK_SECRET;
  delete process.env.BREVO_WEBHOOK_SECRET;
  assert.equal(await post('/api/webhooks/email/brevo', { event: 'hard_bounce', email: 'a@b.com' }), 401);
  process.env.BREVO_WEBHOOK_SECRET = saved;
});

test('hard bounce marks the address and switches off marketing mail', async () => {
  calls.length = 0;
  assert.equal(await post(OK, { event: 'hard_bounce', email: ' Student@Example.COM ' }), 200);
  await wait(30);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].q, { email: 'student@example.com' });
  assert.equal(calls[0].u.$set['emailPrefs.marketingOptOut'], true);
  assert.equal(calls[0].u.$set['emailPrefs.bounced'], true);
  assert.equal(calls[0].u.$set['emailPrefs.bounceReason'], 'hard_bounce');
});

test('spam complaint opts out but is not recorded as a bounce', async () => {
  calls.length = 0;
  await post(OK, { event: 'spam', email: 'x@y.com' });
  await wait(30);
  assert.equal(calls[0].u.$set['emailPrefs.marketingOptOut'], true);
  assert.equal(calls[0].u.$set['emailPrefs.bounced'], undefined);
  assert.equal(calls[0].u.$set['emailPrefs.bounceReason'], 'complaint');
});

test('soft bounces, deliveries and unknown events do nothing; batches are handled', async () => {
  calls.length = 0;
  await post(OK, [{ event: 'soft_bounce', email: 'a@b.com' }, { event: 'delivered', email: 'a@b.com' }, { event: 'hard_bounce', email: 'c@d.com' }, { event: 'unsubscribed', email: 'e@f.com' }, { event: 'hard_bounce' }]);
  await wait(30);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map((c) => c.q.email), ['c@d.com', 'e@f.com']);
});

test('updates only touch emailPrefs, so OTP and receipts are unaffected', () => {
  const keys = Object.keys(router.updateFor('hard_bounce'));
  assert.ok(keys.every((k) => k.startsWith('emailPrefs.')));
});
