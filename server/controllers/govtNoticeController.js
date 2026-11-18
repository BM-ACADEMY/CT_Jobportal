const mongoose = require('mongoose');
const GovtSource = require('../models/GovtSource');
const GovtNotice = require('../models/GovtNotice');
const { checkUrl } = require('../utils/fairNotice');
const { scanOne } = require('../cron/govtWatch');

const fail = (res, e, msg = 'Server error') => { console.error('Govt notices:', e.message); res.status(500).json({ msg }); };

// GET /api/admin/govt-notices  → { sources, notices (new ones first) }
const overview = async (req, res) => {
  try {
    const [sources, notices] = await Promise.all([
      GovtSource.find({}).sort({ createdAt: 1 }).lean(),
      GovtNotice.find({ status: { $in: ['new', 'posted', 'ignored'] } }).sort({ createdAt: -1 }).limit(150).populate('source', 'name').lean(),
    ]);
    notices.sort((a, b) => (a.status === 'new' ? 0 : 1) - (b.status === 'new' ? 0 : 1));
    res.json({ sources, notices });
  } catch (e) { fail(res, e); }
};

// POST /api/admin/govt-notices/sources  { name, url }
const addSource = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 120);
    if (name.length < 3) return res.status(400).json({ msg: 'Give the source a name, for example "TNPSC recruitment".' });
    const c = checkUrl(req.body?.url);
    if (c.error) return res.status(400).json({ msg: c.error });
    if (await GovtSource.findOne({ url: c.url })) return res.status(400).json({ msg: 'This page is already being watched.' });
    const source = await GovtSource.create({ name, url: c.url, createdBy: req.user.id });
    res.status(201).json(await scanOne(source).then(() => source.toObject()).catch(() => source.toObject()));
  } catch (e) { fail(res, e); }
};

// PATCH /api/admin/govt-notices/sources/:id  { active }
const setSource = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid id' });
    const s = await GovtSource.findByIdAndUpdate(req.params.id, { $set: { active: req.body?.active !== false } }, { new: true });
    if (!s) return res.status(404).json({ msg: 'Source not found' });
    res.json(s);
  } catch (e) { fail(res, e); }
};

// PATCH /api/admin/govt-notices/:id  { status: 'posted' | 'ignored' | 'new' }
const setNotice = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid id' });
    if (!['posted', 'ignored', 'new'].includes(req.body?.status)) return res.status(400).json({ msg: 'Invalid status' });
    const n = await GovtNotice.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true });
    if (!n) return res.status(404).json({ msg: 'Notice not found' });
    res.json(n);
  } catch (e) { fail(res, e); }
};

module.exports = { overview, addSource, setSource, setNotice };
