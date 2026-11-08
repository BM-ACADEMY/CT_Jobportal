const mongoose = require('mongoose');

// A signed-in user saying a job looks wrong. One report per person per job. Reports never hide a job;
// they put it in the admin review list (see controllers/jobReportController.js).
const jobReportSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, enum: ['asks_for_money', 'fake_company', 'wrong_details', 'other'], required: true },
  note: { type: String, default: '', maxlength: 300 },
}, { timestamps: { createdAt: true, updatedAt: false } });

jobReportSchema.index({ job: 1, reporter: 1 }, { unique: true });

module.exports = mongoose.model('JobReport', jobReportSchema);
