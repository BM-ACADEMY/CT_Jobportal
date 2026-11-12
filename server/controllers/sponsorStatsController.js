// Sponsored buyers report: views and clicks per sponsored job, and the company's own report of them.
// Models are required inside the functions so this file loads without a database (tests).
// Counting must never break a page: every failure answers 204 and is only logged.
const HEX = /^[0-9a-fA-F]{24}$/;
const FIELD = { view: 'sponsorViews', click: 'sponsorClicks' };

// POST /api/jobs/:id/sponsor-event   Body: { event: 'view' | 'click' }   Public, fire-and-forget from the job card.
// The browser sends each (job, event) once per session. Only a job that is sponsored right now is counted.
const recordSponsorEvent = async (req, res) => {
  try {
    const field = FIELD[req.body?.event];
    if (!field || !HEX.test(req.params.id || '')) return res.sendStatus(204);
    const Job = require('../models/Job');
    await Job.updateOne({ _id: req.params.id, status: 'active', sponsoredUntil: { $gt: new Date() } }, { $inc: { [field]: 1 } });
  } catch (err) {
    console.error('Sponsor event error:', err.message);
  }
  res.sendStatus(204);
};

// One row per job that has been sponsored, for the report. Pure, so it is easy to test.
const reportRow = (j, now = new Date()) => ({
  _id: j._id, title: j.title, sponsoredUntil: j.sponsoredUntil || null,
  active: !!j.sponsoredUntil && new Date(j.sponsoredUntil) > now,
  views: j.sponsorViews || 0, clicks: j.sponsorClicks || 0, applies: j.applicantsCount || 0,
});

// GET /api/jobs/sponsored-report   The signed-in company or recruiter's own sponsored jobs.
const getSponsoredReport = async (req, res) => {
  try {
    const Job = require('../models/Job');
    const User = require('../models/User');
    const { hasCompanyAccess } = require('../utils/companyAccess');
    const user = await User.findById(req.user.id).populate('subscription').populate('role');
    if (!user) return res.json({ jobs: [] });
    // Same ownership rule as the company job list.
    const own = user.company && hasCompanyAccess(user) ? { $or: [{ company: user.company }, { recruiter: req.user.id }] } : { recruiter: req.user.id };
    const jobs = await Job.find({ $and: [own, { sponsoredUntil: { $ne: null } }] }).sort({ sponsoredUntil: -1 }).limit(100).lean();
    const now = new Date();
    res.json({ jobs: jobs.map((j) => reportRow(j, now)) });
  } catch (err) {
    console.error('Sponsored report error:', err.message);
    res.status(500).json({ msg: 'Could not load the sponsored report.' });
  }
};

module.exports = { recordSponsorEvent, getSponsoredReport, reportRow };
