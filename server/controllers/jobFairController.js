const mongoose = require('mongoose');
const JobFair = require('../models/JobFair');
const FairInterest = require('../models/FairInterest');
const u = require('../utils/jobFairs');
const { istDayStart } = require('../utils/driveRules');

const STATUSES = ['draft', 'published', 'closed'];
const fail = (res, err, msg = 'Server error') => { console.error('Job fair error:', err.message); res.status(500).json({ msg }); };

// ---- public
// GET /api/job-fairs?kind=government&city=...   Upcoming, live fairs, soonest first.
const listFairs = async (req, res) => {
  try {
    const q = { status: 'published', $or: [{ endDate: { $gte: istDayStart() } }, { endDate: null, date: { $gte: istDayStart() } }] };
    if (['government', 'own'].includes(req.query.kind)) q.kind = req.query.kind;
    const city = String(req.query.city || '').trim().slice(0, 60);
    if (city) { const re = new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); q.$and = [{ $or: [{ 'venue.city': re }, { 'venue.district': re }] }]; }
    const fairs = await JobFair.find(q).sort({ date: 1 }).limit(100).lean();
    const counts = await FairInterest.aggregate([{ $match: { fair: { $in: fairs.map((f) => f._id) } } }, { $group: { _id: '$fair', n: { $sum: 1 } } }]);
    const by = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    res.json(fairs.map((f) => u.publicFair(f, { going: by[String(f._id)] || 0 })));
  } catch (err) { fail(res, err); }
};

const loadPublic = (slug) => JobFair.findOne({ slug: String(slug), status: { $in: ['published', 'closed'] } }).lean();

// GET /api/job-fairs/:slug   (signed-in people also learn whether they tapped "I am going")
const getFair = async (req, res) => {
  try {
    const f = await loadPublic(req.params.slug);
    if (!f) return res.status(404).json({ msg: 'Fair not found' });
    const going = await FairInterest.countDocuments({ fair: f._id });
    const mine = req.user?.id ? !!(await FairInterest.exists({ fair: f._id, user: req.user.id })) : false;
    res.json({ ...u.publicFair(f, { going }), mine });
  } catch (err) { fail(res, err); }
};

// POST /api/job-fairs/:slug/going   Toggles. Signed-in only, so reminders have somewhere to go.
const toggleGoing = async (req, res) => {
  try {
    const f = await JobFair.findOne({ slug: String(req.params.slug), status: 'published' }).select('_id');
    if (!f) return res.status(404).json({ msg: 'Fair not found' });
    const had = await FairInterest.findOneAndDelete({ fair: f._id, user: req.user.id });
    if (!had) await FairInterest.create({ fair: f._id, user: req.user.id });
    res.json({ going: !had, count: await FairInterest.countDocuments({ fair: f._id }) });
  } catch (err) { if (err.code === 11000) return res.json({ going: true }); fail(res, err); }
};

// GET /api/job-fairs/:slug/card.svg   Poster card with our name, for WhatsApp and notice boards.
const fairCard = async (req, res) => {
  try {
    const f = await loadPublic(req.params.slug);
    if (!f) return res.status(404).json({ msg: 'Fair not found' });
    res.type('image/svg+xml').set('Cache-Control', 'public, max-age=300').send(u.fairCardSvg(f));
  } catch (err) { fail(res, err); }
};

// ---- admin (Super Admin only; mounted behind authorizeRoles('admin'))
const adminList = async (req, res) => {
  try {
    const fairs = await JobFair.find({}).sort({ date: -1 }).limit(200).lean();
    const counts = await FairInterest.aggregate([{ $group: { _id: '$fair', n: { $sum: 1 } } }]);
    const by = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    res.json(fairs.map((f) => ({ ...f, going: by[String(f._id)] || 0 })));
  } catch (err) { fail(res, err); }
};

const adminCreate = async (req, res) => {
  try {
    const { error, data } = u.cleanFairInput(req.body);
    if (error) return res.status(400).json({ msg: error });
    const status = STATUSES.includes(req.body?.status) ? req.body.status : 'draft';
    const fair = await JobFair.create({ ...data, status, slug: u.makeFairSlug(data.title), createdBy: req.user.id });
    res.status(201).json(fair);
  } catch (err) { fail(res, err); }
};

const adminUpdate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid id' });
    const set = {};
    if (req.body?.status !== undefined) { if (!STATUSES.includes(req.body.status)) return res.status(400).json({ msg: 'Invalid status' }); set.status = req.body.status; }
    if (req.body?.title !== undefined) { const { error, data } = u.cleanFairInput({ ...req.body }); if (error) return res.status(400).json({ msg: error }); Object.assign(set, data); }
    const fair = await JobFair.findByIdAndUpdate(req.params.id, { $set: set }, { new: true });
    if (!fair) return res.status(404).json({ msg: 'Fair not found' });
    res.json(fair);
  } catch (err) { fail(res, err); }
};

module.exports = { listFairs, getFair, toggleGoing, fairCard, adminList, adminCreate, adminUpdate };
