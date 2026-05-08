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
    ref: 'Company',
    required: true
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
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
    default: 'Full-time'
  },
  workMode: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid'],
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
  }]
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
