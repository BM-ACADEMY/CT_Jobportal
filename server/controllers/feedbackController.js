const Feedback = require('../models/Feedback');
const User = require('../models/User');

const HEX = /^[0-9a-fA-F]{24}$/;
const STATUSES = ['new', 'read', 'replied', 'closed'];

// @route POST /api/feedback   Body: { rating 1-5, text?, page? }   Signed-in users
const submitFeedback = async (req, res) => {
  try {
    const rating = Number(req.body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ msg: 'Please choose a rating from 1 to 5' });
    const text = String(req.body?.text || '').trim().slice(0, 500);
    const page = String(req.body?.page || '').trim().slice(0, 200);
    await Feedback.create({ user: req.user.id, role: String(req.user.role || ''), page, rating, text });
    res.status(201).json({ msg: 'Thank you for your feedback' });
  } catch (err) {
    console.error('Feedback error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route GET /api/feedback/admin?status=new   Super admin only
const listFeedback = async (req, res) => {
  try {
    const filter = STATUSES.includes(req.query.status) ? { status: req.query.status } : {};
    const rows = await Feedback.find(filter).sort({ createdAt: -1 }).limit(200).populate('user', 'name email').lean();
    const [counts, avg] = await Promise.all([
      Feedback.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, total: { $sum: 1 } } }])
    ]);
    res.json({
      feedback: rows.map((f) => ({ _id: f._id, rating: f.rating, text: f.text, page: f.page, role: f.role, status: f.status, createdAt: f.createdAt, name: f.user?.name || '', email: f.user?.email || '' })),
      counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
      average: avg[0] ? Math.round(avg[0].avg * 10) / 10 : null,
      total: avg[0]?.total || 0
    });
  } catch (err) {
    console.error('List feedback error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route PATCH /api/feedback/admin/:id   Body: { status }
const setFeedbackStatus = async (req, res) => {
  try {
    if (!HEX.test(String(req.params.id))) return res.status(400).json({ msg: 'Invalid feedback id' });
    if (!STATUSES.includes(req.body?.status)) return res.status(400).json({ msg: 'Invalid status' });
    const doc = await Feedback.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true }).select('status');
    if (!doc) return res.status(404).json({ msg: 'Feedback not found' });
    res.json({ msg: 'Updated', status: doc.status });
  } catch (err) {
    console.error('Feedback status error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { submitFeedback, listFeedback, setFeedbackStatus };
