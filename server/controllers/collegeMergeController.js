// Admin > Colleges: likely duplicate colleges and a merge. Super Admin only (role 'admin'): the check is made here as well as on the
// route, so no other role, staff included, can reach the models. Models are required lazily so this file loads in tests.
const { findDuplicateGroups, mergeColleges } = require('../utils/collegeMerge');

const superAdminOnly = (req, res) => {
  if (req.user && req.user.role === 'admin') return true;
  res.status(403).json({ msg: 'Access denied: Admin only' });
  return false;
};

const loadModels = () => ({
  College: require('../models/College'), CollegeStudent: require('../models/CollegeStudent'), CampusDrive: require('../models/CampusDrive'),
  CollegeDriveEvent: require('../models/CollegeDriveEvent'), CollegeEmployer: require('../models/CollegeEmployer'),
  CollegePlacementReport: require('../models/CollegePlacementReport'), CollegePackPayment: require('../models/CollegePackPayment'),
  AccreditationExportLog: require('../models/AccreditationExportLog'), CollegeActivityLog: require('../models/CollegeActivityLog'),
  AdminRequest: require('../models/AdminRequest'), User: require('../models/User')
});

// GET /api/admin/college-duplicates
const listDuplicates = async (req, res, deps = {}) => {
  if (!superAdminOnly(req, res)) return;
  try {
    const m = deps.models || loadModels();
    const colleges = await m.College.find({ mergedInto: null, isTest: { $ne: true } })
      .select('name location collegeEmail principalEmail verificationStatus createdAt code').sort({ createdAt: 1 }).limit(5000).lean();
    const groups = findDuplicateGroups(colleges);
    const ids = groups.flatMap((g) => g.colleges.map((c) => c._id));
    const counts = ids.length ? new Map((await m.CollegeStudent.aggregate([{ $match: { college: { $in: ids } } }, { $group: { _id: '$college', n: { $sum: 1 } } }])).map((r) => [String(r._id), r.n])) : new Map();
    res.json({ groups: groups.map((g) => ({ reason: g.reason, colleges: g.colleges.map((c) => ({ id: c._id, name: c.name, city: c.location || '', email: c.collegeEmail || c.principalEmail || '', status: c.verificationStatus, createdAt: c.createdAt, students: counts.get(String(c._id)) || 0 })) })) });
  } catch (err) { console.error('College duplicates:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

// POST /api/admin/colleges/merge  { sourceId, targetId }  (the source is merged into the target and switched off)
const merge = async (req, res, deps = {}) => {
  if (!superAdminOnly(req, res)) return;
  try {
    const m = deps.models || loadModels();
    const r = await mergeColleges({ sourceId: req.body?.sourceId, targetId: req.body?.targetId, actor: { id: req.user.id, name: req.user.name }, models: m });
    if (r.error) return res.status(r.status).json({ msg: r.error });
    res.json({ msg: `Merged "${r.source.name}" into "${r.target.name}".`, ...r });
  } catch (err) { console.error('College merge:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

module.exports = { listDuplicates, merge };
