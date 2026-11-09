const College = require('../models/College');
const CollegePackPayment = require('../models/CollegePackPayment');
const { planPack, effectiveStudentLimit } = require('../utils/collegePack');
const { PACK } = require('../config/collegePack');

const HEX = /^[0-9a-fA-F]{24}$/;

// POST /api/admin/colleges/:id/student-pack {packs, note}   (Super Admin only)
// The amount is worked out here from the fixed pack price plus 18% GST. It is never taken from the request.
const recordPack = async (req, res) => {
  try {
    if (!HEX.test(req.params.id)) return res.status(400).json({ msg: 'Bad college id' });
    const note = String(req.body?.note || '').trim().slice(0, 200);
    if (note.length < 5) return res.status(400).json({ msg: 'Please write how it was paid (for example: UPI, 12 Nov).' });
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ msg: 'College not found' });
    if (college.verificationStatus !== 'verified') return res.status(400).json({ msg: 'Verify the college before adding a pack.' });
    const plan = planPack(college, req.body?.packs);
    if (plan.error) return res.status(400).json({ msg: plan.error });
    await CollegePackPayment.create({ college: college._id, packs: plan.packs, students: plan.students, amount: plan.total, note, by: String(req.user?.id || '') });
    college.extraStudents = plan.extraStudents;
    college.extraUntil = plan.extraUntil;
    await college.save();
    res.json({ msg: `Added ${plan.students} students.`, paid: plan.total, studentLimit: effectiveStudentLimit(college), extraStudents: college.extraStudents, extraUntil: college.extraUntil });
  } catch (e) { console.error('College pack:', e.message); res.status(500).json({ msg: 'Could not save' }); }
};

const packInfo = (req, res) => res.json(PACK);

module.exports = { recordPack, packInfo };
