'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');

const { db } = h;

describe('Razorpay webhook — order.paid (customer paid but the browser never verified)', () => {
  beforeEach(() => {
    h.reset();
    h.makeUser('u1');
  });

  const proPaid = (paymentId = 'pay_a', orderId = 'order_a') =>
    h.orderPaidPayload(orderId, paymentId, h.orderNotes('u1', 'planPro'), 1180);

  it('grants the plan and sends the receipt', async () => {
    const res = await h.webhook('order.paid', proPaid());

    assert.equal(res.statusCode, 200);
    assert.equal(db.users.u1.subscription, 'planPro');
    assert.equal(db.payments.length, 1);
    assert.equal(db.payments[0].amount, 1180);
    assert.equal(db.emails.length, 1);
    assert.equal(db.adminNotes.length, 1);
  });

  it('grants nothing more when Razorpay redelivers the event, and still acknowledges it', async () => {
    await h.webhook('order.paid', proPaid());
    const redelivery = await h.webhook('order.paid', proPaid());

    assert.equal(redelivery.statusCode, 200, 'a non-2xx would make Razorpay keep retrying');
    assert.equal(db.payments.length, 1);
    assert.equal(db.saves, 1);
    assert.equal(db.emails.length, 1);
  });

  it('answers a late verify from the browser as already processed', async () => {
    await h.webhook('order.paid', proPaid());
    const body = h.paidOrder({ orderId: 'order_a', paymentId: 'pay_a', planId: 'planPro', userId: 'u1' });

    const res = await h.verifyPayment('u1', body);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.alreadyProcessed, true);
    assert.equal(db.payments.length, 1);
    assert.equal(db.saves, 1);
  });

  it('grants once when verify and the webhook arrive at the same moment', async () => {
    const body = h.paidOrder({ orderId: 'order_d', paymentId: 'pay_d', planId: 'planPro', userId: 'u1' });
    const [verify, hook] = await Promise.all([
      h.verifyPayment('u1', body),
      h.webhook('order.paid', proPaid('pay_d', 'order_d'))
    ]);

    assert.equal(verify.statusCode, 200);
    assert.equal(hook.statusCode, 200);
    assert.equal(db.payments.length, 1);
    assert.equal(db.saves, 1);
    assert.equal(db.emails.length, 1);
  });

  it('grants pay-per-feature credits once, even with redelivery and a late verify', async () => {
    const payload = h.orderPaidPayload('order_g', 'pay_g', h.featureNotes('u1', 'featBoost', 2), 236);
    await h.webhook('order.paid', payload);
    await h.webhook('order.paid', payload);
    const late = await h.payPerVerify('u1', h.paidFeatureOrder({ orderId: 'order_g', paymentId: 'pay_g', userId: 'u1', quantity: 2, amountRupees: 236 }));

    assert.equal(db.users.u1.purchasedFeatures.length, 1);
    assert.equal(db.users.u1.purchasedFeatures[0].usageLeft, 10);
    assert.equal(db.payments.length, 1);
    assert.equal(late.body.alreadyProcessed, true);
  });

  it('ignores orders that carry no checkout notes (older orders are left to the verify request)', async () => {
    const res = await h.webhook('order.paid', h.orderPaidPayload('order_e', 'pay_e', {}, 1180));
    assert.equal(res.statusCode, 200);
    assert.equal(db.payments.length, 0);
    assert.equal(db.users.u1.subscription, null);
  });

  it('ignores subscription invoice orders, which have no quantity note', async () => {
    const res = await h.webhook('order.paid', h.orderPaidPayload('order_f', 'pay_f', { userId: 'u1', planId: 'planCampus' }, 5900));
    assert.equal(res.statusCode, 200);
    assert.equal(db.payments.length, 0);
    assert.equal(db.users.u1.subscription, null);
  });

  it('does not grant a plan the user is not allowed to buy', async () => {
    h.makeUser('member', { isTeamManaged: true });
    await h.webhook('order.paid', h.orderPaidPayload('order_o', 'pay_o', h.orderNotes('member', 'planOrg'), 2360));
    assert.equal(db.payments.length, 0);
    assert.equal(db.users.member.subscription, null);
  });

  it('lets Razorpay retry when granting fails, and then succeeds', async () => {
    const workingSave = db.users.u1.save;
    db.users.u1.save = async () => { throw new Error('database down'); };
    const failed = await h.webhook('order.paid', proPaid());
    assert.equal(failed.statusCode, 500, 'a 500 makes Razorpay redeliver the event');
    assert.equal(db.payments.length, 0);

    db.users.u1.save = workingSave;
    const retried = await h.webhook('order.paid', proPaid());
    assert.equal(retried.statusCode, 200);
    assert.equal(db.users.u1.subscription, 'planPro');
    assert.equal(db.payments.length, 1);
  });
});

