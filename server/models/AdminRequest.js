const mongoose = require('mongoose');

const adminRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    required: true,
    enum: ['counselling', 'interview_prep', 'salary_benchmark']
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
  // Interview prep fields
  skills: String,
  careerGoal: String,
  // Salary benchmarking fields
  jobRole: String,
  companyName: String,
  // Admin notes
  adminNotes: String,
}, { timestamps: true });

module.exports = mongoose.model('AdminRequest', adminRequestSchema);
