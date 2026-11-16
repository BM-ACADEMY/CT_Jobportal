const mongoose = require('mongoose');

// Money received by hand (UPI or bank) for a sponsored job. One row per sponsorship, so revenue totals can count it.
// amount is what the company paid, GST included.
const sponsorPaymentSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  amount: { type: Number, required: true, min: 1, max: 500000 },
  days: { type: Number, default: 0 },
  note: { type: String, default: '', maxlength: 200 },
  receivedAt: { type: Date, default: Date.now, index: true },
  by: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('SponsorPayment', sponsorPaymentSchema);
