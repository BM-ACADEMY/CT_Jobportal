const mongoose = require('mongoose');

// Who owns an item that is waiting for an admin. The item itself (a college, ticket, message...) stays in its own
// collection; this only records the owner, so nothing in those collections changes.
const adminAssignmentSchema = new mongoose.Schema({
  kind: { type: String, enum: ['college', 'ticket', 'message', 'review', 'request', 'feedback', 'drive', 'idea', 'job', 'whatsapp'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true },
  ownerId: { type: String, required: true },
  ownerName: { type: String, required: true, maxlength: 80 },
  assignedBy: { type: String, default: '' }
}, { timestamps: true });

adminAssignmentSchema.index({ kind: 1, refId: 1 }, { unique: true });

module.exports = mongoose.model('AdminAssignment', adminAssignmentSchema);
