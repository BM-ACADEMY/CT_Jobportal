const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  // 1. Account & Security Identity
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
  pendingEmail: {
    type: String,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  twoFactorAuth: {
    enabled: { type: Boolean, default: false },
    secret: { type: String },
    backupCodes: [{ type: String }],
    otp: { type: String },
    otpExpires: { type: Date }
  },
  profilePicture: {
    type: String,
    default: ''
  },
  
  // 2. Role & Permission Details
  role: {
    type: String,
    default: 'admin',
  },
  adminRoleType: {
    type: String,
    enum: ['Root Super Admin', 'Moderator', 'Support Admin'],
    default: 'Root Super Admin',
  },
  permissions: {
    type: [String],
    default: [],
  },
  accountStatus: {
    type: String,
    enum: ['Active', 'Suspended', 'Deactivated'],
    default: 'Active',
  },

  // 3. Audit & Tracking Context
  admin_id: {
    type: String,
    unique: true,
    default: () => 'ADM-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
  },
  lastLogin: {
    type: Date,
  },
  loginIpAddress: {
    type: String,
  },
  deviceFingerprint: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
