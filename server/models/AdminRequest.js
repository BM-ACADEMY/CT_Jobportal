const mongoose = require('mongoose');

const adminRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    required: true,
    enum: ['counselling', 'mock_interview', 'website_request', 'ai_resume_review', 'student_pack', 'college_call', 'college_upgrade', 'help_request', 'company_proof']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Counselling booking fields
  bookingName: String,
  bookingEmail: String,
  bookingPhone: String,
  bookingDate: String,
  bookingTime: String,
  qualification: String,
  major: String,
  workExperience: String,
  notes: String,
  // Mock interview fields
  skills: String,
  careerGoal: String,
  mockInterviewDate: String,
  mockInterviewTime: String,
  // Website request fields
  websiteDetails: String,
  websiteGoal: String,
  targetAudience: String,
  // Student pack request (college dashboard)
  packs: Number,
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
  // Company proof (free-email companies): what the company sent so an admin can verify it. See controllers/companyProofController.js
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  proofType: { type: String, enum: ['', 'gst', 'registration', 'website', 'linkedin'], default: '' },
  proofValue: { type: String, default: '', maxlength: 300 },
  proofFile: { type: String, default: '' },
  // Admin notes
  adminNotes: String,
  // Help button: the page the person was on when they asked for help (the message itself is in `notes`).
  pageUrl: { type: String, default: '', maxlength: 300 },
  // Scheduled Meeting Details (set by recruiter upon accept)
  meetingDate: String,
  meetingStartTime: String,
  meetingEndTime: String,
  meetingLink: String,
  
  // Slot selection for Mock Interviews / Counselling
  slot1Date: String,
  slot1StartTime: String,
  slot1EndTime: String,
  slot2Date: String,
  slot2StartTime: String,
  slot2EndTime: String,
  selectedSlot: String, // '1' or '2'
  // Assignment to recruiter/company pool (for multiple assignment)
  assignedToPool: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // The user who ultimately accepted the request
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedAt: { type: Date, default: null },
  // Set when the one-time "how was your session?" message was sent.
  reviewAskedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('AdminRequest', adminRequestSchema);
