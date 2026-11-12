const mongoose = require('mongoose');

// A company's request for a stall at one of OUR OWN fairs. Admin approves or declines; approved stalls get checked in on the day.
// No price is stored here: the stall price (if any) is the Settings field `fairStallPrice`, which stays blank until decided.
const fairStallSchema = new mongoose.Schema({
  fair: { type: mongoose.Schema.Types.ObjectId, ref: 'JobFair', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  name: { type: String, required: true, trim: true, maxlength: 140 },
  contactName: { type: String, default: '', maxlength: 100 },
  phone: { type: String, default: '', maxlength: 20 },
  email: { type: String, default: '', maxlength: 120 },
  need: { type: String, default: '', maxlength: 500 }, // e.g. "one table, 3 hiring roles"
  status: { type: String, enum: ['requested', 'approved', 'declined'], default: 'requested', index: true },
  checkedInAt: { type: Date, default: null },
}, { timestamps: true });
fairStallSchema.index({ fair: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('FairStall', fairStallSchema);
