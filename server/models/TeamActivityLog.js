const mongoose = require('mongoose');

const teamActivityLogSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Denormalized so the activity list never needs a populate to render.
  actorName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['job_posted', 'application_status_changed', 'message_sent', 'interview_scheduled'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  entity: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityModel'
  },
  entityModel: {
    type: String,
    enum: ['Job', 'Application', 'Message', 'Interview']
  }
}, { timestamps: true });

teamActivityLogSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('TeamActivityLog', teamActivityLogSchema);
