// Government jobs. Models are required inside the functions so this file loads without a database (tests).
const { cleanGovernmentJob, openGovernmentFilter, publicShape } = require('../utils/governmentJobs');

const HEX = /^[0-9a-fA-F]{24}$/;
const esc = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/admin/government-jobs   Super Admin or staff with government_jobs (gate is on the route).
const createGovernmentJob = async (req, res) => {
  try {
    const r = cleanGovernmentJob(req.body || {});
    if (r.error) return res.status(400).json({ msg: r.error });
    const Job = require('../models/Job');
    const d = r.data;
    const job = await Job.create({
      title: d.title, description: d.description, location: d.location, vacancies: d.vacancies, jobType: d.jobType, workMode: 'On-site',
      status: 'active', postedAs: 'recruiter', recruiter: req.user.id, // no company: it never shows on a company job list
      isGovernment: true, department: d.department, lastDate: d.lastDate, notificationUrl: d.notificationUrl, validThrough: d.lastDate,
    });
    res.status(201).json({ msg: 'Government job posted.', job: publicShape(job) });
  } catch (err) {
    console.error('Create government job error:', err.message);
    res.status(500).json({ msg: 'Could not post the job.' });
  }
};

// GET /api/admin/government-jobs   everything posted, newest first, with whether it is still showing.
const listGovernmentJobsAdmin = async (req, res) => {
  try {
    const Job = require('../models/Job');
    const now = new Date();
    const jobs = await Job.find({ isGovernment: true }).sort({ createdAt: -1 }).limit(300).lean();
    res.json({ jobs: jobs.map((j) => ({ ...publicShape(j), status: j.status, showing: j.status === 'active' && !!j.lastDate && new Date(j.lastDate) >= now })) });
  } catch (err) {
    console.error('List government jobs error:', err.message);
    res.status(500).json({ msg: 'Could not load the list.' });
  }
};

// PATCH /api/admin/government-jobs/:id/close   takes it off the public page now.
const closeGovernmentJob = async (req, res) => {
  try {
    if (!HEX.test(req.params.id || '')) return res.status(404).json({ msg: 'Job not found' });
    const Job = require('../models/Job');
    const r = await Job.updateOne({ _id: req.params.id, isGovernment: true }, { $set: { status: 'closed' } });
    if (!r.matchedCount) return res.status(404).json({ msg: 'Job not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Close government job error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// GET /api/government-jobs?q=   Public. Only jobs whose last date has not passed.
const listGovernmentJobsPublic = async (req, res) => {
  try {
    const Job = require('../models/Job');
    const filter = openGovernmentFilter(new Date());
    const q = String(req.query.q || '').trim().slice(0, 60);
    if (q) filter.$or = [{ title: { $regex: esc(q), $options: 'i' } }, { department: { $regex: esc(q), $options: 'i' } }];
    const jobs = await Job.find(filter).sort({ lastDate: 1 }).limit(200).lean();
    res.json({ jobs: jobs.map(publicShape) });
  } catch (err) {
    console.error('Public government jobs error:', err.message);
    res.status(500).json({ msg: 'Could not load government jobs.' });
  }
};

module.exports = { createGovernmentJob, listGovernmentJobsAdmin, closeGovernmentJob, listGovernmentJobsPublic };
