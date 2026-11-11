const mongoose = require('mongoose');

// Private feedback from signed-in users (students, recruiters, companies, colleges). Not shown publicly;
// public testimonials stay in the Review collection.
const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, default: '' },
  page: { type: String, default: '', maxlength: 200 },
  rating: { type: Number, min: 1, max: 5, required: true },
  text: { type: String, default: '', maxlength: 500 },
  // Set when the feedback comes from the "did you get what you expected?" mail after a payment.
  source: { type: String, enum: ['page', 'payment'], default: 'page', index: true },
  met: { type: String, enum: ['yes', 'partly', 'no', ''], default: '' },
  item: { type: String, default: '', maxlength: 120 },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  status: { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new', index: true }
}, { timestamps: true });

feedbackSchema.index({ payment: 1 }, { unique: true, partialFilterExpression: { payment: { $type: 'objectId' } } });

module.exports = mongoose.model('Feedback', feedbackSchema);
