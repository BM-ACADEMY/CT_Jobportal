const Job = require('../models/Job');
const { checkSponsor, checkUrgent } = require('../utils/jobPromotion');
const SponsorPayment = require('../models/SponsorPayment');

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

module.exports = { sponsorJob, unsponsorJob, urgentJob };
