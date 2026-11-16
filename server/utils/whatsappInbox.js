// Pure helpers for the WhatsApp inbox, plus the one function the webhook calls (models are loaded lazily).
const WINDOW_MS = 24 * 60 * 60 * 1000;
const last10 = (v) => String(v || '').replace(/\D/g, '').slice(-10);

// Reads Meta's payload into plain messages. Anything unreadable is skipped.
const extractInbound = (body) => {
  const out = [];
  for (const entry of body?.entry || []) {
    for (const change of entry.changes || []) {
      const names = new Map((change.value?.contacts || []).map((c) => [String(c.wa_id || ''), c.profile?.name || '']));
      for (const m of change.value?.messages || []) {
        const phone = last10(m.from);
        if (phone.length !== 10) continue;
        const kind = String(m.type || 'text');
        const text = m.text?.body || m.button?.text || m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || m.image?.caption || '';
        out.push({
          wamid: String(m.id || ''), phone, fullPhone: String(m.from || ''), name: String(names.get(String(m.from || '')) || '').slice(0, 120),
          kind, body: String(text).slice(0, 4000) || (kind === 'text' ? '' : `[${kind}]`),
          receivedAt: m.timestamp ? new Date(Number(m.timestamp) * 1000) : new Date()
        });
      }
    }
  }
  return out;
};

// WhatsApp only allows free-text replies within 24 hours of the person's last message.
const windowOpen = (lastInboundAt, now = new Date()) => !!lastInboundAt && now.getTime() - new Date(lastInboundAt).getTime() < WINDOW_MS;
const windowClosesAt = (lastInboundAt) => (lastInboundAt ? new Date(new Date(lastInboundAt).getTime() + WINDOW_MS) : null);

const cleanReply = (v) => (typeof v === 'string' ? v.trim().slice(0, 1000) : '');

const ACK_TEXT = 'Thanks, we received your message. Our team will reply here within 24 hours. - Velaivaaipu';

// Saves each inbound message once, sends one automatic acknowledgement per person per 24 hours, and tells the admins.
// `deps` lets tests pass fakes. Never throws for one bad message.
const recordInbound = async (messages, deps = {}) => {
  const Msg = deps.WhatsAppMessage || require('../models/WhatsAppMessage');
  const sendText = deps.sendText || require('./whatsapp').sendWhatsAppText;
  const notify = deps.notifyAdmins || ((n) => require('./inAppNotifications').notifyRoles({ roles: ['admin'], ...n }));
  const findMatch = deps.findMatch || (async () => null);
  const now = deps.now || new Date();
  const saved = [];

  for (const m of messages) {
    try {
      if (m.wamid && await Msg.findOne({ wamid: m.wamid }).select('_id').lean()) continue; // Meta repeats deliveries
      const matched = await findMatch(m.phone).catch(() => null);
      const recentAck = await Msg.findOne({ phone: m.phone, direction: 'in', autoAcked: true, receivedAt: { $gte: new Date(now.getTime() - WINDOW_MS) } }).select('_id').lean();
      const doc = await Msg.create({ direction: 'in', ...m, matched: matched || undefined, status: 'new', autoAcked: false });
      saved.push(doc);

      if (!recentAck) {
        const r = await sendText({ to: m.fullPhone || m.phone, text: ACK_TEXT });
        if (r?.ok) await Msg.updateOne({ _id: doc._id }, { $set: { autoAcked: true } });
      }
      notify({
        title: 'New WhatsApp message',
        message: `${matched?.name || m.name || m.phone}: ${m.body.slice(0, 80)}`,
        type: 'whatsapp_inbound', link: '/admin/whatsapp'
      }).catch((err) => console.error('[WhatsApp] admin alert failed:', err.message));
    } catch (err) {
      console.error('[WhatsApp] could not save an inbound message:', err.message);
    }
  }
  return saved;
};

module.exports = { WINDOW_MS, last10, extractInbound, windowOpen, windowClosesAt, cleanReply, recordInbound, ACK_TEXT };
