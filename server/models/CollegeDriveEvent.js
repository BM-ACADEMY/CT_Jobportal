const mongoose = require('mongoose');

const collegeDriveEventSchema = new mongoose.Schema({
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  drive: { type: mongoose.Schema.Types.ObjectId, ref: 'CampusDrive', required: true, index: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['pre_placement_talk', 'test', 'interview', 'document_verification', 'other'], default: 'other' },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  venue: { type: String, trim: true, default: '' },
  coordinator: { type: String, trim: true, default: '' },
  reminderSentAt: { type: Date },
  checkInToken: { type: String, required: true, unique: true },
  qrCodeUrl: { type: String, default: '' },
  attendance: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'CollegeStudent', required: true },
    checkedInAt: { type: Date, default: Date.now },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

collegeDriveEventSchema.index({ college: 1, startsAt: 1 });
collegeDriveEventSchema.index({ 'attendance.student': 1 });
module.exports = mongoose.model('CollegeDriveEvent', collegeDriveEventSchema);
