const mongoose = require('mongoose');

const collegePlacementReportSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  frequency: {
    type: String,
    enum: ['monthly', 'weekly'],
    required: true
  },
  periodLabel: {
    type: String,
    required: true
  },
  reportUrl: {
    type: String,
    required: true
  },
  stats: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  sentToPrincipal: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

collegePlacementReportSchema.index({ college: 1, createdAt: -1 });

module.exports = mongoose.model('CollegePlacementReport', collegePlacementReportSchema);
