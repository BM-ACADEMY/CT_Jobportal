const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String
  },
  // Set automatically when the text looks like a scam (asks for money, OTP, unrealistic pay). Admin reviews it; the job stays live.
  scamFlags: { type: [String], default: [] },
  reportCount: { type: Number, default: 0 }, // user reports (controllers/jobReportController.js)
  scamReviewed: { type: Boolean, default: false },
  // Only for jobType 'Internship' (utils/internship.js). free = does not use a paid job slot (verified company, up to 3 live).
  internship: {
    durationMonths: { type: Number },
    stipendType: { type: String, enum: ['paid', 'unpaid'] },
    stipendAmount: { type: Number, default: 0 },
    mode: { type: String, enum: ['onsite', 'remote', 'hybrid'] },
    certificate: { type: Boolean, default: false },
    ppo: { type: Boolean, default: false },
    free: { type: Boolean, default: false }
  },
  // Set by an admin after payment is received by hand (controllers/jobPromotionController.js). Shown with a clear label.
  sponsoredUntil: { type: Date, default: null },
  sponsoredNote: { type: String, default: '', maxlength: 200, select: false }, // payment note: never sent to the public
  urgentUntil: { type: Date, default: null },
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
  // Field of work (config/jobCategories.js). Empty on jobs posted before categories existed.
  category: {
    type: String,
    default: '',
    index: true
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
  validThrough: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    index: true
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
  },
  lastViewedApplicantsAt: {
    type: Date,
    default: null
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
