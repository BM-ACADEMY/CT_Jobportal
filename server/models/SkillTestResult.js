const mongoose = require('mongoose');

const skillTestResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  difficulty: {
    type: String,
    default: 'medium'
  },
  score: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    default: false
  },
  questions: {
    type: Array,
    default: []
  },
  answers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

skillTestResultSchema.index({ user: 1, skill: 1 });

module.exports = mongoose.model('SkillTestResult', skillTestResultSchema);
