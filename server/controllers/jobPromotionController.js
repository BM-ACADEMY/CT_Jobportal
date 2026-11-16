const Job = require('../models/Job');
const { checkSponsor, checkUrgent } = require('../utils/jobPromotion');
const SponsorPayment = require('../models/SponsorPayment');
const User = require('../models/User');
const { SPONSOR_PACKS, findSponsorPack, sponsorBlockedByFlags } = require('../utils/sponsorAddon');

const HEX = /^[0-9a-fA-F]{24}$/;
const load = async (id) => (HEX.test(id || '') ? Job.findById(id).populate('company', 'is_verified name') : null);

// POST /api/admin/jobs/:id/sponsor {days, note}   Super Admin. Starts a sponsorship after payment was received by hand.
const sponsorJob = async (req, res) => {
  try {
    const job = await load(req.params.id); if (!job) return res.status(404).json({ msg: 'Job not found' });
    const activeOthers = await Job.countDocuments({ _id: { $ne: job._id }, status: 'active', sponsoredUntil: { $gt: new Date() } });
    const r = checkSponsor({ job, days: req.body?.days, note: req.body?.note, amount: req.body?.amount, activeOthers });
    if (r.error) return res.status(400).json({ msg: r.error });
    job.sponsoredUntil = r.until; job.sponsoredNote = r.note; await job.save();
    // Keep the money so Total Revenue, Spend and income and the advisor can count it.
    if (r.amount) await SponsorPayment.create({ job: job._id, amount: r.amount, days: r.days, note: r.note, by: req.user?.name || '' });
    res.json({ sponsoredUntil: job.sponsoredUntil, amountRecorded: r.amount || null });
  } catch (err) { console.error('Sponsor job:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

// POST /api/jobs/:id/sponsor-addon {packKey?}   A company or recruiter uses a Sponsored add-on it bought on one of its live jobs.
const sponsorMyJob = async (req, res) => {
  try {
    const job = await load(req.params.id); if (!job) return res.status(404).json({ msg: 'Job not found' });
    const me = await User.findById(req.user.id).select('company purchasedFeatures');
    if (!me) return res.status(404).json({ msg: 'Account not found' });
    const mine = String(job.recruiter) === String(me._id) || (me.company && String(job.company?._id || job.company) === String(me.company));
    if (!mine) return res.status(403).json({ msg: 'You can only sponsor your own jobs' });
    if (job.sponsoredUntil && new Date(job.sponsoredUntil) > new Date()) return res.status(400).json({ msg: 'This job is already sponsored' });
    if (sponsorBlockedByFlags(job)) return res.status(400).json({ msg: 'This job is waiting for our team to check it. It can be sponsored once it is cleared.' });
    const pack = findSponsorPack(me.purchasedFeatures, String(req.body?.packKey || ''));
    if (!pack) return res.status(402).json({ msg: 'Buy a Sponsored add-on first', code: 'no_sponsor_pack' });
    const activeOthers = await Job.countDocuments({ _id: { $ne: job._id }, status: 'active', sponsoredUntil: { $gt: new Date() } });
    const r = checkSponsor({ job, days: SPONSOR_PACKS[pack.featureKey], note: 'Bought as an add-on', activeOthers });
    if (r.error) return res.status(400).json({ msg: r.error }); // nothing is used up when the slots are full
    // Use one unit atomically so two taps cannot spend the same pack twice.
    const used = await User.updateOne({ _id: me._id, purchasedFeatures: { $elemMatch: { _id: pack._id, usageLeft: { $gt: 0 } } } }, { $inc: { 'purchasedFeatures.$.usageLeft': -1 } });
    if (!used.modifiedCount) return res.status(409).json({ msg: 'That add-on was just used. Please try again.' });
    try {
      job.sponsoredUntil = r.until; job.sponsoredNote = r.note; await job.save();
    } catch (e) {
      await User.updateOne({ _id: me._id, 'purchasedFeatures._id': pack._id }, { $inc: { 'purchasedFeatures.$.usageLeft': 1 } });
      throw e;
    }
    res.json({ sponsoredUntil: job.sponsoredUntil, days: r.days });
  } catch (err) { console.error('Sponsor my job:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

// POST /api/admin/jobs/:id/unsponsor
const unsponsorJob = async (req, res) => {
  try {
    const job = await load(req.params.id); if (!job) return res.status(404).json({ msg: 'Job not found' });
    job.sponsoredUntil = null; await job.save(); res.json({ ok: true });
  } catch (err) { console.error('Unsponsor job:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

// POST /api/admin/jobs/:id/urgent {days}  (days 0 clears it)
const urgentJob = async (req, res) => {
  try {
    const job = await load(req.params.id); if (!job) return res.status(404).json({ msg: 'Job not found' });
    if (Number(req.body?.days) === 0) { job.urgentUntil = null; await job.save(); return res.json({ urgentUntil: null }); }
    const r = checkUrgent({ job, days: req.body?.days });
    if (r.error) return res.status(400).json({ msg: r.error });
    job.urgentUntil = r.until; await job.save(); res.json({ urgentUntil: job.urgentUntil });
  } catch (err) { console.error('Urgent job:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

module.exports = { sponsorMyJob, sponsorJob, unsponsorJob, urgentJob };
