// Admin WhatsApp inbox.
//   GET  /api/admin/whatsapp            conversations (newest first) with their last 30 days of messages
//   POST /api/admin/whatsapp/reply      { phone, text }  free-text reply, only inside the 24-hour window
//   PUT  /api/admin/whatsapp/:phone/done  marks that person's new messages as handled
const WhatsAppMessage = require('../models/WhatsAppMessage');
const { sendWhatsAppText } = require('../utils/whatsapp');
const { last10, windowOpen, windowClosesAt, cleanReply } = require('../utils/whatsappInbox');

const DAYS = 30;

// Groups messages by person. Pure, so it can be tested.
const groupThreads = (rows, now = new Date()) => {
  const by = new Map();
  for (const r of rows) {
    if (!by.has(r.phone)) by.set(r.phone, { phone: r.phone, name: '', matched: null, messages: [], lastInboundAt: null, newCount: 0 });
    const t = by.get(r.phone);
    t.messages.push({ id: String(r._id), direction: r.direction, body: r.body, kind: r.kind, at: r.receivedAt, status: r.status, sentBy: r.sentBy || '', autoAcked: !!r.autoAcked });
    if (r.direction === 'in') {
      if (r.name) t.name = r.name;
      if (r.matched?.name) t.matched = r.matched;
      if (!t.lastInboundAt || new Date(r.receivedAt) > new Date(t.lastInboundAt)) t.lastInboundAt = r.receivedAt;
      if (r.status === 'new') t.newCount += 1;
    }
  }
  return [...by.values()]
    .map((t) => ({ ...t, messages: t.messages.sort((a, b) => new Date(a.at) - new Date(b.at)), canReply: windowOpen(t.lastInboundAt, now), replyUntil: windowClosesAt(t.lastInboundAt) }))
    .sort((a, b) => (b.newCount > 0) - (a.newCount > 0) || new Date(b.messages.at(-1).at) - new Date(a.messages.at(-1).at));
};

const getInbox = async (req, res) => {
  try {
    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
    const rows = await WhatsAppMessage.find({ receivedAt: { $gte: since } }).sort({ receivedAt: 1 }).limit(2000).lean();
    const threads = groupThreads(rows);
    res.json({ threads, newTotal: threads.reduce((n, t) => n + t.newCount, 0) });
  } catch (err) {
    console.error('WhatsApp inbox error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const replyToThread = async (req, res) => {
  try {
    const phone = last10(req.body?.phone);
    const text = cleanReply(req.body?.text);
    if (phone.length !== 10) return res.status(400).json({ msg: 'Invalid phone number' });
    if (text.length < 2) return res.status(400).json({ msg: 'Write a reply first.' });

    const lastIn = await WhatsAppMessage.findOne({ phone, direction: 'in' }).sort({ receivedAt: -1 }).lean();
    if (!lastIn) return res.status(404).json({ msg: 'No message from this number' });
    if (!windowOpen(lastIn.receivedAt)) {
      return res.status(409).json({ code: 'WINDOW_CLOSED', msg: 'More than 24 hours since their last message. WhatsApp only allows approved templates now. Reply by phone, or wait for them to write again.' });
    }

    const result = await sendWhatsAppText({ to: lastIn.fullPhone || phone, text });
    if (!result?.ok) {
      const why = result?.reason === 'not_configured' ? 'WhatsApp sending is not set up on the server.' : 'WhatsApp did not accept the message. Try again, or call them.';
      return res.status(502).json({ msg: why });
    }
    const adminName = req.user?.name || 'Admin';
    await WhatsAppMessage.create({ direction: 'out', phone, fullPhone: lastIn.fullPhone, body: text, sentBy: adminName, status: 'done', matched: lastIn.matched });
    await WhatsAppMessage.updateMany({ phone, direction: 'in', status: 'new' }, { $set: { status: 'done' } });
    res.json({ msg: 'Reply sent' });
  } catch (err) {
    console.error('WhatsApp reply error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const markDone = async (req, res) => {
  try {
    const phone = last10(req.params.phone);
    if (phone.length !== 10) return res.status(400).json({ msg: 'Invalid phone number' });
    await WhatsAppMessage.updateMany({ phone, direction: 'in', status: 'new' }, { $set: { status: 'done' } });
    res.json({ msg: 'Marked as handled' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { getInbox, replyToThread, markDone, groupThreads };
