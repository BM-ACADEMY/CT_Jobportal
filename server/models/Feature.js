const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['jobseeker', 'recruiter', 'company']
  },
  // boolean = on/off toggle, count = numeric limit, duration = time-based limit
  type: {
    type: String,
    enum: ['boolean', 'count', 'duration'],
    default: 'boolean'
  },
  // unit label shown to user: e.g. "sessions", "interviews", "months", "days"
  unit: {
    type: String,
    default: ''
  },
  // suggested default value when admin enables this feature on a plan
  defaultValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // globally active — if false, this feature is hidden everywhere
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Feature', featureSchema);
