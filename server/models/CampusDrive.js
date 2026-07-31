const mongoose = require('mongoose');

const campusDriveSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  driveCode: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  batchYear: {
    type: Number,
    required: true
  },
  departments: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    default: ''
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  packageLPA: {
    type: Number,
    default: 0
  },
  tierPolicy: {
    type: String,
    enum: ['regular', 'dream', 'super_dream'],
    default: 'regular'
  },
  // Multiple companies can participate under one drive (title). `companyName`/`packageLPA`/`tierPolicy`
  // above are kept in sync with companies[0] for any older code path that still reads the singular fields.
  companies: [{
    name: { type: String, required: true, trim: true },
    packageLPA: { type: Number, default: 0 },
    tierPolicy: { type: String, enum: ['regular', 'dream', 'super_dream'], default: 'regular' },
    // Optional company-side contact — lets the TPO share a read-only link (no login) showing
    // this drive's registered candidates, same trust model as the QR registration link.
    contactName: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, lowercase: true, default: '' },
    accessToken: { type: String, default: '' },
    // Links this entry to a real registered Company account when the TPO sends a formal
    // invite (as opposed to just typing a company name in manually). `requestStatus` tracks
    // that invite's lifecycle; `conversation` opens as soon as the invite is sent so college
    // and company can discuss before the company responds.
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    requestStatus: { type: String, enum: ['none', 'requested', 'accepted', 'rejected'], default: 'none' },
    requestedAt: { type: Date },
    lastResentAt: { type: Date },
    respondedAt: { type: Date },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null }
  }],
  eligibility: {
    minCGPA: { type: Number, default: 0 },
    maxArrears: { type: Number, default: 10 },
    allowedDepartments: [{ type: String, trim: true }]
  },
  rounds: [{
    name: { type: String, required: true },
    order: { type: Number, required: true }
  }],
  announcements: [{
    title: { type: String, required: true, trim: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postedAt: { type: Date, default: Date.now }
  }],
  inCharges: [{
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['invited', 'accepted'], default: 'invited' },
    inviteToken: { type: String },
    inviteTokenExpiry: { type: Date },
    invitedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    assignedCompanies: [{ type: mongoose.Schema.Types.ObjectId }]
  }],
  registrationUrl: {
    type: String,
    default: ''
  },
  qrCodeUrl: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  display_id: {
    type: String,
    unique: true,
    sparse: true
  }
}, { timestamps: true });

campusDriveSchema.pre('save', async function() {
  if (!this.display_id) {
    const generateDisplayId = require('../utils/generateDisplayId');
    const year = new Date().getFullYear();
    this.display_id = await generateDisplayId('VD', year);
  }
});

module.exports = mongoose.model('CampusDrive', campusDriveSchema);
