const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    questionId: String,
    questionText: String,
    answer: mongoose.Schema.Types.Mixed
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted', 'withdrawn'],
    default: 'pending'
  },
  matchAnalysis: {
    matchPercentage: Number,
    matchedSkills: [String],
    missingSkills: [String],
    verdict: String,
    insufficientData: Boolean,
    lastCalculated: Date
  },
  display_id: {
    type: String,
    unique: true,
    sparse: true
  },
  isPriority: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

applicationSchema.pre('save', async function() {
  if (!this.display_id) {
    const generateDisplayId = require('../utils/generateDisplayId');
    const year = new Date().getFullYear();
    this.display_id = await generateDisplayId('VA', year);
  }
});

module.exports = mongoose.model('Application', applicationSchema);
