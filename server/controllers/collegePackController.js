const College = require('../models/College');
const CollegePackPayment = require('../models/CollegePackPayment');
const AdminRequest = require('../models/AdminRequest');
const User = require('../models/User');
const { planPack, effectiveStudentLimit, activeExtra, checkRequest } = require('../utils/collegePack');
const { notifyRoles, notifyUser } = require('../utils/inAppNotifications');
const { receivedMessage } = require('../utils/serviceRequestMessages');
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
    // The college's open request is now dealt with, so its dashboard button comes back.
    await AdminRequest.updateMany({ type: 'student_pack', college: college._id, status: { $in: ['pending', 'approved'] } }, { $set: { status: 'completed' } }).catch(() => {});
    college.extraStudents = plan.extraStudents;
    college.extraUntil = plan.extraUntil;
    await college.save();
    res.json({ msg: `Added ${plan.students} students.`, paid: plan.total, studentLimit: effectiveStudentLimit(college), extraStudents: college.extraStudents, extraUntil: college.extraUntil });
  } catch (e) { console.error('College pack:', e.message); res.status(500).json({ msg: 'Could not save' }); }
};

// POST /api/college/me/student-pack-request {packs, note}   (college dashboard)
// Raises a request only. The Super Admin records the payment later, which is what adds the students.
const requestPack = async (req, res) => {
  try {
    const college = await College.findOne({ $or: [{ tpoUser: req.user.id }, { teamMembers: { $elemMatch: { user: req.user.id, isActive: true } } }] });
    if (!college) return res.status(404).json({ msg: 'No college linked to your account.' });
    if (college.verificationStatus !== 'verified') return res.status(400).json({ msg: 'Your college must be verified before you can add a pack.' });
    const pending = await AdminRequest.exists({ type: 'student_pack', college: college._id, status: { $in: ['pending', 'approved'] } });
    const check = checkRequest(college, req.body?.packs, !!pending);
    if (check.error) return res.status(400).json({ msg: check.error });
    const user = await User.findById(req.user.id).select('name email phone');
    const request = await AdminRequest.create({
      user: req.user.id, type: 'student_pack', college: college._id, packs: check.packs,
      bookingName: user?.name, bookingEmail: user?.email, bookingPhone: user?.phone,
      notes: `${college.name}: ${check.packs} pack(s), ${check.students} students, ${check.total} incl. GST. ${String(req.body?.note || '').trim().slice(0, 300)}`.trim()
    });
    // In-app alert plus the standard email to every Super Admin. Staff are not told: they cannot open this type.
    notifyRoles({ io: req.io, roles: ['admin'], title: 'College asked for a student pack', message: `${college.name} asked for ${check.packs} pack(s) (${check.students} students, Rs ${check.total} with GST).`, type: 'service_request', link: '/admin/requests', metadata: { requestId: request._id, requestType: 'student_pack' } })
      .catch(err => console.error('Pack request alert failed:', err.message));
    notifyUser({ io: req.io, recipientId: req.user.id, ...receivedMessage('student_pack', user?.name), type: 'service_received', metadata: { requestId: request._id } })
      .catch(err => console.error('Pack request receipt failed:', err.message));
    res.status(201).json({ msg: 'Request sent. Our team will contact you within 24 hours.' });
  } catch (e) { console.error('Pack request:', e.message); res.status(500).json({ msg: 'Could not send the request' }); }
};

// GET /api/college/me/student-pack  → what the college can still add, and whether a request is open
const myPackStatus = async (req, res) => {
  try {
    const college = await College.findOne({ $or: [{ tpoUser: req.user.id }, { teamMembers: { $elemMatch: { user: req.user.id, isActive: true } } }] });
    if (!college) return res.status(404).json({ msg: 'No college linked' });
    const have = Math.round(activeExtra(college) / PACK.students);
    const pending = !!(await AdminRequest.exists({ type: 'student_pack', college: college._id, status: { $in: ['pending', 'approved'] } }));
    res.json({ ...PACK, havePacks: have, canRequest: college.verificationStatus === 'verified' && (college.studentLimit || 100) < 100000 && have < PACK.maxPacks && !pending, pending, studentLimit: effectiveStudentLimit(college) });
  } catch (e) { res.status(500).json({ msg: 'Could not load' }); }
};

const packInfo = (req, res) => res.json(PACK);

module.exports = { recordPack, packInfo, requestPack, myPackStatus };
