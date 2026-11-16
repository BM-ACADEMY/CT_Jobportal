const Job = require('../models/Job');

// @route   PATCH /api/admin/jobs/:id/scam-review
// Admin marks a flagged job as checked ("looks fine"), or puts it back in the review list.
const setJobScamReviewed = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(String(id))) return res.status(400).json({ msg: 'Invalid job id' });
    if (typeof req.body?.reviewed !== 'boolean') return res.status(400).json({ msg: 'reviewed must be true or false' });
    const job = await Job.findByIdAndUpdate(id, { $set: { scamReviewed: req.body.reviewed } }, { new: true }).select('title scamFlags scamReviewed');
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    res.json({ msg: req.body.reviewed ? 'Marked as checked' : 'Back in the review list', job });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

module.exports = { setJobScamReviewed };
