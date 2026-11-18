const mongoose = require('mongoose');

// A signed-in job seeker tapped "I am going" on a fair. Used for reminders and for the post-fair mail.
const fairInterestSchema = new mongoose.Schema({
  fair: { type: mongoose.Schema.Types.ObjectId, ref: 'JobFair', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
fairInterestSchema.index({ fair: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('FairInterest', fairInterestSchema);
