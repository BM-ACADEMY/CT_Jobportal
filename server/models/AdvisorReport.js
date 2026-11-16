const mongoose = require('mongoose');

// One saved advisor note: the weekly report or an answer to a question. Numbers are worked out by code; the AI wording is `summary`, `good`, `bad`.
const metricSchema = new mongoose.Schema({ key: String, label: String, value: Number, previous: Number, status: String }, { _id: false });
const advisorReportSchema = new mongoose.Schema({
  kind: { type: String, enum: ['weekly', 'question'], default: 'weekly', index: true },
  question: { type: String, default: '', maxlength: 300 },
  metrics: { type: [metricSchema], default: [] },
  summary: { type: String, default: '' },
  good: { type: [String], default: [] },
  bad: { type: [String], default: [] },
  aiUsed: { type: Boolean, default: false },
  aiError: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('AdvisorReport', advisorReportSchema);
