const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const express = require('express');
const http = require('node:http');

process.env.JWT_SECRET = 'x'.repeat(40);
process.env.WA_APP_SECRET = 'app-secret';
process.env.WA_VERIFY_TOKEN = 'verify-me';

// Stub the student model so no database is needed.
const calls = [];
const modelPath = require.resolve('../../models/CollegeStudent');
require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: { updateMany: async (q, u) => { calls.push({ q, u }); return {}; } } };

const router = require('../../routes/whatsapp');
const { captureWebhookRawBody } = require('../../utils/webhookRawBody');

// Same parser setup as index.js: one global express.json with the raw-body hook.
const app = express();
app.use(express.json({ verify: captureWebhookRawBody }));
app.use('/api/whatsapp', router);

const send = (path, { method = 'GET', body, headers = {} } = {}) => new Promise((resolve, reject) => {
  const server = app.listen(0, () => {
    const req = http.request({ port: server.address().port, path, method, headers: { 'Content-Type': 'application/json', ...headers } }, (res) => {
      let data = ''; res.on('data', (c) => (data += c)); res.on('end', () => { server.close(); resolve({ status: res.statusCode, body: data }); });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
});

const stopPayload = (text, from = '919876543210') => JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ from, text: { body: text } }] } }] }] });
const sign = (raw) => `sha256=${crypto.createHmac('sha256', process.env.WA_APP_SECRET).update(raw).digest('hex')}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('GET verification handshake works with the right token only', async () => {
  const ok = await send('/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=abc');
  assert.equal(ok.status, 200); assert.equal(ok.body, 'abc');
  const bad = await send('/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=abc');
  assert.equal(bad.status, 403);
});

test('an unset verify token never validates', async () => {
  delete process.env.WA_VERIFY_TOKEN;
  const res = await send('/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=abc');
  assert.equal(res.status, 403);
  process.env.WA_VERIFY_TOKEN = 'verify-me';
});

test('a correctly signed STOP reply opts the number out', async () => {
  calls.length = 0;
  const raw = stopPayload('STOP.');
  const res = await send('/api/whatsapp/webhook', { method: 'POST', body: raw, headers: { 'X-Hub-Signature-256': sign(raw) } });
  assert.equal(res.status, 200);
  await wait(50);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].u, { $set: { whatsappOptOut: true } });
  assert.ok(calls[0].q.whatsappNumber.test('9876543210'));
  assert.ok(calls[0].q.whatsappNumber.test('919876543210'));
});

test('unsigned or wrongly signed requests are ignored', async () => {
  calls.length = 0;
  const raw = stopPayload('stop');
  await send('/api/whatsapp/webhook', { method: 'POST', body: raw });
  await send('/api/whatsapp/webhook', { method: 'POST', body: raw, headers: { 'X-Hub-Signature-256': 'sha256=deadbeef' } });
  await wait(50);
  assert.equal(calls.length, 0);
});

test('ordinary replies do not opt anyone out', async () => {
  calls.length = 0;
  const raw = stopPayload('please do not stop sending jobs');
  await send('/api/whatsapp/webhook', { method: 'POST', body: raw, headers: { 'X-Hub-Signature-256': sign(raw) } });
  await wait(50);
  assert.equal(calls.length, 0);
});

test('isStopMessage ignores case and punctuation', () => {
  for (const t of ['STOP', 'Stop!', ' stop ', 'Opt out', 'unsubscribe.']) assert.equal(router.isStopMessage(t), true, t);
  for (const t of ['', 'stopping', 'hello', undefined]) assert.equal(router.isStopMessage(t), false, String(t));
});
