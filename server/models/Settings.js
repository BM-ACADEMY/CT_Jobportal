const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  gstPercentage: { type: Number, default: 0, min: 0, max: 100 },
  gstNumber: { type: String, default: '' },
  address: { type: String, default: '' },
  pincode: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  billingName: { type: String, default: '' },
  // Price of a stall at our own job fairs, in rupees. Blank (null) until the owner decides; nothing in code sets or assumes a value.
  fairStallPrice: { type: Number, default: null, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
