const mongoose = require('mongoose');

const renewalLogSchema = new mongoose.Schema({
  subscriberModel: {
    type: String,
    enum: ['College', 'Company'],
    required: true
  },
  subscriber: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'subscriberModel'
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  razorpaySubscriptionId: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true
  },
  amount: {
    type: Number,
    default: 0
  },
  failureReason: {
    type: String,
    default: ''
  },
  failureCountAtEvent: {
    type: Number,
    default: 0
  },
  // Razorpay's x-razorpay-event-id — webhooks are retried, so this makes each event count once.
  eventId: {
    type: String
  }
}, { timestamps: true });

renewalLogSchema.index({ eventId: 1 }, { unique: true, partialFilterExpression: { eventId: { $type: 'string' } } });

renewalLogSchema.index({ subscriber: 1, createdAt: -1 });

module.exports = mongoose.model('RenewalLog', renewalLogSchema);
