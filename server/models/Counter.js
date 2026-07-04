const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  entity: { type: String, required: true },
  year: { type: Number, required: true },
  seq: { type: Number, default: 0 }
});

counterSchema.index({ entity: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);
