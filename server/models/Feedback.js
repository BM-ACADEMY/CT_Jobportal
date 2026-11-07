const mongoose = require('mongoose');

// Private feedback from signed-in users (students, recruiters, companies, colleges). Not shown publicly;
// public testimonials stay in the Review collection.
const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, default: '' },
  page: { type: String, default: '', maxlength: 200 },
  rating: { type: Number, min: 1, max: 5, required: true },
  text: { type: String, default: '', maxlength: 500 },
  status: { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
