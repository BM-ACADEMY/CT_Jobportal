const mongoose = require('mongoose');

const collegeStudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  campusDrive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampusDrive'
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  batchYear: {
    type: Number
  },
  rollNumber: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  cgpa: {
    type: Number,
    default: 0
  },
  activeArrears: {
    type: Number,
    default: 0
  },
  registrationSource: {
    type: String,
    enum: ['self', 'qr', 'csv'],
    default: 'self'
  },
  placementStatus: {
    type: String,
    enum: ['unplaced', 'registered', 'active', 'applied', 'shortlisted', 'interviewing', 'placed', 'opted_out'],
    default: 'registered'
  },
  currentRound: {
    type: String,
    default: ''
  },
  isActivated: {
    type: Boolean,
    default: false
  },
  driveApplications: [{
    drive: { type: mongoose.Schema.Types.ObjectId, ref: 'CampusDrive', required: true },
    status: {
      type: String,
      enum: ['registered', 'stage1', 'stage2', 'final_interview', 'certificate_verification', 'selected', 'rejected', 'withdrawn'],
      default: 'registered'
    },
    currentRound: { type: String, default: '' },
    appliedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  placedDetails: [{
    companyName: { type: String, trim: true },
    packageLPA: { type: Number, default: 0 },
    tierPolicy: { type: String, enum: ['regular', 'dream', 'super_dream'], default: 'regular' },
    placedAt: { type: Date, default: Date.now }
  }],
  readinessScore: {
    type: Number,
    default: 70
  },
  assessmentScores: [{
    skill: { type: String },
    score: { type: Number },
    total: { type: Number, default: 10 },
    category: { type: String, default: 'general' },
    completedAt: { type: Date, default: Date.now }
  }],
  idVerification: {
    documentUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    rejectionReason: { type: String, default: '' },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date }
  },
  certificateUrl: {
    type: String,
    default: ''
  },
  certificateCode: {
    type: String,
    unique: true,
    sparse: true
  },
  whatsappNumber: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

// Compound index: one student per college (can be in multiple colleges)
collegeStudentSchema.index({ user: 1, college: 1 }, { unique: true });
collegeStudentSchema.index({ college: 1, placementStatus: 1 });
collegeStudentSchema.index({ college: 1, department: 1 });
collegeStudentSchema.index({ college: 1, batchYear: 1 });

module.exports = mongoose.model('CollegeStudent', collegeStudentSchema);
