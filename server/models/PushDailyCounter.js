const mongoose = require('mongoose');

// One row per person per IST day: how many web pushes were sent. Used for the daily cap in
// utils/webPush.js with an atomic findOneAndUpdate (see reserveDailySlot), so two notifications
// arriving at the same moment cannot both slip past the limit. Rows expire by themselves.
const pushDailyCounterSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, required: true }, // YYYY-MM-DD in Asia/Kolkata
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true }
});
pushDailyCounterSchema.index({ user: 1, day: 1 }, { unique: true });
pushDailyCounterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PushDailyCounter', pushDailyCounterSchema);
