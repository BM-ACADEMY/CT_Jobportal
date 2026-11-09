const mongoose = require('mongoose');
// The team's follow-up on one person for one brand. The lead itself is worked out live from portal data.
const brandLeadSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: String, enum: ['academy', 'coretalents'], required: true },
  status: { type: String, enum: ['new', 'called', 'interested', 'not_interested'], default: 'new' },
  note: { type: String, default: '', maxlength: 300 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
brandLeadSchema.index({ user: 1, brand: 1 }, { unique: true });
module.exports = mongoose.model('BrandLead', brandLeadSchema);
