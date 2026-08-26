const mongoose = require('mongoose');

const collegeActivityLogSchema = new mongoose.Schema({
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, required: true },
  action: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  entityType: { type: String, enum: ['student', 'drive', 'team', 'college'], default: 'college' },
  entity: { type: mongoose.Schema.Types.ObjectId },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

collegeActivityLogSchema.index({ college: 1, createdAt: -1 });
module.exports = mongoose.model('CollegeActivityLog', collegeActivityLogSchema);