describe('Razorpay webhook — recurring subscriptions', () => {
  const notes = { userId: 'tpo1', planId: 'planCampus', couponCode: '' };
  const charged = (paidCount, paymentId, amountRupees = 5900) =>
    h.subscriptionChargedPayload({ paidCount, paymentId, amountRupees, notes });

  beforeEach(() => {
    h.reset();
    h.makeUser('tpo1');
    h.makeCollege('tpo1');
  });

  it('sets the college up from the first charge when the browser never verified', async () => {
    await h.webhook('subscription.charged', charged(1, 'pay_first'));

    assert.equal(db.collegeByTpo.tpo1.razorpaySubscriptionId, 'sub_1');
    assert.equal(db.users.tpo1.subscription, 'planCampus');
    assert.equal(db.payments.length, 1);
    assert.equal(db.payments[0].isRenewal, false);
  });

  it('does not treat a redelivered first-charge event as a renewal', async () => {
    await h.webhook('subscription.charged', charged(1, 'pay_first'));
    const redelivery = await h.webhook('subscription.charged', charged(1, 'pay_first'));

    assert.equal(redelivery.statusCode, 200);
    assert.equal(db.payments.length, 1);
    assert.equal(db.renewalLogs.length, 0);
    assert.equal(db.emails.length, 0, 'no "renewed successfully" email straight after a purchase');
  });

  it('does not grant a plan for a later charge of a subscription it does not know', async () => {
    await h.webhook('subscription.charged', charged(4, 'pay_x'));
    assert.equal(db.payments.length, 0);
    assert.equal(db.users.tpo1.subscription, null);
  });

  describe('renewals', () => {
    beforeEach(async () => {
      await h.webhook('subscription.charged', charged(1, 'pay_first'));
      db.emails.length = 0;
    });

    it('are recorded in the payer\'s payment history', async () => {
      await h.webhook('subscription.charged', charged(2, 'pay_renew1'), { eventId: 'evt_renew1' });

      const renewal = db.payments.find(p => p.razorpay_payment_id === 'pay_renew1');
      assert.ok(renewal, 'renewal payment recorded');
      assert.equal(renewal.isRenewal, true);
      assert.equal(renewal.user, 'tpo1');
      assert.equal(renewal.plan, 'planCampus');
      assert.equal(renewal.amount, 5900);
      assert.equal(renewal.status, 'completed');
      assert.equal(db.emails.length, 1, 'the renewal confirmation email is sent');
    });

    it('split the GST back out of the charged total', async () => {
      await h.webhook('subscription.charged', charged(2, 'pay_renew1'), { eventId: 'evt_renew1' });
      const renewal = db.payments.find(p => p.razorpay_payment_id === 'pay_renew1');

      assert.equal(renewal.baseAmount, 5000);
      assert.equal(renewal.gstPercentage, 18);
      assert.ok(Math.abs(renewal.baseAmount + renewal.gstAmount - renewal.amount) < 0.011);
    });

    it('make the new cycle the live payment and deactivate the previous one', async () => {
      await h.webhook('subscription.charged', charged(2, 'pay_renew1'), { eventId: 'evt_renew1' });
      await h.webhook('subscription.charged', charged(3, 'pay_renew2'), { eventId: 'evt_renew2' });

      const status = Object.fromEntries(db.payments.map(p => [p.razorpay_payment_id, p.status]));
      assert.deepEqual(status, { pay_first: 'superseded', pay_renew1: 'superseded', pay_renew2: 'completed' });
    });

    it('extend the subscription period', async () => {
      db.collegeByTpo.tpo1.nextRenewalDate = new Date(0);
      db.collegeByTpo.tpo1.renewalFailureCount = 2;
      await h.webhook('subscription.charged', charged(2, 'pay_renew1'), { eventId: 'evt_renew1' });
      assert.ok(db.collegeByTpo.tpo1.nextRenewalDate > new Date(), 'renewal date moves into the future');
      assert.equal(db.collegeByTpo.tpo1.renewalFailureCount, 0, 'a successful charge clears earlier failures');
    });

    it('count once when Razorpay redelivers the event, and the redelivery is acknowledged', async () => {
      await h.webhook('subscription.charged', charged(2, 'pay_renew1'), { eventId: 'evt_renew1' });
      const redelivery = await h.webhook('subscription.charged', charged(2, 'pay_renew1'), { eventId: 'evt_renew1' });

      assert.equal(redelivery.statusCode, 200, 'a non-2xx would make Razorpay keep retrying');
      assert.equal(db.payments.length, 2);
      assert.equal(db.renewalLogs.length, 1);
      assert.equal(db.emails.length, 1);
    });

    it('are recorded once even if the same payment arrives under a different event id', async () => {
      await h.webhook('subscription.charged', charged(2, 'pay_renew1'), { eventId: 'evt_renew1' });
      await h.webhook('subscription.charged', charged(2, 'pay_renew1'), { eventId: 'evt_other' });
      assert.equal(db.payments.filter(p => p.razorpay_payment_id === 'pay_renew1').length, 1);
    });
  });

  describe('failed renewals', () => {
    beforeEach(async () => {
      await h.webhook('subscription.charged', charged(1, 'pay_first'));
      db.emails.length = 0;
    });

    it('count each failure once and email the subscriber', async () => {
      const payload = { subscription: { entity: { id: 'sub_1', notes } } };
      await h.webhook('subscription.pending', payload, { eventId: 'evt_fail1' });
      const redelivery = await h.webhook('subscription.pending', payload, { eventId: 'evt_fail1' });

      assert.equal(redelivery.statusCode, 200);
      assert.equal(db.collegeByTpo.tpo1.renewalFailureCount, 1);
      assert.equal(db.renewalLogs.length, 1);
      assert.equal(db.emails.length, 1);
    });
  });
});

