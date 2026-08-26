const mongoose = require('mongoose');

const collegeEmployerSchema = new mongoose.Schema({
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  name: { type: String, required: true, trim: true },
  industry: { type: String, trim: true, default: '' },
  website: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['prospect', 'contacted', 'active', 'inactive'], default: 'prospect' },
  contacts: [{ name: String, designation: String, email: String, phone: String }],
  lastContactedAt: { type: Date },
  nextFollowUpAt: { type: Date },
  notes: { type: String, default: '' },
  scorecards: [{
    drive: { type: mongoose.Schema.Types.ObjectId, ref: 'CampusDrive' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'CollegeStudent' },
    interviewer: { type: String, trim: true, default: '' },
    technical: { type: Number, min: 0, max: 5, default: 0 },
    communication: { type: Number, min: 0, max: 5, default: 0 },
    problemSolving: { type: Number, min: 0, max: 5, default: 0 },
    recommendation: { type: String, enum: ['strong_hire', 'hire', 'hold', 'no_hire'], default: 'hold' },
    comments: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

collegeEmployerSchema.index({ college: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('CollegeEmployer', collegeEmployerSchema);
