const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');
const { hasCompanyAccess } = require('../utils/companyAccess');

const HEX = /^[0-9a-fA-F]{24}$/;

// POST /api/jobs/:id/renew : the owner keeps an older job on the public list for another 45 days.
const renewJob = async (req, res) => {
  try {
    if (!HEX.test(req.params.id)) return res.status(400).json({ msg: 'Bad job id' });
    const [user, job] = await Promise.all([User.findById(req.user.id), Job.findById(req.params.id)]);
    if (!job || !user) return res.status(404).json({ msg: 'Job not found' });
    const owner = job.recruiter.toString() === req.user.id
      || (user.company && job.company && job.company.toString() === user.company.toString() && hasCompanyAccess(user));
    if (!owner) return res.status(403).json({ msg: 'Not authorized to renew this job' });
    if (job.status !== 'active') return res.status(400).json({ msg: 'Only an active job can be renewed' });
    job.renewedAt = new Date();
    await job.save();
    res.json({ renewedAt: job.renewedAt });
  } catch (e) { console.error('Renew job:', e.message); res.status(500).json({ msg: 'Server error' }); }
};

// PATCH /api/admin/jobs/:id/hide and /api/admin/companies/:id/hide  {hidden: boolean}   (Super Admin only)
const setHidden = (Model) => async (req, res) => {
  try {
    if (!HEX.test(req.params.id)) return res.status(400).json({ message: 'Bad id' });
    if (typeof req.body?.hidden !== 'boolean') return res.status(400).json({ message: 'Send hidden as true or false' });
    const doc = await Model.findByIdAndUpdate(req.params.id, { $set: { hiddenFromPublic: req.body.hidden } }, { new: true }).select('hiddenFromPublic');
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ hiddenFromPublic: doc.hiddenFromPublic });
  } catch (e) { console.error('Hide:', e.message); res.status(500).json({ message: 'Server error' }); }
};

module.exports = { renewJob, hideJob: setHidden(Job), hideCompany: setHidden(Company) };
