const mongoose = require('mongoose');

const payPerFeatureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  featureKey: {
    type: String,
    required: true,
  },
  roles: [{
    type: String,
    required: true,
    enum: ['jobseeker', 'recruiter', 'company', 'college'],
  }],
  cost: {
    type: Number,
    required: true,
  },
  pricingOptions: [{
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  days: {
    type: Number,
    required: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('PayPerFeature', payPerFeatureSchema);
