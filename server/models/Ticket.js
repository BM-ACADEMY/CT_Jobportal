const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  // Raised by
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['jobseeker', 'recruiter', 'company', 'college', 'other'],
    required: true
  },
  accountIdentity: { type: String, required: true }, // User ID or email provided by user

  // Step 1 – Core Classification
  category: {
    type: String,
    enum: ['subscription_gating', 'payment_checkout', 'refunds_invoicing', 'platform_errors', 'others'],
    required: true
  },

  // Step 2 – Dynamic fields (stored as flexible object)
  diagnostics: {
    // Category A – Subscription & Plan Gating
    impactedPlan: { type: String },
    gatedFeature: { type: String },
    errorType: { type: String },

    // Category B – Payment Processing
    paymentGateway: { type: String },
    paymentMode: { type: String },
    transactionState: { type: String },

    // Category C – Refunds & Invoicing
    transactionId: { type: String },
    invoiceNumber: { type: String },
    requestedAction: { type: String },

    // Category D – Platform Errors
    impactedSubsystem: { type: String },
    environmentContext: { type: String },
    errorLogFile: { type: String }, // filename stored on server

    // Category E – Others
    areaOfConcern: { type: String },
    detailedDescription: { type: String },
    systemActionImpacted: { type: String }
  },

  // Step 3 – Submission
  severity: {
    type: String,
    enum: ['critical', 'major', 'minor'],
    required: true
  },
  diagnosticsConsent: {
    type: Boolean,
    required: true,
    default: false
  },

  // Admin management
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  conclusion: { type: String, default: '' },
  resolvedAt: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
