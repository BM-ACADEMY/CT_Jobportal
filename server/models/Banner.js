const mongoose = require('mongoose');

// A banner slot on the Home page (utils/banners.js). Admin-only to manage; the public only ever reads the active one.
const bannerSchema = new mongoose.Schema({
  placement: { type: String, enum: ['home-top'], default: 'home-top', index: true },
  imageUrl: { type: String, required: true, maxlength: 500 },
  linkUrl: { type: String, required: true, maxlength: 500 },
  altText: { type: String, default: '', maxlength: 150 },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

bannerSchema.index({ placement: 1, startsAt: 1, endsAt: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
