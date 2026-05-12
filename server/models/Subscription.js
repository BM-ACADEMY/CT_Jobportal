const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  duration: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['jobseeker', 'recruiter', 'company']
  },

  // Job Seeker specific
  hasResumeBuilder: { type: Boolean, default: false },
  resumeBuilderCount: { type: Number, default: 0 },
  jobAlerts: { type: String, enum: ['Daily', 'Weekly', 'Monthly', 'None'], default: 'None' },
  hasProfileBoost: { type: Boolean, default: false },
  hasProfileViewInsights: { type: Boolean, default: false },
  hasMessageRecruiters: { type: Boolean, default: false },
  hasCareerCounselling: { type: Boolean, default: false },
  careerCounsellingCount: { type: Number, default: 0 },
  hasInterviewPrep: { type: Boolean, default: false },
  hasPriorityBadge: { type: Boolean, default: false },

  // Recruiter specific
  activeJobPostings: { type: Number, default: 0 }, // 0 for unlimited
  candidateSearchPerDay: { type: Number, default: 0 }, // 0 for unlimited
  hasATSPipeline: { type: Boolean, default: false },
  hasAnalyticsDashboard: { type: Boolean, default: false },
  hasCandidateDBExport: { type: Boolean, default: false },
  hasBulkMessaging: { type: Boolean, default: false },
  hasVideoInterview: { type: Boolean, default: false },

  // Organization specific
  userSeats: { type: Number, default: 1 },
  companyProfileType: { type: String, enum: ['Basic', 'Branded', 'Full Custom'], default: 'Basic' },
  hasTeamCollaboration: { type: Boolean, default: false },
  teamCollaborationCount: { type: Number, default: 0 }, // 0 for unlimited
  hasBulkApplicantManagement: { type: Boolean, default: false },
  hasInterviewScheduling: { type: Boolean, default: false },
  hasDedicatedOnboarding: { type: Boolean, default: false },

  isActive: {
    type: Boolean,
    default: true
  },
  features: [{
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
