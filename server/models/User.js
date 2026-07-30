const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: function() { return !this.googleId && !this.githubId && !this.linkedinId; },
  },
  isSocialIncomplete: {
    type: Boolean,
    default: false,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  coverPic: {
    type: String,
    default: '',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpiry: {
    type: Date,
    default: null,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true,
  },
  linkedinId: {
    type: String,
    unique: true,
    sparse: true,
  },
  profile: {
    headline: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    qualification: [{
      degree: { type: String },
      institution: { type: String },
      year: { type: String }
    }],
    experience: [{
      company: { type: String },
      role: { type: String },
      duration: { type: String },
      description: { type: String }
    }],
    interestedDomain: [{ type: String }],
    shifts: [{ type: String }],
    preferredRole: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    resumeName: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' },
    profileCompletion: { type: Number, default: 0 },
    jobPreferences: {
      jobTitles: [{ type: String }],
      locationTypes: [{ type: String }], // e.g., On-site, Hybrid, Remote
      onSiteLocations: [{ 
        city: { type: String },
        state: { type: String }
      }],
      noticePeriod: { type: String, default: '' },
      expectedSalary: { type: String, default: '' },
      remoteLocations: [{ type: String }],
      startDate: { type: String, default: '' },
      employmentTypes: [{ type: String }],
      visibility: { type: String, default: 'Everyone' }
    }
  },
  isAdminBlocked: {
    type: Boolean,
    default: false
  },
  blockedEntities: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  }],
  onModel: {
    type: String,
    enum: ['User', 'Company']
  },
  recruiterProfile: {
    jobTitle: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    currentExp: { type: Number, default: 0 },
    previousExp: { type: Number, default: 0 },
    totalExp: { type: Number, default: 0 },
    skills: [{ type: String }],
    experience: [{
      company: { type: String },
      role: { type: String },
      duration: { type: String },
      description: { type: String }
    }],
    qualification: [{
      degree: { type: String },
      institution: { type: String },
      year: { type: String }
    }],
    certifications: [{
      name: { type: String },
      organization: { type: String },
      year: { type: String }
    }]
  },
  companyProfile: {
    jobTitle: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    adminRole: { type: String, default: 'Admin' }
  },
  collegeProfile: {
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    designation: { type: String, default: 'TPO' }
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  companyHistory: [{
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    status: { type: String, enum: ['Current', 'Previous'], default: 'Current' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date }
  }],
  employerCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  // Set only by the "Add Team Member" invite/accept-join-request flow (never by a recruiter
  // setting up their own solo company profile) — the actual gate for page-level permission
  // enforcement, since `company` alone is also set for solo recruiters and can't distinguish
  // "delegated team member" from "owns their own company profile".
  isTeamManaged: {
    type: Boolean,
    default: false
  },
  teamPermissions: {
    type: [String],
    default: [],
    enum: ['post_job', 'my_jobs', 'candidate_search', 'messages',
           'ats_pipeline', 'analytics', 'bulk_messaging',
           'bulk_applicant_management', 'interview_scheduling', 'ai_candidate_matching']
  },
  pendingCompanyInvite: {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    type: { type: String, enum: ['employee', 'recruiter'], default: 'employee' },
    permissions: { type: [String], default: [] }
  },
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  hiddenJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    get: function(v) {
      if (this.subscriptionDetails) {
        const details = this.subscriptionDetails;
        const expiry = this.subscriptionExpiry;
        const isValid = details.price === 0 || details.duration === 'Lifetime' || !expiry || new Date(expiry) > new Date();
        if (isValid) {
          return details;
        }
      }
      return v;
    }
  },
  subscriptionExpiry: {
    type: Date
  },
  subscriptionDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  downloadsUsed: {
    type: Number,
    default: 0
  },
  candidateDBExportsUsed: {
    type: Number,
    default: 0
  },
  searchUsed: {
    type: Number,
    default: 0
  },
  jobsUsed: {
    type: Number,
    default: 0
  },
  messagesUsed: {
    type: Number,
    default: 0
  },
  counsellingSessionsUsed: {
    type: Number,
    default: 0
  },
  mockInterviewsUsed: {
    type: Number,
    default: 0
  },
  aiResumeReviewUsed: {
    type: Number,
    default: 0
  },
  priorityApplicationsUsed: {
    type: Number,
    default: 0
  },
  joinRequestsUsed: {
    type: Number,
    default: 0
  },
  searchUsedDate: {
    type: Date,
    default: null
  },
  display_id: {
    type: String,
    unique: true,
    sparse: true
  },
  isPhoneVisible: {
    type: Boolean,
    default: true
  },
  purchasedFeatures: [{
    featureId: { type: mongoose.Schema.Types.ObjectId, ref: 'PayPerFeature' },
    featureKey: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    usageLeft: { type: Number, default: 0 },
    expiresAt: { type: Date },
    purchasedAt: { type: Date, default: Date.now }
  }],
  aiMatchedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  lastLoginAt: {
    type: Date
  },
  lastLogoutAt: {
    type: Date
  },
  sessionLogs: [{
    loginAt: { type: Date, default: Date.now },
    logoutAt: { type: Date, default: null },
    durationMinutes: { type: Number, default: 0 }
  }]
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

userSchema.pre('save', async function() {
  if (!this.display_id && this.role) {
    const Role = mongoose.model('Role');
    const roleDoc = await Role.findById(this.role);
    let prefix = 'VC'; // default for candidate
    if (roleDoc) {
      if (['recruiter', 'company', 'org_employee'].includes(roleDoc.name)) prefix = 'VE';
      else if (roleDoc.name === 'college') prefix = 'VG';
    }
    const generateDisplayId = require('../utils/generateDisplayId');
    const year = new Date().getFullYear();
    this.display_id = await generateDisplayId(prefix, year);
  }
});

  module.exports = mongoose.model('User', userSchema);
