const crypto = require('crypto');
const Payment = require('../models/Payment');
const Coupon = require('../models/Coupon');

// Constant-time comparison of a Razorpay HMAC signature.
const isValidSignature = (payload, signature) => {
  if (typeof signature !== 'string' || !process.env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(payload).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const isDuplicateKeyError = err => err?.code === 11000;

// A Razorpay payment id may only ever be turned into one Payment row. Callers look it up first
// (sequential replays) and also create the row before granting anything, so the unique index on
// razorpay_payment_id settles concurrent replays.
const findPaymentByRazorpayId = paymentId => Payment.findOne({ razorpay_payment_id: paymentId });

// Razorpay order/subscription `notes` are set by us when the checkout is created, so unlike the
// request body they cannot be altered by the client. Values are stored as strings.
const checkoutNotes = ({ userId, planId, featureId, quantity, couponCode }) => ({
  userId: String(userId),
  ...(planId && { planId: String(planId) }),
  ...(featureId && { featureId: String(featureId) }),
  quantity: String(quantity || 1),
  couponCode: couponCode || ''
});

// The discount was already honoured when the order was created, so the coupon is looked up
// without re-checking its limits: a coupon that ran out in the meantime must still be recorded.
const findCoupon = code => (code ? Coupon.findOne({ code: String(code).toUpperCase() }) : null);

// Counts one use of a coupon. The check and the increment happen in a single atomic update so
// concurrent checkouts cannot push a coupon past its limit. Call this only once the payment
// has been recorded, so a replayed request cannot count a use twice.
const countCouponUse = coupon => coupon && Coupon.updateOne(
  { _id: coupon._id, $or: [{ totalUses: 0 }, { $expr: { $lt: ['$currentUses', '$totalUses'] } }] },
  { $inc: { currentUses: 1 } }
);

module.exports = { isValidSignature, isDuplicateKeyError, findPaymentByRazorpayId, checkoutNotes, findCoupon, countCouponUse };
