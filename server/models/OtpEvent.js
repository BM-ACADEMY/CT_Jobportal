const mongoose = require('mongoose');

// One row per verification-code event, so the admin can see if mail is the problem. No email address or code is stored.
// type: sent | send_failed | wrong | locked | expired | no_code | verified.  purpose: register | login | resend | reset.
const otpEventSchema = new mongoose.Schema({
  at: { type: Date, default: Date.now, expires: 45 * 24 * 3600 },
  type: { type: String, required: true },
  purpose: { type: String, default: '' },
  ms: { type: Number, default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { versionKey: false });

otpEventSchema.index({ at: -1 });

module.exports = mongoose.model('OtpEvent', otpEventSchema);
