const mongoose = require('mongoose');

// A recruitment notice found on a watched page. 'new' waits for the admin; 'posted' became a job; 'ignored' was dismissed;
// 'baseline' was already on the page when the source was first added, so it is not shown.
const govtNoticeSchema = new mongoose.Schema({
  source: { type: mongoose.Schema.Types.ObjectId, ref: 'GovtSource', required: true, index: true },
  title: { type: String, required: true, maxlength: 200 },
  url: { type: String, required: true, maxlength: 600 },
  fingerprint: { type: String, required: true },
  status: { type: String, enum: ['new', 'posted', 'ignored', 'baseline'], default: 'new', index: true },
}, { timestamps: true });
govtNoticeSchema.index({ source: 1, fingerprint: 1 }, { unique: true });

module.exports = mongoose.model('GovtNotice', govtNoticeSchema);
