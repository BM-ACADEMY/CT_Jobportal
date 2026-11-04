const mongoose = require('mongoose');

// One browser (or installed app) that agreed to receive web push for a user. A person can have several
// (phone, laptop). The endpoint is the push service URL and is unique per browser profile.
const pushSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  userAgent: { type: String, default: '' },
  // Set when the browser is a standalone (installed) app; informational only.
  standalone: { type: Boolean, default: false },
  lastUsedAt: { type: Date, default: null },
  // Consecutive delivery failures that were not a clean "gone" response; the row is removed after a few.
  failures: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
