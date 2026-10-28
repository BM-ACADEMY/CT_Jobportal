const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: Number,
  question: String,
  options: {
    a: String,
    b: String,
    c: String,
    d: String
  },
  correct_option: String,
  explanation: String
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['data', 'design', 'development', 'marketing', 'general'],
    default: 'general',
    index: true
  },
  questions: [questionSchema],
  // Set when a free-assessment attempt is scored, so one question set is scored once.
  submittedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
