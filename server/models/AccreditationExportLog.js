const mongoose = require('mongoose');

const accreditationExportLogSchema = new mongoose.Schema({
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  exportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicYear: { type: String, required: true },
  departments: [{ type: String }],
  format: { type: String, enum: ['xlsx', 'csv'], required: true },
  recordCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('AccreditationExportLog', accreditationExportLogSchema);
