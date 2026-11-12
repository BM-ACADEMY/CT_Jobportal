// Banner slots. Models are required inside the functions so this file loads without a database (tests).
const { cleanBanner, activeBannerFilter, publicBanner, PLACEMENTS } = require('../utils/banners');

const HEX = /^[0-9a-fA-F]{24}$/;

// GET /api/banners/active?placement=home-top   Public. { banner: null } when nothing is active or anything fails.
const getActiveBanner = async (req, res) => {
  try {
    const placement = PLACEMENTS.includes(req.query.placement) ? req.query.placement : 'home-top';
    const Banner = require('../models/Banner');
    const b = await Banner.findOne(activeBannerFilter(placement, new Date())).sort({ startsAt: -1 }).lean();
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ banner: publicBanner(b) });
  } catch (err) {
    console.error('Active banner error:', err.message);
    res.json({ banner: null }); // a banner must never break the Home page
  }
};

// GET /api/admin/banners   Admin only.
const listBanners = async (req, res) => {
  try {
    const Banner = require('../models/Banner');
    res.json({ banners: await Banner.find({}).sort({ startsAt: -1 }).limit(200).lean() });
  } catch (err) { console.error('List banners error:', err.message); res.status(500).json({ msg: 'Could not load banners.' }); }
};

// POST /api/admin/banners   Admin only.
const createBanner = async (req, res) => {
  try {
    const r = cleanBanner(req.body || {});
    if (r.error) return res.status(400).json({ msg: r.error });
    const Banner = require('../models/Banner');
    const banner = await Banner.create({ ...r.data, createdBy: req.user.id });
    res.status(201).json({ banner });
  } catch (err) { console.error('Create banner error:', err.message); res.status(500).json({ msg: 'Could not save the banner.' }); }
};

// PUT /api/admin/banners/:id   Admin only. Full replace of the editable fields.
const updateBanner = async (req, res) => {
  try {
    if (!HEX.test(req.params.id || '')) return res.status(404).json({ msg: 'Banner not found' });
    const r = cleanBanner(req.body || {});
    if (r.error) return res.status(400).json({ msg: r.error });
    const Banner = require('../models/Banner');
    const banner = await Banner.findByIdAndUpdate(req.params.id, { $set: r.data }, { new: true });
    if (!banner) return res.status(404).json({ msg: 'Banner not found' });
    res.json({ banner });
  } catch (err) { console.error('Update banner error:', err.message); res.status(500).json({ msg: 'Could not save the banner.' }); }
};

// DELETE /api/admin/banners/:id   Admin only.
const deleteBanner = async (req, res) => {
  try {
    if (!HEX.test(req.params.id || '')) return res.status(404).json({ msg: 'Banner not found' });
    const Banner = require('../models/Banner');
    const r = await Banner.deleteOne({ _id: req.params.id });
    if (!r.deletedCount) return res.status(404).json({ msg: 'Banner not found' });
    res.json({ ok: true });
  } catch (err) { console.error('Delete banner error:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

module.exports = { getActiveBanner, listBanners, createBanner, updateBanner, deleteBanner };
