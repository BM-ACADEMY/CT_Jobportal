const mongoose = require('mongoose');

// A walk-in / hiring drive run by a company or recruiter (not the college campus drives). See config/driveConfig.js for plans.
const slotSchema = new mongoose.Schema({ label: { type: String, required: true, trim: true, maxlength: 40 }, capacity: { type: Number, default: 50, min: 1 } }, { _id: false });
const roleSchema = new mongoose.Schema({ title: { type: String, required: true, trim: true, maxlength: 80 }, vacancies: { type: Number, default: 1, min: 1 }, pay: { type: String, default: '', maxlength: 60 } }, { _id: false });
const addonSchema = new mongoose.Schema({
  key: { type: String, required: true },
  qty: { type: Number, default: 1, min: 1, max: 50 },
  paid: { type: Boolean, default: false },
  paidAt: Date,
  paymentNote: { type: String, default: '', maxlength: 200 },
}, { _id: false });

const walkInDriveSchema = new mongoose.Schema({
  organiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  organiserName: { type: String, default: '', maxlength: 120 },
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  template: { type: String, enum: ['walk_in', 'campus', 'bulk'], default: 'walk_in' },
  description: { type: String, default: '', maxlength: 3000 },
  roles: { type: [roleSchema], default: [] },
  venue: {
    name: { type: String, default: '', maxlength: 120 },
    address: { type: String, default: '', maxlength: 300 },
    city: { type: String, default: '', maxlength: 60 },
    mapUrl: { type: String, default: '', maxlength: 500 },
  },
  date: { type: Date, required: true, index: true },
  slots: { type: [slotSchema], default: [] },
  documents: { type: [String], default: [] },
  screeningQuestions: { type: [String], default: [] },
  plan: { type: String, enum: ['free', 'plus', 'pro'], default: 'free' },
  paid: { type: Boolean, default: false },
  paidAt: Date,
  paymentNote: { type: String, default: '', maxlength: 200 },
  addons: { type: [addonSchema], default: [] },
  status: { type: String, enum: ['pending_approval', 'published', 'rejected', 'closed'], default: 'pending_approval', index: true },
  adminNote: { type: String, default: '', maxlength: 300 },
  reviewedAt: Date,
  nextToken: { type: Number, default: 1 },
  thankYouSentAt: Date,
}, { timestamps: true });

walkInDriveSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('WalkInDrive', walkInDriveSchema);
