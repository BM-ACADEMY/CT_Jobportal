'use strict';
// Sends real HTTP requests through the same body-parsing setup index.js uses and the real payment
// routes. This guards the bug where express.json() consumed the body before the webhook could see the
// exact bytes Razorpay signed, so every webhook was rejected as having an invalid signature.
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const h = require('../helpers/paymentHarness');

const express = require(path.join(h.SRV, 'node_modules/express'));
const { captureWebhookRawBody } = require(path.join(h.SRV, 'utils/webhookRawBody'));
const paymentRoutes = require(path.join(h.SRV, 'routes/paymentRoutes'));

describe('Razorpay webhook over HTTP', () => {
  let server;
  let port;

  before(async () => {
    const app = express();
    app.use(express.json({ verify: captureWebhookRawBody })); // as in index.js
    app.use((req, res, next) => { req.io = null; next(); });
    app.use('/api/payments', paymentRoutes);
    await new Promise(resolve => { server = app.listen(0, resolve); });
    port = server.address().port;
  });

  after(() => new Promise(resolve => server.close(resolve)));

  beforeEach(() => {
    h.reset();
    h.makeUser('u1');
  });

  const post = (body, headers = {}) => new Promise((resolve, reject) => {
    const req = http.request({
      port,
      path: '/api/payments/razorpay/renewal-webhook',
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body), ...headers }
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end(body);
  });

  // Whitespace and key order exactly as Razorpay might send them: the signature covers these bytes.
  const orderPaidBody = () => '{"event":"order.paid",  "payload":{"payment":{"entity":{"id":"pay_http","amount":118000}},'
    + '"order":{"entity":{"id":"order_http","amount":118000,"amount_paid":118000,'
    + '"notes":{"userId":"u1","planId":"planPro","quantity":"1","couponCode":""}}}}}';

  it('accepts a correctly signed webhook and grants the purchase', async () => {
    const body = orderPaidBody();
    const res = await post(body, { 'x-razorpay-signature': h.webhookHmac(body), 'x-razorpay-event-id': 'evt_http' });

    assert.equal(res.status, 200);
    assert.equal(h.db.users.u1.subscription, 'planPro');
    assert.equal(h.db.payments.length, 1);
  });

  it('rejects a wrong signature', async () => {
    const res = await post(orderPaidBody(), { 'x-razorpay-signature': 'f'.repeat(64) });
    assert.equal(res.status, 400);
    assert.equal(h.db.payments.length, 0);
  });

  it('rejects a body changed after signing', async () => {
    const body = orderPaidBody();
    const res = await post(body.replace('118000', '1'), { 'x-razorpay-signature': h.webhookHmac(body) });
    assert.equal(res.status, 400);
    assert.equal(h.db.payments.length, 0);
  });

  it('rejects a request with no signature', async () => {
    const res = await post(orderPaidBody());
    assert.equal(res.status, 400);
  });
});
