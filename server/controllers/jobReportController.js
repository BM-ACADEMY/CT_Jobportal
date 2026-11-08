const Job = require('../models/Job');
const JobReport = require('../models/JobReport');

const HEX = /^[0-9a-fA-F]{24}$/;
const REASONS = ['asks_for_money', 'fake_company', 'wrong_details', 'other'];

// @route POST /api/jobs/:id/report   Body: { reason, note? }   Signed-in users
// The job stays visible. It goes into the admin review list (same list as the automatic scam flags),
// and comes back to it even if an admin had marked it fine earlier.
const reportJob = async (req, res) => {
  try {
    const { id } = req.params;
    if (!HEX.test(String(id))) return res.status(400).json({ msg: 'Invalid job id' });
    const reason = String(req.body?.reason || '');
    if (!REASONS.includes(reason)) return res.status(400).json({ msg: 'Please choose a reason' });
    const note = String(req.body?.note || '').trim().slice(0, 300);

    const job = await Job.findById(id).select('recruiter status');
    if (!job || job.status !== 'active') return res.status(404).json({ msg: 'Job not found' });
    if (String(job.recruiter) === String(req.user.id)) return res.status(400).json({ msg: 'You cannot report your own job' });

    try {
      await JobReport.create({ job: id, reporter: req.user.id, reason, note });
    } catch (err) {
      if (err && err.code === 11000) return res.json({ msg: 'You have already reported this job. Our team will check it.' });
      throw err;
    }
    await Job.updateOne({ _id: id }, { $inc: { reportCount: 1 }, $addToSet: { scamFlags: 'reported_by_users' }, $set: { scamReviewed: false } });
    res.status(201).json({ msg: 'Thank you. Our team will check this job.' });
  } catch (err) {
    console.error('Report job error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { reportJob, REASONS };
