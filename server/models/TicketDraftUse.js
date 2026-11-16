const mongoose = require('mongoose');
// One row per AI draft asked for on a ticket. Counted with the Advisor against the shared monthly AI limit.
const schema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  by: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });
module.exports = mongoose.model('TicketDraftUse', schema);
