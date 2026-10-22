const mongoose = require('mongoose');

// One ready-made set of 10 questions for a campus skill-test category (see config/courseMap.js).
// Sets are generated ahead of time (scripts/generateQuestionBank.js) so students never wait for, or depend on, a live AI call.
const campusQuestionSetSchema = new mongoose.Schema({
  category: { type: String, required: true, index: true },
  questions: [{
    id: { type: Number, required: true },
    question: { type: String, required: true },
    options: { a: String, b: String, c: String, d: String },
    correct_option: { type: String, enum: ['a', 'b', 'c', 'd'], required: true },
    explanation: { type: String, default: '' },
  }],
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CampusQuestionSet', campusQuestionSetSchema);
