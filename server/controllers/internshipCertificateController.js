// Internship completion certificate. Models are required lazily so this file loads without a database driver.
const { isValidCode, buildCertificate } = require('../utils/internshipCertificate');

const load = async (query) => {
  const Application = require('../models/Application');
  const app = await Application.findOne(query)
    .select('status createdAt completedAt certificateCode applicant job')
    .populate('applicant', 'name')
    .populate({ path: 'job', select: 'title jobType company', populate: { path: 'company', select: 'name' } })
    .lean();
  if (!app || !app.job || app.job.jobType !== 'Internship') return null;
  return buildCertificate({ application: app, applicant: app.applicant, job: app.job, company: app.job.company });
};

// GET /api/certificates/verify/:code  (public). Only the certificate's own facts; 404 for anything else.
const verifyCertificate = async (req, res) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!isValidCode(code)) return res.status(404).json({ valid: false, msg: 'Certificate not found' });
    const cert = await load({ certificateCode: code });
    if (!cert) return res.status(404).json({ valid: false, msg: 'Certificate not found' });
    res.set('Cache-Control', 'no-store');
    return res.json({ valid: true, certificate: cert });
  } catch (err) {
    console.error('Verify certificate error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// GET /api/certificates/mine/:applicationId  (the student who did the internship)
const myCertificate = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.isValidObjectId(req.params.applicationId)) return res.status(404).json({ msg: 'Certificate not found' });
    const cert = await load({ _id: req.params.applicationId, applicant: req.user.id });
    if (!cert) return res.status(404).json({ msg: 'Certificate not found' });
    return res.json({ certificate: cert });
  } catch (err) {
    console.error('My certificate error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { verifyCertificate, myCertificate };
