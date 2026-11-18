const mongoose = require('mongoose');
// Money received by hand for student packs. amount is what the college paid, GST included.
const schema = new mongoose.Schema({
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  packs: { type: Number, required: true, min: 1, max: 3 },
  students: { type: Number, required: true },
  amount: { type: Number, required: true, min: 1 },
  note: { type: String, default: '', maxlength: 200 },
  receivedAt: { type: Date, default: Date.now, index: true },
  by: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('CollegePackPayment', schema);
