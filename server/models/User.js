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
    required: true,
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
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });

  module.exports = mongoose.model('User', userSchema);
