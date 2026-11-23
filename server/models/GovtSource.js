const mongoose = require('mongoose');

// An official page to watch for recruitment notices (a department's "Recruitment" or "Notifications" page).
const govtSourceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  url: { type: String, required: true, trim: true, maxlength: 500, unique: true },
  active: { type: Boolean, default: true },
  lastScanAt: { type: Date, default: null },
  lastError: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('GovtSource', govtSourceSchema);
