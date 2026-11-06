const mongoose = require('mongoose');

// One row per scored free skill test. No personal data: it only lets admin count tests, pass rate and skills.
const freeTestAttemptSchema = new mongoose.Schema({
  skill: { type: String, required: true, trim: true, lowercase: true, index: true },
  source: { type: String, enum: ['bank', 'ai'], required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  percentage: { type: Number, required: true },
  passed: { type: Boolean, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

freeTestAttemptSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FreeTestAttempt', freeTestAttemptSchema);
