const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  },
  university: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  },
  // Partner colleges strip: set by an admin after the college agreed (written or by phone, noted).
  showLogo: { type: Boolean, default: false },
  logoApproved: { type: Boolean, default: false },
  logoConsentNote: { type: String, default: '', maxlength: 200 },
  principalName: {
    type: String,
    trim: true,
    default: ''
  },
  principalEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  collegeEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  collegePhone: {
    type: String,
    trim: true,
    default: ''
  },
  additionalReportRecipients: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  tpoUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamMembers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['placement_head', 'department_coordinator', 'faculty_coordinator', 'data_entry'], default: 'faculty_coordinator' },
    departments: [{ type: String, trim: true }],
    permissions: [{ type: String, enum: ['dashboard', 'students', 'verification', 'drives', 'reports', 'settings', 'team'] }],
    isActive: { type: Boolean, default: true },
    addedAt: { type: Date, default: Date.now }
  }],
  departments: [{
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true }
  }],
  subscriptionTier: {
    type: String,
    enum: ['campus_free', 'campus_lite', 'campus_pro', 'campus_elite'],
    default: 'campus_free'
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  studentLimit: {
    type: Number,
    default: 100 // matches the Campus Free plan's Student Capacity — see scripts/seedCampusPlans.js
  },
  // Student packs bought on top of the plan (see utils/collegePack.js). They count only until extraUntil.
  extraStudents: { type: Number, default: 0 },
  extraUntil: { type: Date, default: null },
  subscriptionExpiry: {
    type: Date
  },
  nextRenewalDate: {
    type: Date
  },
  autoRenewEnabled: {
    type: Boolean,
    default: true
  },
  razorpaySubscriptionId: {
    type: String,
    default: ''
  },
  renewalFailureCount: {
    type: Number,
    default: 0
  },
  mouDocument: {
    type: String,
    default: ''
  },
  mouSignedAt: {
    type: Date
  },
  proofDocumentUrl: {
    type: String,
    default: ''
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  // Set by an admin for test or demo colleges. They stay in the database but are hidden from the
  // verification list by default and are not counted in admin totals.
  isTest: { type: Boolean, default: false, index: true },
  // Why an admin verified without a proof document (how it was checked), or why it was rejected.
  verificationNote: { type: String, default: '', maxlength: 500 },
  // Messages an admin sent asking the college for proof or details. The status stays as it was.
  infoRequests: [{
    message: { type: String, maxlength: 500 },
    askedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    askedAt: { type: Date, default: Date.now }
  }],
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  principalPasskey: {
    type: String,
    unique: true,
    sparse: true
  },
  // Short-lived 4-digit code the TPO shares alongside the passkey link. The link alone does not
  // grant access — the principal must also enter the current code, which the TPO can rotate anytime.
  principalAccessCode: {
    type: String,
    default: null
  },
  principalAccessCodeExpiry: {
    type: Date,
    default: null
  },
  razorpayCustomerId: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  display_id: {
    type: String,
    unique: true,
    sparse: true
  }
}, { timestamps: true });

collegeSchema.pre('save', async function() {
  if (!this.display_id) {
    const generateDisplayId = require('../utils/generateDisplayId');
    const year = new Date().getFullYear();
    this.display_id = await generateDisplayId('VG', year);
  }
});

module.exports = mongoose.model('College', collegeSchema);
