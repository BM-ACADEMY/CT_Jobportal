const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  payPerFeature: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PayPerFeature',
    default: null
  },
  paymentType: {
    type: String,
    enum: ['subscription', 'pay-per-feature'],
    default: 'subscription'
  },
  amount: {
    type: Number,
    required: true
  },
  baseAmount: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    default: 1
  },
  gstPercentage: {
    type: Number,
    default: 0
  },
  gstAmount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  razorpay_order_id: {
    type: String,
    required: function() { return this.amount > 0; }
  },
  razorpay_payment_id: {
    type: String,
    required: function() { return this.amount > 0; }
  },
  razorpay_signature: {
    type: String
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'pending', 'superseded', 'cancelled', 'refund_pending', 'refunded'],
    default: 'completed'
  },
  paymentMethod: {
    type: String,
    default: 'Razorpay'
  },
  couponApplied: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null
  },
  // True for an automatic charge of an existing recurring subscription (as opposed to a purchase).
  isRenewal: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// One Razorpay payment can only ever produce one Payment row, so a replayed verify request cannot
// grant the same purchase twice. Free (amount 0) records use placeholder ids and are excluded.
paymentSchema.index(
  { razorpay_payment_id: 1 },
  { unique: true, partialFilterExpression: { razorpay_payment_id: { $type: 'string' }, amount: { $gt: 0 } } }
);

module.exports = mongoose.model('Payment', paymentSchema);
