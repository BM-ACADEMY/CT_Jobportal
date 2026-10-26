const mongoose = require('mongoose');

// One row per lifecycle mail sent. `key` makes a mail once-only (or once per period, e.g. jobs-2026-W43).
const emailLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
}, { versionKey: false });

emailLogSchema.index({ user: 1, key: 1 }, { unique: true });
emailLogSchema.index({ user: 1, sentAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
