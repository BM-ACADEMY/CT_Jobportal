const Job = require('../models/Job');
const Application = require('../models/Application');
const WalkInDrive = require('../models/WalkInDrive');
const DriveRegistration = require('../models/DriveRegistration');
const Company = require('../models/Company');
const College = require('../models/College');
const User = require('../models/User');
const { shapeOverview } = require('../utils/servicesOverview');

// GET /api/admin/services-overview : one page of numbers for every service (Super Admin only).
const getServicesOverview = async (req, res) => {
  try {
    const now = new Date();
    const intJobs = await Job.find({ jobType: 'Internship' }).select('_id company status internship').lean();
    const intIds = intJobs.map((j) => j._id);
    const live = intJobs.filter((j) => j.status === 'active');
    const [apps, drivesTotal, drivesPending, drivesPublished, drivesPaid, driveRegistrations, sponsoredJobs, urgentJobs,
      logoAgreed, logoApproved, collegeLogoApproved, waOptIns, referred] = await Promise.all([
      intIds.length ? Application.find({ job: { $in: intIds } }).select('applicant job status').lean() : [],
      WalkInDrive.countDocuments({}), WalkInDrive.countDocuments({ status: 'pending_approval' }),
      WalkInDrive.countDocuments({ status: 'published' }), WalkInDrive.countDocuments({ paid: true }),
      DriveRegistration.countDocuments({}),
      Job.countDocuments({ sponsoredUntil: { $gt: now } }), Job.countDocuments({ urgentUntil: { $gt: now } }),
      Company.countDocuments({ showLogo: true }), Company.countDocuments({ logoApproved: true }),
      College.countDocuments({ logoApproved: true }),
      User.countDocuments({ 'whatsapp.optIn': true }), User.countDocuments({ referredBy: { $ne: null } }),
    ]);
    const perCompany = {};
    intJobs.forEach((j) => { const k = String(j.company); perCompany[k] = (perCompany[k] || 0) + 1; });
    const topIds = Object.entries(perCompany).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const names = topIds.length ? await Company.find({ _id: { $in: topIds.map(([id]) => id) } }).select('name').lean() : [];
    const nameOf = Object.fromEntries(names.map((c) => [String(c._id), c.name]));
    res.json(shapeOverview({
      internshipsLive: live.length, internshipsFree: live.filter((j) => j.internship && j.internship.free).length,
      internshipApps: apps.length, internshipStudents: new Set(apps.map((a) => String(a.applicant))).size,
      internshipSelected: apps.filter((a) => a.status === 'accepted').length,
      internshipTop: topIds.map(([id, c]) => ({ company: nameOf[id] || 'Company', internships: c })),
      drivesTotal, drivesPending, drivesPublished, drivesPaid, driveRegistrations, sponsoredJobs, urgentJobs,
      logoAgreed, logoApproved, collegeLogoApproved, waOptIns, referred,
    }));
  } catch (e) { console.error('Services overview error:', e.message); res.status(500).json({ message: 'Could not load the numbers' }); }
};
module.exports = { getServicesOverview };
