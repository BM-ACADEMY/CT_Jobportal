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
    otpExpires: { type: Date },
    loginOtp: { type: String }, // hash of the login code, never the code itself
    loginOtpExpires: { type: Date },
    otpAttempts: { type: Number, default: 0 }
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

  // Invite link for an admin added from the Admins page: only a hash of the one-time token is stored.
  invite: {
    tokenHash: { type: String },
    expiresAt: { type: Date },
  },
  // owner = full power (every admin before this existed); limited = day-to-day work only (see middlewares/adminLevel.js).
  level: { type: String, enum: ['owner', 'limited'], default: 'owner' },
  createdBy: { type: String }, // admin_id of who added this admin (empty for the first admin)

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
