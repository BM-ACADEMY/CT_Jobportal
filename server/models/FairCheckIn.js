const mongoose = require('mongoose');

// A job seeker who turned up at one of our own fairs (checked in by an admin on the day).
const fairCheckInSchema = new mongoose.Schema({
  fair: { type: mongoose.Schema.Types.ObjectId, ref: 'JobFair', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
fairCheckInSchema.index({ fair: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('FairCheckIn', fairCheckInSchema);
