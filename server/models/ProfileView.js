const mongoose = require('mongoose');

const profileViewSchema = new mongoose.Schema({
  viewer: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'viewerModel'
  },
  viewerModel: {
    type: String,
    required: true,
    enum: ['User', 'Company']
  },
  viewed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ProfileView', profileViewSchema);
