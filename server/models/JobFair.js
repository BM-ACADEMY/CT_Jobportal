const mongoose = require('mongoose');

// A job fair listed on /job-fairs. `government` fairs are run by an official department: we only list them, link to the official
// registration and support them ("Supported by Velaivaaipu"). `own` fairs are ours or a partner's.
const jobFairSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  kind: { type: String, enum: ['government', 'own'], default: 'government', index: true },
  organiserName: { type: String, default: '', maxlength: 140 }, // e.g. "District Employment Office, Villupuram"
  date: { type: Date, required: true, index: true },
  endDate: { type: Date, default: null },
  venue: {
    name: { type: String, default: '', maxlength: 140 },
    address: { type: String, default: '', maxlength: 300 },
    city: { type: String, default: '', maxlength: 60 },
    district: { type: String, default: '', maxlength: 60 },
    mapUrl: { type: String, default: '', maxlength: 500 },
  },
  description: { type: String, default: '', maxlength: 3000 },
  eligibility: { type: String, default: '', maxlength: 500 },
  documents: { type: [String], default: [] },
  companies: { type: [String], default: [] }, // names, only if the official notice lists them
  officialUrl: { type: String, default: '', maxlength: 500 }, // official notice or registration page (https only)
  supportedByUs: { type: Boolean, default: true }, // shows the "Supported by Velaivaaipu" tag
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('JobFair', jobFairSchema);
