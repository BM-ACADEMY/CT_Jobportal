const mongoose = require('mongoose');

// One line of money spent. Entries are never edited or deleted: a wrong one is voided, so the record stays honest.
const spendEntrySchema = new mongoose.Schema({
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true }, // India date of the spend
  line: { type: String, enum: ['ads', 'marketing_other', 'ai', 'messaging', 'hosting_tools', 'hiring', 'other'], required: true },
  amount: { type: Number, required: true, min: 1, max: 10000000 }, // rupees, before GST unless the note says otherwise
  note: { type: String, default: '', maxlength: 200 },
  enteredBy: { type: String, default: '' },
  voided: { type: Boolean, default: false },
  voidedBy: { type: String, default: '' },
  voidedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('SpendEntry', spendEntrySchema);
