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
  // Optional walk-in tag on an ordinary job (utils/walkIn.js). Absent on older jobs.
  walkIn: {
    enabled: { type: Boolean },
    date: { type: Date },
    venue: { type: String, trim: true, maxlength: 200 }
  },
  // Set by an admin after payment is received by hand (controllers/jobPromotionController.js). Shown with a clear label.
  sponsoredUntil: { type: Date, default: null },
  sponsoredNote: { type: String, default: '', maxlength: 200, select: false }, // payment note: never sent to the public
  urgentUntil: { type: Date, default: null },
  shortLife: { type: Boolean, default: false }, // set by the server for the limited free tier: public for 14 days only, renewing does not extend it
  renewedAt: { type: Date, default: null }, // the company pressed Renew: keeps an old job on the public list for 45 more days
  hiddenFromPublic: { type: Boolean, default: false }, // Super Admin switch
  // Job found on the web: candidates apply on the employer's own site. Set only by an admin (utils/externalApply.js).
  externalApply: {
    url: { type: String, default: undefined },
    employerName: { type: String, default: undefined },
    sourceName: { type: String, default: undefined },
    clicks: { type: Number, default: 0 }
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
    isRangeHidden: { type: Boolean, default: false },
    unit: { type: String, enum: ['year', 'month', 'day', 'hour'], default: 'year' } // min/max are in rupees per this unit (year = the old LPA jobs)
  },
  // Who can apply and how the job is worked (utils/jobFacets.js). Empty on jobs posted before these existed.
  education: { type: String, enum: ['', 'any', '10th', '12th', 'iti-diploma', 'graduate', 'postgraduate'], default: '', index: true },
  freshersWelcome: { type: Boolean, default: false },
  contractMonths: { type: Number, default: null },
  partTime: {
    hoursPerDay: { type: Number, default: null },
    schedule: { type: String, enum: ['', 'flexible', 'mornings', 'evenings', 'weekdays', 'weekends'], default: '' }
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
