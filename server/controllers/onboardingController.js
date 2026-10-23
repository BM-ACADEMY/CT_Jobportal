const User = require('../models/User');
const Company = require('../models/Company');
const College = require('../models/College');
const Job = require('../models/Job');
const Application = require('../models/Application');
const SkillTestResult = require('../models/SkillTestResult');
const CampusDrive = require('../models/CampusDrive');
const CollegeStudent = require('../models/CollegeStudent');
const { buildChecklist } = require('../utils/onboarding');

// @route GET /api/onboarding  -> the signed-in person's checklist (null for admin-type roles)
const getOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role', 'name');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const roleName = user.role?.name;
    const counts = {};

    if (roleName === 'jobseeker') {
      [counts.skillTests, counts.applications] = await Promise.all([
        SkillTestResult.countDocuments({ user: user._id }),
        Application.countDocuments({ applicant: user._id }),
      ]);
    }

    let company = null;
    if (['recruiter', 'company'].includes(roleName)) {
      if (user.company) company = await Company.findById(user.company).lean();
      const jobQuery = user.company ? { $or: [{ recruiter: user._id }, { company: user.company }] } : { recruiter: user._id };
      [counts.jobs, counts.teamMembers] = await Promise.all([
        Job.countDocuments(jobQuery),
        user.company ? User.countDocuments({ company: user.company, _id: { $ne: user._id } }) : 0,
      ]);
    }

    let college = null;
    if (roleName === 'college') {
      const collegeId = user.collegeProfile?.college;
      if (collegeId) {
        college = await College.findById(collegeId).lean();
        [counts.drives, counts.students] = await Promise.all([
          CampusDrive.countDocuments({ college: collegeId }),
          CollegeStudent.countDocuments({ college: collegeId }),
        ]);
      }
    }

    const checklist = buildChecklist(roleName, { user, company, college, counts });
    if (!checklist) return res.json({ enabled: false });
    res.json({ enabled: true, ...checklist, tourSeen: !!user.onboarding?.tourSeenAt, firstName: String(user.name || '').split(' ')[0] });
  } catch (err) {
    console.error('Onboarding error:', err.message);
    res.status(500).json({ msg: 'Could not load your checklist' });
  }
};

// @route POST /api/onboarding/tour-seen
const markTourSeen = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.id }, { $set: { 'onboarding.tourSeenAt': new Date() } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Tour seen error:', err.message);
    res.status(500).json({ msg: 'Could not save' });
  }
};

module.exports = { getOnboarding, markTourSeen };
