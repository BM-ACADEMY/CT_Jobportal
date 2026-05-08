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
    required: true,
    enum: ['Monthly', 'Quarterly', 'Yearly', 'Lifetime']
  },
  roles: [{
    type: String,
    required: true,
    enum: ['jobseeker', 'recruiter', 'company']
  }],

  // Job Seeker specific
  hasResumeBuilder: { type: Boolean, default: false },
  resumeBuilderCount: { type: Number, default: 0 },
  hasUnlimitedApplications: { type: Boolean, default: false },
  applicationLimit: { type: Number, default: 0 }, // 0 for unlimited
  jobAlerts: { type: String, enum: ['Daily', 'Real-time', 'None'], default: 'None' },
  hasProfileBoost: { type: Boolean, default: false },
  hasAIResumeReview: { type: Boolean, default: false },
  aiResumeReviewCount: { type: Number, default: 0 },
  hasProfileViewInsights: { type: Boolean, default: false },
  hasMessageRecruiters: { type: Boolean, default: false },
  hasSalaryBenchmarking: { type: Boolean, default: false },
  hasSkillGapAnalysis: { type: Boolean, default: false },
  skillGapSessionsCount: { type: Number, default: 0 },
  careerCounsellingCount: { type: Number, default: 0 },
  hasInterviewPrep: { type: Boolean, default: false },
  hasPriorityBadge: { type: Boolean, default: false },

  // Recruiter specific
  activeJobPostings: { type: Number, default: 0 }, // 0 for unlimited
  candidateSearchPerDay: { type: Number, default: 0 }, // 0 for unlimited
  hasAICandidateMatching: { type: Boolean, default: false },
  aiCandidateMatchingCount: { type: Number, default: 0 }, // 0 for unlimited
  hasATSPipeline: { type: Boolean, default: false },
  hasPriorityListing: { type: Boolean, default: false },
  hasAnalyticsDashboard: { type: Boolean, default: false },
  hasCandidateDBExport: { type: Boolean, default: false },
  hasBulkMessaging: { type: Boolean, default: false },
  hasVideoInterview: { type: Boolean, default: false },
  hasDedicatedManager: { type: Boolean, default: false },
  hasWhiteLabelProfile: { type: Boolean, default: false },

  // Organization specific
  userSeats: { type: Number, default: 1 },
  companyProfileType: { type: String, enum: ['Basic', 'Branded', 'Full Custom'], default: 'Basic' },
  hasBrandedCareersPage: { type: Boolean, default: false },
  hasTeamCollaboration: { type: Boolean, default: false },
  teamCollaborationCount: { type: Number, default: 0 }, // 0 for unlimited
  hasBulkApplicantManagement: { type: Boolean, default: false },
  hasInterviewScheduling: { type: Boolean, default: false },
  hasAPIIntegration: { type: Boolean, default: false },
  hasSSO: { type: Boolean, default: false },
  hasDedicatedOnboarding: { type: Boolean, default: false },
  hasSLAGuarantee: { type: Boolean, default: false },
  hasComplianceAudit: { type: Boolean, default: false },

  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
