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
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
