const crypto = require('crypto');
const QRCode = require('qrcode');
const College = require('../models/College');
const CampusDrive = require('../models/CampusDrive');
const CollegeStudent = require('../models/CollegeStudent');
const CollegeDriveEvent = require('../models/CollegeDriveEvent');
const CollegeEmployer = require('../models/CollegeEmployer');
const CollegeActivityLog = require('../models/CollegeActivityLog');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const collegeFor = userId => College.findOne({ $or: [{ tpoUser: userId }, { teamMembers: { $elemMatch: { user: userId, isActive: true } } }] });
const audit = async (req, college, action, description, entityType = 'college', entity) => {
  const actor = await User.findById(req.user.id).select('name');
  await CollegeActivityLog.create({ college: college._id, actor: req.user.id, actorName: actor?.name || 'College user', action, description, entityType, entity });
};

exports.getEvents = async (req, res) => {
  try {
    const college = await collegeFor(req.user.id);
    const events = await CollegeDriveEvent.find({ college: college._id }).populate('drive', 'title companies').populate('attendance.student', 'rollNumber department user').sort({ startsAt: 1 });
    res.json(events);
  } catch (e) { res.status(500).json({ msg: 'Could not load events', error: e.message }); }
};

exports.createEvent = async (req, res) => {
  try {
    const college = await collegeFor(req.user.id);
    const { drive, title, type, startsAt, endsAt, venue, coordinator } = req.body;
    if (!drive || !title || !startsAt || !endsAt) return res.status(400).json({ msg: 'Drive, title, start and end are required' });
    if (new Date(endsAt) <= new Date(startsAt)) return res.status(400).json({ msg: 'End time must be after start time' });
    const ownsDrive = await CampusDrive.exists({ _id: drive, college: college._id });
    if (!ownsDrive) return res.status(404).json({ msg: 'Drive not found' });
    const conflict = await CollegeDriveEvent.findOne({ college: college._id, startsAt: { $lt: new Date(endsAt) }, endsAt: { $gt: new Date(startsAt) }, $or: [{ venue: venue || '__none__' }, { coordinator: coordinator || '__none__' }] });
    if (conflict && (venue || coordinator)) return res.status(409).json({ msg: `Schedule conflict with “${conflict.title}”` });
    const checkInToken = crypto.randomBytes(18).toString('hex');
    const qrCodeUrl = await QRCode.toDataURL(`${FRONTEND_URL}/college-event-checkin/${checkInToken}`, { width: 360, margin: 2 });
    const event = await CollegeDriveEvent.create({ college: college._id, drive, title, type, startsAt, endsAt, venue, coordinator, checkInToken, qrCodeUrl, createdBy: req.user.id });
    await audit(req, college, 'drive_event_created', `Scheduled ${title}`, 'drive', drive);
    res.status(201).json(event);
  } catch (e) { res.status(500).json({ msg: 'Could not create event', error: e.message }); }
};

exports.sendEventReminder = async (req, res) => {
  try {
    const college = await collegeFor(req.user.id);
    const event = await CollegeDriveEvent.findOne({ _id: req.params.eventId, college: college._id }).populate('drive');
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    const students = await CollegeStudent.find({ college: college._id, 'driveApplications.drive': event.drive._id }).populate('user', 'name email');
    await Promise.allSettled(students.filter(s => s.user?.email).map(s => sendEmail({ email: s.user.email, subject: `Reminder: ${event.title}`, html: emailWrapper('Campus Event Reminder', `<p>Hi ${s.user.name || 'there'},</p><p><strong>${event.title}</strong> is scheduled for ${new Date(event.startsAt).toLocaleString('en-IN')}.</p><p>Venue: <strong>${event.venue || 'To be announced'}</strong></p>`) })));
    event.reminderSentAt = new Date(); await event.save();
    await audit(req, college, 'event_reminder_sent', `Sent ${event.title} reminder to ${students.length} student(s)`, 'drive', event.drive._id);
    res.json({ msg: `Reminder sent to ${students.length} student(s)` });
  } catch (e) { res.status(500).json({ msg: 'Could not send reminder', error: e.message }); }
};

exports.checkInEvent = async (req, res) => {
  try {
    const event = await CollegeDriveEvent.findOne({ checkInToken: req.params.token });
    if (!event) return res.status(404).json({ msg: 'Invalid attendance QR' });
    const student = await CollegeStudent.findOne({ user: req.user.id, college: event.college });
    if (!student) return res.status(403).json({ msg: 'You are not a student of this college' });
    if (!student.driveApplications.some(a => a.drive.toString() === event.drive.toString())) return res.status(403).json({ msg: 'You are not registered for this drive' });
    if (event.attendance.some(a => a.student.toString() === student._id.toString())) return res.json({ msg: 'Attendance already recorded' });
    event.attendance.push({ student: student._id, checkedInBy: req.user.id }); await event.save();
    res.json({ msg: `Attendance recorded for ${event.title}` });
  } catch (e) { res.status(500).json({ msg: 'Could not record attendance', error: e.message }); }
};

