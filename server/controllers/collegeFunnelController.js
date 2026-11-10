// Admin: how many colleges are at each step from signup to paid, and which ones are stuck.
//   GET /api/admin/college-funnel   (admin only, registered below the admin gate)
const College = require('../models/College');
const CollegeStudent = require('../models/CollegeStudent');
const CampusDrive = require('../models/CampusDrive');
const CollegePlacementReport = require('../models/CollegePlacementReport');
const AdminRequest = require('../models/AdminRequest');
const { effectiveStudentLimit } = require('../utils/collegePack');
const { STEPS, flagsFor, nextStep, summarise } = require('../utils/collegeFunnel');

const ids = (list) => new Set(list.map((x) => String(x)));

const getCollegeFunnel = async (req, res) => {
  try {
    const colleges = await College.find({ isTest: { $ne: true } })
      .select('name createdAt subscriptionTier studentLimit extraStudents extraUntil verificationStatus principalName collegePhone tpoUser')
      .populate('tpoUser', 'name phone')
      .sort({ createdAt: -1 }).limit(500).lean();
    const [counts, drives, reports, called] = await Promise.all([
      CollegeStudent.aggregate([{ $group: { _id: '$college', n: { $sum: 1 } } }]),
      CampusDrive.distinct('college'),
      CollegePlacementReport.distinct('college'),
      AdminRequest.distinct('college', { type: 'college_call', status: { $in: ['approved', 'completed'] } }),
    ]);
    const countMap = new Map(counts.map((r) => [String(r._id), r.n]));
    const driveSet = ids(drives); const reportSet = ids(reports); const calledSet = ids(called);
    const now = Date.now();
    const rows = colleges.map((c) => {
      const students = countMap.get(String(c._id)) || 0; const limit = effectiveStudentLimit(c);
      const flags = flagsFor({ students, limit, called: calledSet.has(String(c._id)), drive: driveSet.has(String(c._id)), report: reportSet.has(String(c._id)), tier: c.subscriptionTier });
      return {
        id: c._id, name: c.name, createdAt: c.createdAt, daysOld: Math.floor((now - new Date(c.createdAt).getTime()) / 86400000),
        verified: c.verificationStatus === 'verified', tier: c.subscriptionTier || 'campus_free', students, limit,
        tpo: c.tpoUser?.name || c.principalName || '', phone: c.tpoUser?.phone || c.collegePhone || '',
        flags, next: nextStep(flags),
      };
    });
    res.json({ total: rows.length, steps: summarise(rows), colleges: rows.slice(0, 200), labels: Object.fromEntries(STEPS.map((s) => [s.key, s.label])) });
  } catch (err) {
    console.error('College funnel error:', err.message);
    res.status(500).json({ msg: 'Could not load the college funnel.' });
  }
};

module.exports = { getCollegeFunnel };
