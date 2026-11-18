const mongoose = require('mongoose');

// Messages that people send to our WhatsApp business number, and the replies we send back.
// Personal data: only readable from the admin panel; message text is never written to logs.
const whatsAppMessageSchema = new mongoose.Schema({
  direction: { type: String, enum: ['in', 'out'], required: true },
  wamid: { type: String, default: '', index: true },         // Meta's message id (inbound), used to ignore repeats
  phone: { type: String, required: true, index: true },       // last 10 digits, the key for a conversation
  fullPhone: { type: String, default: '' },                   // as Meta sent it, with country code
  name: { type: String, default: '', maxlength: 120 },        // WhatsApp profile name
  body: { type: String, default: '', maxlength: 4000 },
  kind: { type: String, default: 'text' },                    // text, image, audio, ...
  status: { type: String, enum: ['new', 'done'], default: 'new', index: true }, // inbound only
  autoAcked: { type: Boolean, default: false },               // we sent the automatic "we got it" for this one
  sentBy: { type: String, default: '' },                      // admin name for outbound
  matched: { kind: { type: String, default: '' }, name: { type: String, default: '' } },
  receivedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

whatsAppMessageSchema.index({ wamid: 1 }, { unique: true, partialFilterExpression: { wamid: { $gt: '' } } });

module.exports = mongoose.model('WhatsAppMessage', whatsAppMessageSchema);
