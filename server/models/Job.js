const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  postedAs: {
    type: String,
    enum: ['company', 'recruiter', 'both'],
    default: 'company'
  },
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vacancies: {
    type: Number,
    required: [true, 'Number of vacancies is required'],
    default: 1
  },
  experience: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  jobType: {
    type: String,
    default: 'Full-time'
  },
  workMode: {
    type: String,
    default: 'On-site'
  },
  location: {
    type: String,
    trim: true
  },
  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' },
    isRangeHidden: { type: Boolean, default: false }
  },
  timings: {
    type: String,
    trim: true
  },
  shifts: {
    type: String,
    trim: true
  },
  skillsRequired: [{
    type: String,
    trim: true
  }],
  additionalDetails: [{
    key: { type: String, required: true },
    value: { type: String, required: true }
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'draft', 'inactive'],
    default: 'active'
  },
  applicantsCount: {
    type: Number,
    default: 0
  },
  applicationQuestions: [{
    questionText: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['text', 'textarea', 'multiple-choice', 'checkbox'], 
      default: 'text' 
    },
    options: [String],
    isRequired: { type: Boolean, default: true },
    isStandard: { type: Boolean, default: false }
  }],
  display_id: {
    type: String,
    unique: true,
    sparse: true
  },
  isCloned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

jobSchema.pre('save', async function() {
  if (!this.display_id) {
    const generateDisplayId = require('../utils/generateDisplayId');
    const year = new Date().getFullYear();
    this.display_id = await generateDisplayId('VJ', year);
  }
});

module.exports = mongoose.model('Job', jobSchema);
