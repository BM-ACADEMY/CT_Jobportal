const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');
const { isAlreadyRefunded, refundAtGateway } = require('../../utils/refundGateway');
const paymentController = require('../../controllers/paymentController');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const Subscription = require('../../models/Subscription');

// Stand-ins for the database calls approveRefund makes.
let record;
const setup = (over = {}) => {
  h.reset();
  const user = h.makeUser('u1', { role: { name: 'jobseeker' }, subscription: 'planPro', subscriptionDetails: { name: 'Pro' } });
  record = { _id: 'pay1', user, status: 'refund_pending', amount: 1180, razorpay_payment_id: 'pay_RZP1', refundReason: 'Accidental purchase', async save() { h.db.saves += 1; }, ...over };
  Payment.findById = () => ({ populate: async () => record });
  User.findById = () => ({ populate: async () => user });
  Subscription.findOne = async () => h.plans.free;
  return user;
};
const approve = () => h.mockRes && (async () => {
  const res = h.mockRes();
  await paymentController.approveRefund({ io: null, params: { paymentId: 'pay1' } }, res);
  return res;
})();

test('approving a refund sends it to Razorpay (full amount) and then marks it refunded', async () => {
  const user = setup();
  const res = await approve();
  assert.equal(res.statusCode, 200);
  assert.equal(h.razorpay.refunds.length, 1);
  assert.equal(h.razorpay.refunds[0].paymentId, 'pay_RZP1');
  assert.equal('amount' in h.razorpay.refunds[0].options, false, 'no amount sent = full refund');
  assert.equal(record.status, 'refunded');
  assert.equal(record.razorpay_refund_id, 'rfnd_1');
  assert.equal(res.body.refundId, 'rfnd_1');
  assert.equal(user.subscription, h.plans.free._id, 'plan moved to Free');
});

test('if Razorpay refuses, nothing changes and the admin sees the reason', async () => {
  const user = setup();
  h.razorpay.refundError = { statusCode: 400, error: { description: 'Insufficient balance to refund' } };
  const res = await approve();
  assert.equal(res.statusCode, 502);
  assert.match(res.body.msg, /Insufficient balance/);
  assert.equal(record.status, 'refund_pending', 'still pending so it can be retried');
  assert.equal(user.subscription, 'planPro', 'plan not revoked');
});

test('a payment already refunded at Razorpay still completes our side', async () => {
  setup();
  h.razorpay.refundError = { statusCode: 400, error: { description: 'The payment has been fully refunded already' } };
  const res = await approve();
  assert.equal(res.statusCode, 200);
  assert.equal(record.status, 'refunded');
  assert.equal(res.body.refundId, null);
});

test('only a refund_pending payment can be approved, and Razorpay is not called otherwise', async () => {
  setup({ status: 'refunded' });
  const res = await approve();
  assert.equal(res.statusCode, 400);
  assert.equal(h.razorpay.refunds.length, 0);
});

test('an item with no Razorpay payment (nothing was charged) skips the gateway', async () => {
  setup({ razorpay_payment_id: '' });
  const res = await approve();
  assert.equal(res.statusCode, 200);
  assert.equal(h.razorpay.refunds.length, 0);
  assert.equal(record.status, 'refunded');
});

test('isAlreadyRefunded recognises Razorpay wording only', () => {
  assert.equal(isAlreadyRefunded({ error: { description: 'The payment has been fully refunded already' } }), true);
  assert.equal(isAlreadyRefunded({ error: { description: 'Payment already refunded' } }), true);
  assert.equal(isAlreadyRefunded({ error: { description: 'The id provided does not exist' } }), false);
  assert.equal(isAlreadyRefunded(new Error('network down')), false);
});

test('refundAtGateway turns a Razorpay error into a clear message', async () => {
  const razorpay = { payments: { refund: async () => { throw { error: { description: 'The id provided does not exist' } }; } } };
  await assert.rejects(() => refundAtGateway(razorpay, { _id: 'p', razorpay_payment_id: 'pay_x' }), (e) => /does not exist/.test(e.userMessage) && /Nothing was changed/.test(e.userMessage));
});

test('a bare status-code rejection from the SDK still gives a readable reason', async () => {
  const razorpay = { payments: { refund: async () => { throw { statusCode: 404 }; } } };
  await assert.rejects(() => refundAtGateway(razorpay, { _id: 'p', razorpay_payment_id: 'pay_x' }), (e) => /not found at Razorpay/.test(e.userMessage));
});
