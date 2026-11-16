const College = require('../models/College');
const CollegeStudent = require('../models/CollegeStudent');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { summariseInternshipApps } = require('../utils/internship');

// GET /api/college/internships : how this college's students are doing on internships. Read only; the college sees only its own students.
const getCollegeInternships = async (req, res) => {
  try {
    const college = await College.findOne({ $or: [{ tpoUser: req.user.id }, { teamMembers: { $elemMatch: { user: req.user.id, isActive: true } } }] }).select('_id');
    if (!college) return res.status(404).json({ msg: 'College not found' });
    const students = await CollegeStudent.find({ college: college._id, user: { $ne: null } }).select('user department').lean();
    const byUser = new Map(students.map((s) => [String(s.user), s]));
    const jobIds = await Job.find({ jobType: 'Internship' }).distinct('_id');
    const apps = await Application.find({ applicant: { $in: [...byUser.keys()] }, job: { $in: jobIds } })
      .sort({ createdAt: -1 }).limit(500)
      .populate('applicant', 'name').populate({ path: 'job', select: 'title company', populate: { path: 'company', select: 'name' } }).lean();
    const rows = apps.map((a) => ({ id: a._id, student: a.applicant?._id, studentName: a.applicant?.name || '', department: byUser.get(String(a.applicant?._id))?.department || '',
      title: a.job?.title || '', company: a.job?.company?.name || '', status: a.status, appliedAt: a.createdAt }));
    res.json({ summary: summariseInternshipApps(rows), recent: rows.slice(0, 50), totalStudents: students.length });
  } catch (err) { console.error('College internships:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

module.exports = { getCollegeInternships };
