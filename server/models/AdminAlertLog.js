const mongoose = require('mongoose');

// Remembers which reminder or alert was already sent, so each one goes out once.
// Rows older than 90 days are removed automatically.
const adminAlertLogSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. "late:college:<id>", "overdue:ticket:<id>", "payment:<id>"
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 }
});

module.exports = mongoose.model('AdminAlertLog', adminAlertLogSchema);
