const SpendEntry = require('../models/SpendEntry');
const Payment = require('../models/Payment');
const { buildSpendSummary, LINES, istDate } = require('../utils/spendSummary');
const WalkInDrive = require('../models/WalkInDrive');
const SponsorPayment = require('../models/SponsorPayment');
const { manualPaymentRows, sponsorRows, asPayments } = require('../utils/manualIncome');

const HEX = /^[0-9a-fA-F]{24}$/;

// @route GET /api/admin/spend?days=14   Super admin only
const getSpend = async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 14));
    const now = new Date();
    const since = new Date(now.getTime() - 120 * 86400000);
    const [entries, onlinePayments, drives, sponsorPays] = await Promise.all([
      SpendEntry.find({ createdAt: { $gte: since } }).sort({ date: -1, createdAt: -1 }).limit(1000).lean(),
      Payment.find({ status: 'completed', createdAt: { $gte: since } }).select('amount baseAmount status createdAt').lean(),
      WalkInDrive.find({ $or: [{ paid: true }, { 'addons.paid': true }] }).select('plan paid paidAt addons').lean().catch(() => []),
      SponsorPayment.find({ receivedAt: { $gte: since } }).select('amount receivedAt').lean().catch(() => [])
    ]);
    const payments = [...onlinePayments, ...asPayments([...manualPaymentRows(drives, { from: since }), ...sponsorRows(sponsorPays, { from: since })])]; // online plus paid-by-hand
    const summary = buildSpendSummary({ entries, payments, now, days });
    res.json({
      ...summary,
      lines: LINES,
      entries: entries.slice(0, 60).map((e) => ({ _id: e._id, date: e.date, line: e.line, amount: e.amount, note: e.note, voided: !!e.voided }))
    });
  } catch (err) {
    console.error('Spend summary error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route POST /api/admin/spend   Body: { date, line, amount, note }
const addSpend = async (req, res) => {
  try {
    const { date, line, amount, note } = req.body || {};
    const today = istDate(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || String(date) > today) return res.status(400).json({ msg: 'Pick a date that is today or earlier' });
    if (!Object.keys(LINES).includes(line)) return res.status(400).json({ msg: 'Pick a spend type' });
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 1 || value > 10000000) return res.status(400).json({ msg: 'Enter an amount in rupees' });
    const entry = await SpendEntry.create({ date, line, amount: Math.round(value * 100) / 100, note: String(note || '').trim().slice(0, 200), enteredBy: String(req.user.id) });
    res.status(201).json({ msg: 'Saved', entry: { _id: entry._id, date: entry.date, line: entry.line, amount: entry.amount, note: entry.note } });
  } catch (err) {
    console.error('Add spend error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route PATCH /api/admin/spend/:id/void   A wrong entry is voided, never edited or deleted.
const voidSpend = async (req, res) => {
  try {
    if (!HEX.test(String(req.params.id))) return res.status(400).json({ msg: 'Invalid entry' });
    const entry = await SpendEntry.findByIdAndUpdate(req.params.id, { $set: { voided: true, voidedBy: String(req.user.id), voidedAt: new Date() } }, { new: true });
    if (!entry) return res.status(404).json({ msg: 'Entry not found' });
    res.json({ msg: 'Entry voided' });
  } catch (err) {
    console.error('Void spend error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getSpend, addSpend, voidSpend };
