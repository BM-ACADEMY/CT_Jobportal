const mongoose = require('mongoose');

// One row per person per alert period, so a person never gets the same WhatsApp job alert twice. Holds no message text.
const logSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true },       // e.g. "2026-W47"
  status: { type: String, enum: ['sending', 'sent', 'failed', 'skipped'], default: 'sending' },
  createdAt: { type: Date, default: Date.now, expires: 60 * 24 * 3600 },
});
logSchema.index({ user: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('WhatsAppAlertLog', logSchema);
