const mongoose = require('mongoose');

// An idea from the advisor. Kamar chooses; accepted ideas show in the Needs-action list until marked done.
const advisorIdeaSchema = new mongoose.Schema({
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'AdvisorReport', required: true, index: true },
  title: { type: String, required: true, maxlength: 100 },
  reason: { type: String, default: '', maxlength: 300 },
  numbers: { type: String, default: '', maxlength: 150 },
  status: { type: String, enum: ['suggested', 'accepted', 'later', 'rejected', 'done'], default: 'suggested', index: true },
  decidedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('AdvisorIdea', advisorIdeaSchema);
