const mongoose = require('mongoose');

// Counters only, never message text. Two kinds of rows:
//   key "u:<userId>:<YYYY-MM-DD>"  messages sent by one person that day (daily cap)
//   key "g:<YYYY-MM>"              tokens used by everyone that month (cost budget and alarm)
const assistantUsageSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },
  warned: { type: Boolean, default: false },
  expireAt: { type: Date, index: { expires: 0 } },
}, { versionKey: false });

module.exports = mongoose.model('AssistantUsage', assistantUsageSchema);
