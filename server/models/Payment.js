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
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
