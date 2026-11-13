const mongoose = require('mongoose');

// One person registered for one walk-in drive. `code` is what the check-in QR carries.
const driveRegistrationSchema = new mongoose.Schema({
  drive: { type: mongoose.Schema.Types.ObjectId, ref: 'WalkInDrive', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true, lowercase: true, maxlength: 120 },
  slot: { type: String, default: '', maxlength: 40 },
  answers: { type: [{ question: String, answer: String }], default: [] },
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['registered', 'checked_in', 'shortlisted', 'selected', 'on_hold', 'not_selected'], default: 'registered' },
  tokenNumber: { type: Number },
  checkedInAt: Date,
  note: { type: String, default: '', maxlength: 300 },
  joiningDate: Date,
  remindedDayBefore: { type: Boolean, default: false },
  remindedMorning: { type: Boolean, default: false },
}, { timestamps: true });

driveRegistrationSchema.index({ drive: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('DriveRegistration', driveRegistrationSchema);
