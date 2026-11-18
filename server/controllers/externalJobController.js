const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');
const { cleanExternalApply, isExternal } = require('../utils/externalApply');
const { cleanSalary } = require('../utils/jobFacets');
const { jobScamFlags } = require('../utils/jobScamFlags');
const { vagueLocation, VAGUE_LOCATION_MESSAGE } = require('../utils/jobLocation');

// The company the job sits under: EXTERNAL_JOBS_COMPANY_ID, else the admin's own company, else "Afra Ventures".
const hostCompany = async (adminId) => {
  if (process.env.EXTERNAL_JOBS_COMPANY_ID) return Company.findById(process.env.EXTERNAL_JOBS_COMPANY_ID).select('_id');
  const admin = await User.findById(adminId).select('company');
  if (admin?.company) return { _id: admin.company };
  return Company.findOne({ name: /^afra ventures$/i }).select('_id');
};

// POST /api/admin/external-jobs (admin only)
const createExternalJob = async (req, res) => {
  try {
    const b = req.body || {};
    const ext = cleanExternalApply({ url: b.applyUrl, employerName: b.employerName, sourceName: b.sourceName });
    if (ext.error) return res.status(400).json({ msg: ext.error });
    const title = String(b.title || '').trim();
    const description = String(b.description || '').trim();
    if (title.length < 3) return res.status(400).json({ msg: 'Job title is required.' });
    if (description.length < 30) return res.status(400).json({ msg: 'Write a short description in your own words (at least 30 characters).' });
    if (vagueLocation(b.location, b.workMode)) return res.status(400).json({ msg: VAGUE_LOCATION_MESSAGE });
    const company = await hostCompany(req.user.id);
    if (!company) return res.status(400).json({ msg: 'No company to post under. Ask Sneha to set EXTERNAL_JOBS_COMPANY_ID.' });
    const job = await Job.create({
      title, description, location: String(b.location || '').trim(),
      jobType: b.jobType || 'Full-time', workMode: b.workMode || 'On-site', vacancies: Number(b.vacancies) > 0 ? Number(b.vacancies) : 1,
      salary: cleanSalary(b.salary), status: 'active', postedAs: 'company',
      company: company._id, recruiter: req.user.id, externalApply: ext.data,
      scamFlags: jobScamFlags({ title, description })
    });
    res.status(201).json({ msg: 'Job posted. Candidates will apply on the employer\'s site.', job });
  } catch (err) {
    console.error('Create external job error:', err.message);
    res.status(500).json({ msg: 'Could not post the job.' });
  }
};

// GET /api/admin/external-jobs (admin only): list with click counts
const listExternalJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ 'externalApply.url': { $exists: true, $ne: '' } })
      .select('title location status createdAt validThrough externalApply hiddenFromPublic').sort({ createdAt: -1 }).limit(200).lean();
    res.json({ jobs });
  } catch (err) { res.status(500).json({ msg: 'Could not load the list.' }); }
};

// POST /api/jobs/:id/apply-click (public, fire and forget): counts a click on "Apply on company site"
const countExternalClick = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(String(req.params.id || ''))) return res.status(204).end();
    await Job.updateOne({ _id: req.params.id, status: 'active', 'externalApply.url': { $exists: true } }, { $inc: { 'externalApply.clicks': 1 } });
    res.status(204).end();
  } catch { res.status(204).end(); }
};

module.exports = { createExternalJob, listExternalJobs, countExternalClick, isExternal };