exports.getAdvancedAnalytics = async (req, res) => {
  try {
    const college = await collegeFor(req.user.id);
    const students = await CollegeStudent.find({ college: college._id }).populate('user', 'name');
    const total = students.length;
    const placed = students.filter(s => s.placementStatus === 'placed' || s.placedDetails?.length).length;
    const offers = students.reduce((n, s) => n + (s.placedDetails?.length || 0), 0);
    const packages = students.flatMap(s => (s.placedDetails || []).map(p => Number(p.packageLPA || 0))).filter(Boolean).sort((a,b) => a-b);
    const byDepartment = {};
    const byCompany = {};
    const funnel = { registered: 0, stage1: 0, stage2: 0, final_interview: 0, selected: 0, rejected: 0 };
    students.forEach(s => {
      const key = s.department || 'Unknown';
      byDepartment[key] ||= { total: 0, placed: 0 }; byDepartment[key].total++;
      if (s.placementStatus === 'placed' || s.placedDetails?.length) byDepartment[key].placed++;
      (s.placedDetails || []).forEach(p => { byCompany[p.companyName || 'Unknown'] = (byCompany[p.companyName || 'Unknown'] || 0) + 1; });
      (s.driveApplications || []).forEach(a => { if (funnel[a.status] !== undefined) funnel[a.status]++; });
    });
    const evidenceFields = ['gender', 'programme', 'outcome'];
    const accreditationRows = students.map(s => {
      const missing = evidenceFields.filter(k => !s.accreditation?.[k]);
      if (s.accreditation?.outcome === 'Placed' && !s.accreditation?.placement?.evidenceUrl) missing.push('offer evidence');
      if (['Higher Studies','Qualified Competitive Exam'].includes(s.accreditation?.outcome) && !s.accreditation?.progression?.evidenceUrl) missing.push('progression evidence');
      return { _id: s._id, name: s.user?.name, rollNumber: s.rollNumber, department: s.department, complete: missing.length === 0, missing };
    });
    res.json({ summary: { total, placed, placementRate: total ? Math.round(placed/total*100) : 0, offers, multipleOffers: students.filter(s => s.placedDetails?.length > 1).length, averagePackage: packages.length ? +(packages.reduce((a,b)=>a+b,0)/packages.length).toFixed(2) : 0, medianPackage: packages.length ? packages[Math.floor(packages.length/2)] : 0, highestPackage: packages.at(-1) || 0 }, byDepartment, byCompany, funnel, accreditation: { complete: accreditationRows.filter(r=>r.complete).length, incomplete: accreditationRows.filter(r=>!r.complete).length, students: accreditationRows.filter(r=>!r.complete) } });
  } catch (e) { res.status(500).json({ msg: 'Could not load analytics', error: e.message }); }
};

exports.getEmployers = async (req, res) => {
  try { const college = await collegeFor(req.user.id); res.json(await CollegeEmployer.find({ college: college._id }).populate('scorecards.drive', 'title').populate({ path: 'scorecards.student', populate: { path: 'user', select: 'name' } }).sort({ updatedAt: -1 })); }
  catch (e) { res.status(500).json({ msg: 'Could not load employers', error: e.message }); }
};

exports.saveEmployer = async (req, res) => {
  try {
    const college = await collegeFor(req.user.id);
    const allowed = ['name','industry','website','status','contacts','lastContactedAt','nextFollowUpAt','notes'];
    const data = {}; allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    if (!data.name && !req.params.employerId) return res.status(400).json({ msg: 'Employer name is required' });
    const employer = req.params.employerId ? await CollegeEmployer.findOneAndUpdate({ _id: req.params.employerId, college: college._id }, data, { new: true }) : await CollegeEmployer.create({ ...data, college: college._id });
    if (!employer) return res.status(404).json({ msg: 'Employer not found' });
    await audit(req, college, req.params.employerId ? 'employer_updated' : 'employer_added', `${req.params.employerId ? 'Updated' : 'Added'} employer ${employer.name}`, 'college', employer._id);
    res.status(req.params.employerId ? 200 : 201).json(employer);
  } catch (e) { res.status(e.code === 11000 ? 409 : 500).json({ msg: e.code === 11000 ? 'Employer already exists' : 'Could not save employer', error: e.message }); }
};

exports.addScorecard = async (req, res) => {
  try {
    const college = await collegeFor(req.user.id);
    const employer = await CollegeEmployer.findOne({ _id: req.params.employerId, college: college._id });
    if (!employer) return res.status(404).json({ msg: 'Employer not found' });
    const student = await CollegeStudent.exists({ _id: req.body.student, college: college._id });
    const drive = await CampusDrive.exists({ _id: req.body.drive, college: college._id });
    if (!student || !drive) return res.status(400).json({ msg: 'Select a valid student and drive' });
    employer.scorecards.push({ ...req.body, createdBy: req.user.id }); await employer.save();
    await audit(req, college, 'interview_scorecard_added', `Added interview scorecard for ${employer.name}`, 'college', employer._id);
    res.status(201).json(employer.scorecards.at(-1));
  } catch (e) { res.status(500).json({ msg: 'Could not add scorecard', error: e.message }); }
};

exports.deleteScorecard = async (req, res) => {
  try {
    const college = await collegeFor(req.user.id);
    const employer = await CollegeEmployer.findOne({ _id: req.params.employerId, college: college._id });
    if (!employer) return res.status(404).json({ msg: 'Employer not found' });
    const scorecard = employer.scorecards.id(req.params.scorecardId);
    if (!scorecard) return res.status(404).json({ msg: 'Scorecard not found' });
    const studentId = scorecard.student;
    scorecard.deleteOne();
    await employer.save();
    await audit(req, college, 'interview_scorecard_deleted', `Deleted an interview scorecard from ${employer.name}`, 'college', employer._id);
    res.json({ msg: 'Scorecard deleted', studentId });
  } catch (e) { res.status(500).json({ msg: 'Could not delete scorecard', error: e.message }); }
};