describe('Razorpay webhook — request checks', () => {
  beforeEach(() => h.reset());

  it('rejects a request with no signature', async () => {
    const res = await h.webhook('order.paid', h.orderPaidPayload('o', 'p', h.orderNotes('u1', 'planPro'), 1180), { omitSignature: true });
    assert.equal(res.statusCode, 400);
    assert.equal(db.payments.length, 0);
  });

  it('rejects a wrong signature', async () => {
    const res = await h.webhook('order.paid', h.orderPaidPayload('o', 'p', h.orderNotes('u1', 'planPro'), 1180), { signature: 'f'.repeat(64) });
    assert.equal(res.statusCode, 400);
    assert.equal(db.payments.length, 0);
  });

  it('rejects a body that was changed after signing', async () => {
    const original = Buffer.from(JSON.stringify({ event: 'order.paid', payload: h.orderPaidPayload('o', 'p', h.orderNotes('u1', 'planPro'), 1) }));
    const signature = h.webhookHmac(original.toString());
    const tampered = Buffer.from(original.toString().replace('"amount":100', '"amount":1'));
    const res = await h.webhook('order.paid', {}, { signature, rawBody: tampered });
    assert.equal(res.statusCode, 400);
  });

  it('ignores events it does not handle', async () => {
    const res = await h.webhook('payment.authorized', { payment: { entity: { id: 'p' } } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'ignored');
  });
});
