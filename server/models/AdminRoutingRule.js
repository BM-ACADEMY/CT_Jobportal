const mongoose = require('mongoose');

// "New items of this type go to this person." One rule per item type.
const adminRoutingRuleSchema = new mongoose.Schema({
  kind: { type: String, enum: ['college', 'ticket', 'message', 'review', 'request', 'feedback', 'job'], required: true, unique: true },
  ownerId: { type: String, required: true },
  ownerName: { type: String, required: true, maxlength: 80 }
}, { timestamps: true });

module.exports = mongoose.model('AdminRoutingRule', adminRoutingRuleSchema);
