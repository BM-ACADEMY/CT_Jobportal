
// India has no daylight saving, so a day is simply UTC+05:30.
const IST_MS = 5.5 * 60 * 60 * 1000;
const dayStart = (dateStr) => {
  // dateStr 'YYYY-MM-DD' (an India date) -> the instant that day starts.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]) - IST_MS);
};
const todayIst = (now = new Date()) => new Date(now.getTime() + IST_MS).toISOString().slice(0, 10);

// Admin > Applications: who applied to which job, newest first. Default is today (India time).
// Read-only. ?from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive), ?limit (max 500).
const listApplications = async (req, res) => {
  try {
    const Application = require('../models/Application');
    const from = dayStart(req.query.from) || dayStart(todayIst());
    const toDay = dayStart(req.query.to) || dayStart(todayIst());
    const to = new Date(toDay.getTime() + 24 * 60 * 60 * 1000);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 500);
    const filter = { createdAt: { $gte: from, $lt: to } };
    const [total, rows] = await Promise.all([
      Application.countDocuments(filter),
      Application.find(filter).sort({ createdAt: -1 }).limit(limit)
        .populate('applicant', 'name email profile.phone')
        .populate({ path: 'job', select: 'title company', populate: { path: 'company', select: 'name display_name' } })
        .lean(),
    ]);
    res.json({
      total,
      shown: rows.length,
      from: from.toISOString(),
      applications: rows.map((a) => ({
        _id: a._id,
        at: a.createdAt,
        status: a.status,
        applicant: a.applicant ? { _id: a.applicant._id, name: a.applicant.name, email: a.applicant.email, phone: a.applicant.profile?.phone || '' } : null,
        job: a.job ? { _id: a.job._id, title: a.job.title, company: a.job.company?.display_name || a.job.company?.name || '' } : null,
      })),
    });
  } catch (e) {
    console.error('Admin applications:', e.message);
    res.status(500).json({ msg: 'Could not load applications' });
  }
};

module.exports = { listApplications, dayStart, todayIst };
