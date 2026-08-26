const College = require('../models/College');
const CampusDrive = require('../models/CampusDrive');
const CollegeStudent = require('../models/CollegeStudent');
const User = require('../models/User');
const Role = require('../models/Role');
const Company = require('../models/Company');
const Subscription = require('../models/Subscription');
const Assessment = require('../models/Assessment');
const Application = require('../models/Application');
const CollegePlacementReport = require('../models/CollegePlacementReport');
const CollegeActivityLog = require('../models/CollegeActivityLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { parse } = require('csv-parse/sync');
const crypto = require('crypto');
const { generateMouPdf, generateCertificatePdf, generatePlacementReportPdf, generateSummaryReportPdf } = require('../utils/pdfGenerator');
const { sendWhatsAppMessage } = require('../utils/notifications');
const { sendWhatsAppTemplate, getUserPhone } = require('../utils/whatsapp');
const { getOrCreateConversation } = require('../utils/conversationHelper');
const { saveBufferToUploads } = require('../utils/fileStorage');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');
const { notifyUser, notifyRoles } = require('../utils/inAppNotifications');

const FRONTEND_URL = process.env.FRONTEND_URL;

const savePdfToUploads = (buffer, prefix) => saveBufferToUploads(buffer, prefix, 'pdf');

const isProPlus = (tier) => tier === 'campus_pro' || tier === 'campus_elite';
// Any paid campus tier (Lite and up) — used for perks the plan matrix grants starting at Lite,
// like co-branded certificates, as opposed to isProPlus which is Pro/Elite-only perks.
const isPaidPlan = (tier) => tier === 'campus_lite' || tier === 'campus_pro' || tier === 'campus_elite';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const getCollegeForTPO = async (userId) => {
  let college = await College.findOne({
    $or: [{ tpoUser: userId }, { teamMembers: { $elemMatch: { user: userId, isActive: true } } }]
  });
  if (!college) {
    const user = await User.findById(userId);
    if (!user) throw new Error('NO_COLLEGE');
    if (user.collegeProfile?.college) throw new Error('NO_COLLEGE_ACCESS');

    const generateDisplayId = require('../utils/generateDisplayId');
    const year = new Date().getFullYear();
    const displayId = await generateDisplayId('VG', year);

    college = new College({
      name: user.collegeProfile?.designation && user.collegeProfile.designation !== 'TPO' 
        ? user.collegeProfile.designation 
        : `${user.name || 'Campus'} Institute of Technology`,
      code: `CAMP-${Date.now().toString().slice(-4)}`,
      tpoUser: userId,
      principalName: user.name || 'Principal',
      principalEmail: user.email || '',
      departments: [
        { name: 'Computer Science', code: 'CS' },
        { name: 'Information Technology', code: 'IT' },
        { name: 'Electronics & Communication', code: 'ECE' },
        { name: 'Mechanical Engineering', code: 'MECH' }
      ],
      subscriptionTier: 'campus_free',
      isActive: true,
      display_id: displayId
    });
    await college.save();

    user.collegeProfile = user.collegeProfile || {};
    user.collegeProfile.college = college._id;
    await user.save();
  }
  return college;
};

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

// @desc    Get college dashboard stats
// @route   GET /api/college/dashboard
const getDashboard = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);

    const [statusCounts, deptCounts, batchCounts, totalDrives, recentStudents, allStudents] = await Promise.all([
      CollegeStudent.aggregate([
        { $match: { college: college._id } },
        { $group: { _id: '$placementStatus', count: { $sum: 1 } } }
      ]),
      CollegeStudent.aggregate([
        { $match: { college: college._id } },
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]),
      CollegeStudent.aggregate([
        { $match: { college: college._id } },
        { $group: { _id: '$batchYear', count: { $sum: 1 } } }
      ]),
      CampusDrive.countDocuments({ college: college._id }),
      CollegeStudent.find({ college: college._id })
        .populate('user', 'name email avatar profile.skills')
        .sort({ createdAt: -1 })
        .limit(10),
      CollegeStudent.find({ college: college._id })
        .populate('user', 'profile.resumeUrl profile.skills')
        .select('user')
    ]);

    const stats = { registered: 0, active: 0, applied: 0, interviewing: 0, placed: 0, opted_out: 0 };
    statusCounts.forEach(s => { if (stats[s._id] !== undefined) stats[s._id] = s.count; });

    const totalStudents = Object.values(stats).reduce((a, b) => a + b, 0);
    const successRate = totalStudents > 0 ? Math.round((stats.placed / totalStudents) * 100) : 0;

    // Verified count
    const verifiedCount = await CollegeStudent.countDocuments({
      college: college._id,
      'idVerification.status': 'approved'
    });

    // Profile Completion
    let completedProfiles = 0;
    if (allStudents) {
      allStudents.forEach(s => {
        if (s.user && (s.user.profile?.resumeUrl || (s.user.profile?.skills && s.user.profile.skills.length > 0))) {
          completedProfiles++;
        }
      });
    }
    const profileCompletionRate = totalStudents > 0 ? Math.round((completedProfiles / totalStudents) * 100) : 0;

    res.json({
      college: { 
        name: college.name, 
        code: college.code, 
        logo: college.logo, 
        subscriptionTier: college.subscriptionTier 
      },
      subscription: {
        status: college.subscriptionTier,
        nextRenewalDate: college.nextRenewalDate,
        autoRenewEnabled: college.autoRenewEnabled,
        studentLimit: college.studentLimit || 100
      },
      stats,
      totalStudents,
      successRate,
      verifiedCount,
      profileCompletionRate,
      departments: deptCounts.map(d => ({ name: d._id || 'Unknown', count: d.count })),
      batches: batchCounts.map(b => ({ year: b._id, count: b.count })).sort((a, b) => b.year - a.year),
      totalDrives,
      recentStudents
    });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked to your account' });
    console.error('College Dashboard Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Unified college placement dashboard, filterable by course/department & batch year (spec 8.4)
// @route   GET /api/college/me/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const { department, batchYear } = req.query;

    const baseMatch = { college: college._id };
    if (department) baseMatch.department = department;
    if (batchYear) baseMatch.batchYear = parseInt(batchYear);

    const [statusCounts, deptCounts, batchCounts, totalDrives, recentStudents, filteredStudents] = await Promise.all([
      CollegeStudent.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$placementStatus', count: { $sum: 1 } } }
      ]),
      CollegeStudent.aggregate([
        { $match: { college: college._id } },
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]),
      CollegeStudent.aggregate([
        { $match: { college: college._id } },
        { $group: { _id: '$batchYear', count: { $sum: 1 } } }
      ]),
      CampusDrive.countDocuments({ college: college._id }),
      CollegeStudent.find(baseMatch)
        .populate('user', 'name email avatar profile.skills')
        .sort({ createdAt: -1 })
        .limit(10),
      CollegeStudent.find(baseMatch)
        .populate('user', 'profile.resumeUrl profile.skills')
        .select('user placedDetails')
    ]);

    const stats = { registered: 0, active: 0, applied: 0, shortlisted: 0, interviewing: 0, placed: 0, opted_out: 0 };
    statusCounts.forEach(s => { if (stats[s._id] !== undefined) stats[s._id] = s.count; });

    const totalStudents = Object.values(stats).reduce((a, b) => a + b, 0);
    const successRate = totalStudents > 0 ? Math.round((stats.placed / totalStudents) * 100) : 0;

    let completedProfiles = 0;
    filteredStudents.forEach(s => {
      if (s.user && (s.user.profile?.resumeUrl || (s.user.profile?.skills && s.user.profile.skills.length > 0))) {
        completedProfiles++;
      }
    });
    const profileCompletionRate = totalStudents > 0 ? Math.round((completedProfiles / totalStudents) * 100) : 0;

    const verifiedCount = await CollegeStudent.countDocuments({
      ...baseMatch,
      'idVerification.status': 'approved'
    });

    // Applications / shortlists / interviews / offers, scoped to the filtered student set (spec 8.4)
    const studentUserIds = filteredStudents.map(s => s.user?._id).filter(Boolean);
    const appAgg = await Application.aggregate([
      { $match: { applicant: { $in: studentUserIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const appCounts = { pending: 0, reviewed: 0, shortlisted: 0, rejected: 0, accepted: 0, withdrawn: 0 };
    appAgg.forEach(a => { if (appCounts[a._id] !== undefined) appCounts[a._id] = a.count; });
    const applicationsSubmitted = Object.values(appCounts).reduce((a, b) => a + b, 0);

    // Average placement salary, from placedDetails on the filtered student set
    let totalLPA = 0, lpaCount = 0;
    filteredStudents.forEach(s => {
      (s.placedDetails || []).forEach(p => {
        if (p.packageLPA > 0) { totalLPA += p.packageLPA; lpaCount++; }
      });
    });
    const averagePlacementSalary = lpaCount > 0 ? Number((totalLPA / lpaCount).toFixed(2)) : 0;

    // Recruiter spotlight — which companies engaged recently, Campus Pro+ only (spec 8.4 / 11)
    let recruiterSpotlight = [];
    if (isProPlus(college.subscriptionTier)) {
      const allStudentIds = (await CollegeStudent.find({ college: college._id }).select('user')).map(s => s.user);
      recruiterSpotlight = await Application.aggregate([
        { $match: { applicant: { $in: allStudentIds } } },
        { $sort: { createdAt: -1 } },
        { $limit: 200 },
        { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'jobInfo' } },
        { $unwind: '$jobInfo' },
        { $lookup: { from: 'companies', localField: 'jobInfo.company', foreignField: '_id', as: 'companyInfo' } },
        { $unwind: { path: '$companyInfo', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$jobInfo.company', companyName: { $first: '$companyInfo.name' }, companyLogo: { $first: '$companyInfo.logo' }, lastEngagedAt: { $first: '$createdAt' }, applicationCount: { $sum: 1 } } },
        { $sort: { lastEngagedAt: -1 } },
        { $limit: 5 }
      ]);
    }

    const latestReport = await CollegePlacementReport.findOne({ college: college._id }).sort({ createdAt: -1 });

    res.json({
      college: {
        name: college.name,
        code: college.code,
        logo: college.logo,
        subscriptionTier: college.subscriptionTier,
        principalPasskey: college.principalPasskey || null
      },
      subscription: {
        status: college.subscriptionTier,
        planId: college.subscription || null,
        nextRenewalDate: college.nextRenewalDate,
        autoRenewEnabled: college.autoRenewEnabled,
        studentLimit: college.studentLimit || 100
      },
      filters: { department: department || null, batchYear: batchYear ? parseInt(batchYear) : null },
      stats,
      totalStudents,
      successRate,
      verifiedCount,
      profileCompletionRate,
      departments: deptCounts.map(d => ({ name: d._id || 'Unknown', count: d.count })),
      batches: batchCounts.map(b => ({ year: b._id, count: b.count })).sort((a, b) => b.year - a.year),
      totalDrives,
      recentStudents,
      placementFunnel: {
        applicationsSubmitted,
        shortlistsReceived: appCounts.shortlisted + appCounts.accepted,
        interviewsScheduled: stats.interviewing,
        offersMade: appCounts.accepted,
        studentsPlaced: stats.placed,
        averagePlacementSalary
      },
      recruiterSpotlight,
      quickLinks: {
        latestReportId: latestReport?._id || null,
        latestReportUrl: latestReport?.reportUrl || null,
        bulkUploadRoute: '/college/students?action=upload'
      }
    });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked to your account' });
    console.error('College Dashboard Stats Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// ─── COLLEGE PROFILE ────────────────────────────────────────────────────────

// @route   GET /api/college/profile
const getProfile = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    res.json(college);
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked to your account' });
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @route   PUT /api/college/profile
const updateProfile = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const allowed = ['name', 'code', 'university', 'location', 'logo', 'principalName', 'principalEmail', 'departments', 'collegeEmail', 'collegePhone', 'additionalReportRecipients'];
    allowed.forEach(field => { if (req.body[field] !== undefined) college[field] = req.body[field]; });
    await college.save();
    res.json(college);
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked to your account' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// ─── CAMPUS DRIVES ──────────────────────────────────────────────────────────

// Normalizes the `companies` array from the request body and keeps the legacy singular
// companyName/packageLPA/tierPolicy fields in sync with the first company for any older
// code path (public registration, placement fallback, etc.) that still reads them.
// `existingCompanies` (the drive's current companies before this save) lets us preserve each
// company's accessToken across edits by matching on _id, instead of minting a new one every save.
const normalizeCompanies = (companies, existingCompanies = []) => {
  if (!Array.isArray(companies)) return null;
  const existingById = new Map((existingCompanies || []).map(c => [String(c._id), c]));
  return companies
    .filter(c => c && c.name && c.name.trim())
    .map(c => {
      const existing = c._id ? existingById.get(String(c._id)) : null;
      const contactEmail = (c.contactEmail || '').trim().toLowerCase();
      // Mint a token the first time a contact email is set; clear it if the contact is removed.
      let accessToken = existing?.accessToken || '';
      if (contactEmail && !accessToken) accessToken = crypto.randomBytes(16).toString('hex');
      if (!contactEmail) accessToken = '';

      const normalized = {
        name: c.name.trim(),
        packageLPA: c.packageLPA || 0,
        tierPolicy: ['regular', 'dream', 'super_dream'].includes(c.tierPolicy) ? c.tierPolicy : 'regular',
        contactName: (c.contactName || '').trim(),
        contactEmail,
        accessToken
      };
      if (c._id) normalized._id = c._id;
      // Registered-company invite state is only ever set by the dedicated request/respond
      // endpoints, never by this generic edit form — always carry it forward from the
      // existing entry so a routine drive edit can't silently wipe it.
      if (existing) {
        normalized.company = existing.company || null;
        normalized.requestStatus = existing.requestStatus || 'none';
        if (existing.requestedAt) normalized.requestedAt = existing.requestedAt;
        if (existing.lastResentAt) normalized.lastResentAt = existing.lastResentAt;
        if (existing.respondedAt) normalized.respondedAt = existing.respondedAt;
        if (existing.respondedBy) normalized.respondedBy = existing.respondedBy;
        normalized.conversation = existing.conversation || null;
      }
      return normalized;
    });
};

// @route   POST /api/college/drives
const createDrive = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const { title, batchYear, departments, description, companyName, packageLPA, tierPolicy, companies, eligibility, rounds } = req.body;

    if (!title || !batchYear) {
      const missing = [!title && 'Title', !batchYear && 'Batch year'].filter(Boolean);
      return res.status(400).json({ msg: `${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} required` });
    }

    // Generate URL-safe drive code
    const driveCode = `${college.code || 'CAMP'}-${batchYear}-${crypto.randomBytes(3).toString('hex')}`.toLowerCase();
    const registrationUrl = `${FRONTEND_URL}/campus/${driveCode}`;

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(registrationUrl, { width: 400, margin: 2 });

    const normalizedCompanies = normalizeCompanies(companies) || [];
    const primary = normalizedCompanies[0];

    const drive = new CampusDrive({
      college: college._id,
      title,
      driveCode,
      batchYear,
      departments: departments || [],
      description: description || '',
      companies: normalizedCompanies,
      companyName: primary?.name || companyName || '',
      packageLPA: primary?.packageLPA ?? packageLPA ?? 0,
      tierPolicy: primary?.tierPolicy || tierPolicy || 'regular',
      eligibility: eligibility || undefined,
      rounds: Array.isArray(rounds) ? rounds : [],
      registrationUrl,
      qrCodeUrl,
      createdBy: req.user.id
    });

    await drive.save();
    await logCollegeActivity(req, college, 'drive_created', `Created campus drive ${drive.title}`, 'drive', drive._id);
    res.status(201).json(drive);
  } catch (err) {
    console.error('Create Drive Error:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   GET /api/college/drives
const getDrives = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const drives = await CampusDrive.find({ college: college._id }).sort({ createdAt: -1 });

    // Attach student count per drive (legacy campusDrive field + the newer driveApplications list)
    const drivesWithCounts = await Promise.all(drives.map(async (drive) => {
      const count = await CollegeStudent.countDocuments({
        $or: [{ campusDrive: drive._id }, { 'driveApplications.drive': drive._id }]
      });
      return { ...drive.toObject(), studentCount: count };
    }));

    res.json(drivesWithCounts);
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @route   GET /api/college/drives/:driveId
// Accessible by the owning TPO/admin, or an accepted drive in-charge (see requireDriveAccess in collegeRoutes.js).
const getDriveDetail = async (req, res) => {
  try {
    const drive = req.drive || await CampusDrive.findById(req.params.driveId);
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    const students = await CollegeStudent.find({
      $or: [{ campusDrive: drive._id }, { 'driveApplications.drive': drive._id }]
    })
      .populate('user', 'name email avatar profile.skills')
      .sort({ createdAt: -1 });

    const statusCounts = {};
    const studentsWithApplication = students.map(s => {
      const application = s.driveApplications?.find(da => da.drive.toString() === drive._id.toString());
      const status = application?.status || s.placementStatus;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      return { ...s.toObject(), driveApplication: application || null };
    });

    res.json({ drive, students: studentsWithApplication, statusCounts });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @route   GET /api/college/drives/:driveId/students-export
// Available to the owning TPO or any accepted in-charge (same access as getDriveDetail).
const exportDriveStudents = async (req, res) => {
  try {
    const drive = req.drive || await CampusDrive.findById(req.params.driveId);
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    const students = await CollegeStudent.find({
      $or: [{ campusDrive: drive._id }, { 'driveApplications.drive': drive._id }]
    })
      .populate('user', 'name email profile.phone')
      .sort({ department: 1, rollNumber: 1 });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${(drive.driveCode || 'drive')}_registered_students.csv`);

    let csv = 'Name,Email,Phone,Roll Number,Department,Batch Year,CGPA,Active Arrears,Drive Status,Current Round,Placement Status,ID Verification,Registered On\n';
    students.forEach(s => {
      const application = s.driveApplications?.find(da => da.drive.toString() === drive._id.toString());
      const name = (s.user?.name || '').replace(/,/g, ' ');
      const email = s.user?.email || '—';
      const phone = (s.phone || s.user?.profile?.phone || '—').replace(/,/g, ' ');
      const roll = s.rollNumber || '—';
      const dept = s.department || '—';
      const batch = s.batchYear || '—';
      const cgpa = s.cgpa || 0;
      const arrears = s.activeArrears || 0;
      const driveStatus = application?.status || '—';
      const round = (application?.currentRound || '—').replace(/,/g, ' ');
      const placementStatus = s.placementStatus || '—';
      const idStatus = s.idVerification?.status || 'none';
      const registeredOn = application?.appliedAt ? new Date(application.appliedAt).toLocaleDateString('en-IN') : new Date(s.createdAt).toLocaleDateString('en-IN');
      csv += `${name},${email},${phone},${roll},${dept},${batch},${cgpa},${arrears},${driveStatus},${round},${placementStatus},${idStatus},${registeredOn}\n`;
    });

    res.send(csv);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   GET /api/college/drives/:driveId/companies-export
// Available to the owning TPO or any accepted in-charge
const exportDriveCompanies = async (req, res) => {
  try {
    const drive = req.drive || await CampusDrive.findById(req.params.driveId);
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${(drive.driveCode || 'drive')}_companies.csv`);

    let csv = 'Company Name,Package (LPA),Tier Policy,Contact Name,Contact Email\n';
    (drive.companies || []).forEach(c => {
      const name = (c.name || '').replace(/,/g, ' ');
      const packageLPA = c.packageLPA || 0;
      const tierPolicy = c.tierPolicy || 'regular';
      const contactName = (c.contactName || '').replace(/,/g, ' ');
      const contactEmail = c.contactEmail || '—';
      csv += `${name},${packageLPA},${tierPolicy},${contactName},${contactEmail}\n`;
    });

    res.send(csv);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   PUT /api/college/drives/:driveId
const updateDrive = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const drive = await CampusDrive.findOne({ _id: req.params.driveId, college: college._id });
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    const allowed = ['title', 'batchYear', 'departments', 'description', 'isActive', 'eligibility', 'rounds'];
    allowed.forEach(field => { if (req.body[field] !== undefined) drive[field] = req.body[field]; });

    if (req.body.companies !== undefined) {
      const normalizedCompanies = normalizeCompanies(req.body.companies, drive.companies) || [];
      drive.companies = normalizedCompanies;
      const primary = normalizedCompanies[0];
      drive.companyName = primary?.name || '';
      drive.packageLPA = primary?.packageLPA ?? 0;
      drive.tierPolicy = primary?.tierPolicy || 'regular';
    }

    await drive.save();
    res.json(drive);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   POST /api/college/drives/:driveId/companies/:companyId/send-link
// Emails the company's contact a read-only link (no login) to view/export this drive's
// registered candidates — same trust model as the QR registration link (unguessable token).
const sendCompanyLink = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const drive = await CampusDrive.findOne({ _id: req.params.driveId, college: college._id });
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    const company = drive.companies.id(req.params.companyId);
    if (!company) return res.status(404).json({ msg: 'Company not found on this drive' });
    if (!company.contactEmail) return res.status(400).json({ msg: 'Add a contact email for this company first' });

    if (!company.accessToken) {
      company.accessToken = crypto.randomBytes(16).toString('hex');
      await drive.save();
    }

    const viewUrl = `${FRONTEND_URL}/company-drive/${company.accessToken}`;
    const emailSent = await sendEmail({
      email: company.contactEmail,
      subject: `[Velaivaaipu] Candidates for ${drive.title} — ${college.name}`,
      html: emailWrapper('Campus Drive — Candidate List', `
        <p>Hi ${company.contactName || 'there'},</p>
        <p><strong>${college.name}</strong> has shared the registered candidate list for <strong>${drive.title}</strong> (${company.name}) with you.</p>
        <p><a href="${viewUrl}" style="color:#059669;">View candidates</a></p>
        <p style="font-size:11px;color:#94a3b8;">This link doesn't require a login — keep it confidential, it gives access to candidate contact details.</p>
      `)
    });

    res.json({
      msg: emailSent ? 'Link sent' : 'Could not send the email — share the link below manually.',
      emailSent,
      viewUrl
    });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   GET /api/college/companies/search?query=
// Lets a TPO look up real registered Company accounts to send a formal drive invite to
// (as opposed to just typing a company name in manually via updateDrive).
const searchRegisteredCompanies = async (req, res) => {
  try {
    const query = (req.query.query || '').trim();
    if (!query) return res.json([]);
    const companies = await Company.find({ name: new RegExp(query, 'i') })
      .select('name logo admin_email display_id')
      .limit(10);
    res.json(companies);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// Plan-driven cap on distinct companies a college can formally invite (email + WhatsApp),
// mirroring the ID Verification Badges cap style — campus_elite is unlimited (no entry
// here means "no cap"). Keep in sync with the "Company Drive Invites" feature values in
// scripts/seedCampusPlans.js.
const DRIVE_INVITE_LIMITS = { campus_free: 0, campus_lite: 15, campus_pro: 50 };

// Sends the drive-invite notification via whichever channel(s) the TPO picked — email and
// WhatsApp are independent here, not bundled, so a resend can go out over just one of them.
const sendDriveInviteNotifications = ({ owner, company, college, drive, channels }) => {
  const inviteUrl = `${FRONTEND_URL}/company/drive-requests`;

  if (channels.includes('email')) {
    sendEmail({
      email: owner.email || company.admin_email,
      subject: `[Velaivaaipu] Campus drive invite — ${drive.title}`,
      html: emailWrapper('Campus Drive Invitation', `
        <p>Hi ${owner.name || 'there'},</p>
        <p><strong>${college.name}</strong> has invited your company to participate in their campus drive <strong>${drive.title}</strong>.</p>
        <p><a href="${inviteUrl}" style="color:#059669;">View and respond</a></p>
      `)
    }).catch(() => {});
  }

  if (channels.includes('whatsapp')) {
    const ownerPhone = getUserPhone(owner);
    if (ownerPhone) {
      sendWhatsAppTemplate({
        to: ownerPhone,
        template: 'off_platform_chat_bridge',
        params: [
          owner.name || 'there',
          college.name,
          `an invite to participate in "${drive.title}"`,
          `${college.name} has invited your company to participate in their campus drive "${drive.title}". Log in to accept or reject.`,
          inviteUrl
        ]
      }).catch(() => {});
    }
  }
};

const VALID_CHANNELS = ['email', 'whatsapp'];
const parseChannels = (channels) => {
  const list = Array.isArray(channels) ? channels.filter(c => VALID_CHANNELS.includes(c)) : [];
  return [...new Set(list)];
};

// @route   POST /api/college/drives/:driveId/invite-company/:companyId
// Sends a formal participation request to a real registered Company (distinct from
// send-link above, whose :companyId is a companies[] subdocument id, not a Company._id).
// Opens a message thread immediately so college and company can discuss before the
// company responds. Body: { channels: ['email'|'whatsapp', ...] } — the TPO picks which
// channel(s) to notify through; at least one is required.
const requestCompanyForDrive = async (req, res) => {
  try {
    const channels = parseChannels(req.body.channels);
    if (channels.length === 0) {
      return res.status(400).json({ msg: 'Select at least one channel (Email or WhatsApp) to send the invite through' });
    }

    const college = await getCollegeForTPO(req.user.id);
    const drive = await CampusDrive.findOne({ _id: req.params.driveId, college: college._id });
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    const company = await Company.findById(req.params.companyId);
    if (!company) return res.status(404).json({ msg: 'Company not found' });

    const companyRole = await Role.findOne({ name: 'company' });
    const owner = companyRole
      ? await User.findOne({ company: company._id, role: companyRole._id })
      : null;
    if (!owner) return res.status(400).json({ msg: 'This company has no active owner account yet' });

    let entry = drive.companies.find(c => c.company && c.company.toString() === String(company._id));
    if (entry && entry.requestStatus === 'requested') {
      return res.status(400).json({ msg: 'Already invited, awaiting response. Use Resend instead.' });
    }

    const inviteLimit = DRIVE_INVITE_LIMITS[college.subscriptionTier];
    if (inviteLimit !== undefined) {
      const usedResult = await CampusDrive.aggregate([
        { $match: { college: college._id } },
        { $unwind: '$companies' },
        { $match: { 'companies.requestStatus': { $ne: 'none' } } },
        { $count: 'count' }
      ]);
      const used = usedResult[0]?.count || 0;
      if (used >= inviteLimit) {
        return res.status(403).json({ msg: `Company drive invite limit reached for your plan (${inviteLimit}). Upgrade to invite more companies.` });
      }
    }

    if (entry && entry.requestStatus === 'rejected') {
      entry.requestStatus = 'requested';
      entry.requestedAt = new Date();
      entry.lastResentAt = undefined;
      entry.respondedAt = undefined;
      entry.respondedBy = undefined;
      // Keep the existing conversation so chat history from the earlier round persists.
    } else {
      drive.companies.push({
        name: company.name,
        company: company._id,
        requestStatus: 'requested',
        requestedAt: new Date(),
        packageLPA: 0,
        tierPolicy: 'regular'
      });
      entry = drive.companies[drive.companies.length - 1];
    }

    const conversation = await getOrCreateConversation(req.user.id, owner._id);
    entry.conversation = conversation._id;

    await drive.save();

    sendDriveInviteNotifications({ owner, company, college, drive, channels });

    res.status(201).json({ msg: 'Invite sent', company: entry, conversationId: conversation._id });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   POST /api/college/drives/:driveId/companies/:companyEntryId/resend-invite
// Re-sends the invite notification for a request that's still awaiting a response — doesn't
// change requestStatus/requestedAt, just nudges the company again via the chosen channel(s).
// :companyEntryId is the companies[] subdocument id (see the note on requestCompanyForDrive
// about the two distinct id spaces).
const resendCompanyInvite = async (req, res) => {
  try {
    const channels = parseChannels(req.body.channels);
    if (channels.length === 0) {
      return res.status(400).json({ msg: 'Select at least one channel (Email or WhatsApp) to resend through' });
    }

    const college = await getCollegeForTPO(req.user.id);
    const drive = await CampusDrive.findOne({ _id: req.params.driveId, college: college._id });
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    const entry = drive.companies.id(req.params.companyEntryId);
    if (!entry || !entry.company) return res.status(404).json({ msg: 'Request not found' });
    if (entry.requestStatus !== 'requested') {
      return res.status(400).json({ msg: 'This request is no longer awaiting a response' });
    }

    const company = await Company.findById(entry.company);
    if (!company) return res.status(404).json({ msg: 'Company not found' });

    const companyRole = await Role.findOne({ name: 'company' });
    const owner = companyRole
      ? await User.findOne({ company: entry.company, role: companyRole._id })
      : null;
    if (!owner) return res.status(400).json({ msg: 'This company has no active owner account yet' });

    entry.lastResentAt = new Date();
    await drive.save();

    sendDriveInviteNotifications({ owner, company, college, drive, channels });

    res.json({ msg: 'Invite resent', company: entry });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   DELETE /api/college/drives/:driveId
// Only permitted once the drive has been closed (isActive: false) — hard delete removes it
// from the TPO panel entirely and pulls it out of every student's driveApplications.
const deleteDrive = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const drive = await CampusDrive.findOne({ _id: req.params.driveId, college: college._id });
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });
    if (drive.isActive) return res.status(400).json({ msg: 'Close the drive before deleting it' });

    await CollegeStudent.updateMany(
      { 'driveApplications.drive': drive._id },
      { $pull: { driveApplications: { drive: drive._id } } }
    );
    await CollegeStudent.updateMany({ campusDrive: drive._id }, { $set: { campusDrive: null } });
    await CampusDrive.deleteOne({ _id: drive._id });

    res.json({ msg: 'Drive deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   GET /api/college/drives/:driveId/regenerate-qr
const regenerateQR = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const drive = await CampusDrive.findOne({ _id: req.params.driveId, college: college._id });
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    drive.qrCodeUrl = await QRCode.toDataURL(drive.registrationUrl, { width: 400, margin: 2 });
    await drive.save();
    res.json({ qrCodeUrl: drive.qrCodeUrl });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

// ─── DRIVE IN-CHARGE ────────────────────────────────────────────────────────

// @route   POST /api/college/drives/:driveId/incharge/invite
// Builds the accept-invite link and sends (and awaits) the invite email — used by both the
// initial invite and the resend action. Never fire-and-forget: an un-awaited send can be
// silently dropped (swallowed errors, or the request finishing before the promise settles
// on some hosts), which is exactly what was happening before.
const sendInchargeInviteEmail = async (college, drive, invite) => {
  const acceptUrl = `${FRONTEND_URL}/incharge/accept/${drive._id}/${invite.inviteToken}`;
  const emailSent = await sendEmail({
    email: invite.email,
    subject: `[Velaivaaipu] You've been invited as Drive In-Charge — ${drive.title}`,
    html: `<p>Hi ${invite.name},</p><p>${college.name} has invited you to manage the campus drive "<b>${drive.title}</b>" on Velaivaaipu.</p><p>Click below and confirm the email and phone number this invite was sent to, in order to set up your access:</p><p><a href="${acceptUrl}">${acceptUrl}</a></p><p>This link expires in 7 days.</p>`
  });
  return { acceptUrl, emailSent };
};

const inviteIncharge = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const drive = await CampusDrive.findOne({ _id: req.params.driveId, college: college._id });
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    const { name, email, phone, assignedCompanies } = req.body;
    if (!name || !email || !phone) return res.status(400).json({ msg: 'Name, email, and phone are required' });

    const inviteToken = crypto.randomBytes(24).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    drive.inCharges.push({
      name,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      status: 'invited',
      inviteToken,
      inviteTokenExpiry,
      assignedCompanies: Array.isArray(assignedCompanies) ? assignedCompanies : []
    });
    await drive.save();

    const invite = drive.inCharges[drive.inCharges.length - 1];
    const { acceptUrl, emailSent } = await sendInchargeInviteEmail(college, drive, invite);

    res.status(201).json({
      msg: emailSent ? 'Invite sent' : 'Invite created, but the email failed to send — share the link below manually or use Resend.',
      inCharge: invite,
      emailSent,
      acceptUrl
    });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   POST /api/college/drives/:driveId/incharge/:inchargeId/resend
const resendInchargeInvite = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const drive = await CampusDrive.findOne({ _id: req.params.driveId, college: college._id });
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    const invite = drive.inCharges.id(req.params.inchargeId);
    if (!invite) return res.status(404).json({ msg: 'Invite not found' });
    if (invite.status === 'accepted') return res.status(400).json({ msg: 'This invite has already been accepted' });

    // Refresh the token/expiry in case the previous one already expired.
    invite.inviteToken = crypto.randomBytes(24).toString('hex');
    invite.inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await drive.save();

    const { acceptUrl, emailSent } = await sendInchargeInviteEmail(college, drive, invite);

    res.json({
      msg: emailSent ? 'Invite resent' : 'Could not send the email — share the link below manually.',
      emailSent,
      acceptUrl
    });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   DELETE /api/college/drives/:driveId/incharge/:inchargeId
// Removes an in-charge (invited or already accepted) from a drive. Does not touch their User
// account — only their access to this specific drive via CampusDrive.inCharges.
const removeIncharge = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const drive = await CampusDrive.findOne({ _id: req.params.driveId, college: college._id });
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    const invite = drive.inCharges.id(req.params.inchargeId);
    if (!invite) return res.status(404).json({ msg: 'In-charge not found' });

    invite.deleteOne();
    await drive.save();

    res.json({ msg: 'In-charge removed' });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   GET /api/college/drives/incharge/verify/:driveId/:token (public)
const verifyInchargeInvite = async (req, res) => {
  try {
    const drive = await CampusDrive.findById(req.params.driveId).populate('college', 'name');
    if (!drive) return res.status(404).json({ msg: 'Invite not found' });

    const invite = drive.inCharges.find(ic => ic.inviteToken === req.params.token);
    if (!invite) return res.status(404).json({ msg: 'Invite not found' });
    if (invite.status === 'accepted') return res.status(400).json({ msg: 'This invite has already been accepted' });
    if (invite.inviteTokenExpiry && invite.inviteTokenExpiry < new Date()) {
      return res.status(400).json({ msg: 'This invite link has expired' });
    }

    const existingUser = await User.findOne({ email: invite.email });

    res.json({
      driveTitle: drive.title,
      collegeName: drive.college?.name,
      name: invite.name,
      email: invite.email,
      phone: invite.phone,
      alreadyRegistered: !!existingUser
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

const findValidInvite = async (driveId, token) => {
  const drive = await CampusDrive.findById(driveId);
  if (!drive) return { error: 'Invite not found' };
  const invite = drive.inCharges.find(ic => ic.inviteToken === token);
  if (!invite) return { error: 'Invite not found' };
  if (invite.status === 'accepted') return { error: 'This invite has already been accepted' };
  if (invite.inviteTokenExpiry && invite.inviteTokenExpiry < new Date()) return { error: 'This invite link has expired' };
  return { drive, invite };
};

// @route   POST /api/college/drives/incharge/accept-existing/:driveId/:token (public)
// For an invitee who already has a platform account: verifies their existing credentials,
// then links their existing account to this drive — they keep their own role and login,
// and simply gain a "Manage Drive" capability for this drive.
const acceptInchargeInviteExisting = async (req, res) => {
  try {
    const { drive, invite, error } = await findValidInvite(req.params.driveId, req.params.token);
    if (error) return res.status(400).json({ msg: error });

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Email and password are required' });
    if (email.toLowerCase().trim() !== invite.email) {
      return res.status(400).json({ msg: 'Email does not match the invite sent to you' });
    }

    const user = await User.findOne({ email: invite.email }).populate('role');
    if (!user) return res.status(404).json({ msg: 'No account found for this email — use the register option instead' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Incorrect password' });

    invite.user = user._id;
    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    await drive.save();

    const roleName = user.role.name;
    const token = jwt.sign({ id: user._id, role: roleName }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '365d' });

    res.json({
      msg: 'Invite accepted — Manage Drive access added to your account',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: roleName, avatar: user.avatar },
      driveId: drive._id
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   POST /api/college/drives/incharge/accept-new/:driveId/:token (public)
const acceptInchargeInviteNew = async (req, res) => {
  try {
    const { drive, invite, error } = await findValidInvite(req.params.driveId, req.params.token);
    if (error) return res.status(400).json({ msg: error });

    const { email, phone, password } = req.body;
    if (!email || !phone || !password) return res.status(400).json({ msg: 'Email, phone and password are required' });
    if (email.toLowerCase().trim() !== invite.email) {
      return res.status(400).json({ msg: 'Email does not match the invite sent to you' });
    }

    let user = await User.findOne({ email: invite.email });
    if (user) return res.status(400).json({ msg: 'Account already exists — use the existing login option instead' });

    const roleDoc = await Role.findOne({ name: 'drive_incharge' });
    if (!roleDoc) return res.status(500).json({ msg: 'Drive in-charge role not configured' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name: invite.name,
      email: invite.email,
      password: hashedPassword,
      role: roleDoc._id,
      isVerified: true, // Auto verify since they received the invite on email
      isSocialIncomplete: true,
      profile: { phone }
    });
    await user.save();

    invite.user = user._id;
    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    await drive.save();

    const token = jwt.sign({ id: user._id, role: 'drive_incharge' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '365d' });

    res.json({
      msg: 'Invite accepted — Drive access granted',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: 'drive_incharge', avatar: user.avatar, hasInchargeDrives: true },
      driveId: drive._id
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   POST /api/college/drives/incharge/link/:driveId/:token (authenticated)
// Called right after a brand-new invitee finishes normal registration + OTP verification,
// to attach their freshly created account to this drive as an accepted in-charge.
const linkInchargeInvite = async (req, res) => {
  try {
    const { drive, invite, error } = await findValidInvite(req.params.driveId, req.params.token);
    if (error) return res.status(400).json({ msg: error });

    const user = await User.findById(req.user.id);
    if (!user || user.email !== invite.email) {
      return res.status(400).json({ msg: 'This invite was sent to a different email address' });
    }

    invite.user = user._id;
    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    await drive.save();

    res.json({ msg: 'Manage Drive access added to your account', driveId: drive._id });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   GET /api/college/me/incharge-drives (authenticated, any role)
// Drives the current user has accepted an in-charge invite for — surfaced regardless of
// their primary role (jobseeker, recruiter, company, college, ...), so "Manage Drive" is a
// capability layered on top of whatever account they already have.
const getMyInchargeDrives = async (req, res) => {
  try {
    const drives = await CampusDrive.find({
      inCharges: { $elemMatch: { user: req.user.id, status: 'accepted' } }
    }).populate('college', 'name code logo').sort({ createdAt: -1 });
    res.json(drives);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// ─── STUDENTS ───────────────────────────────────────────────────────────────

// @route   GET /api/college/students
const getStudents = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const { department, batchYear, status, search, includePending, page = 1, limit = 20, sort } = req.query;

    const filter = { college: college._id };
    if (department) filter.department = department;
    if (batchYear) filter.batchYear = parseInt(batchYear);
    if (status) filter.placementStatus = status;

    const andConditions = [];
    // Self-registered students still awaiting ID verification only show in the Verification queue,
    // not the main Students list — until the TPO approves them (per spec: "self registered" source).
    if (!includePending) {
      andConditions.push({
        $or: [
          { registrationSource: { $ne: 'self' } },
          { 'idVerification.status': { $ne: 'pending' } }
        ]
      });
    }
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchingUsers = await User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id');
      andConditions.push({
        $or: [
          { user: { $in: matchingUsers.map(u => u._id) } },
          { rollNumber: regex }
        ]
      });
    }
    if (andConditions.length) filter.$and = andConditions;

    let students, total;
    // "Browse all" mode (no course/year picked): sort year-wise then alphabetically by name.
    // Requires a $lookup since student name lives on the populated User doc.
    if (sort === 'name') {
      [students, total] = await Promise.all([
        CollegeStudent.aggregate([
          { $match: filter },
          { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
          { $unwind: '$user' },
          { $sort: { batchYear: -1, 'user.name': 1 } },
          { $skip: (parseInt(page) - 1) * parseInt(limit) },
          { $limit: parseInt(limit) },
          { $project: {
              department: 1, batchYear: 1, rollNumber: 1, cgpa: 1, activeArrears: 1, phone: 1,
              placementStatus: 1, idVerification: 1, registrationSource: 1, createdAt: 1,
              'user._id': 1, 'user.name': 1, 'user.email': 1, 'user.avatar': 1, 'user.profile': 1, 'user.isVerified': 1
            }
          }
        ]).collation({ locale: 'en', strength: 2 }),
        CollegeStudent.countDocuments(filter)
      ]);
    } else {
      const query = CollegeStudent.find(filter)
        .populate('user', 'name email avatar profile.skills profile.phone profile.resumeUrl isVerified')
        .populate('campusDrive', 'title driveCode batchYear')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

      [students, total] = await Promise.all([
        query,
        CollegeStudent.countDocuments(filter)
      ]);
    }

    const studentsWithCompletion = students.map(student => {
      const raw = student.toObject ? student.toObject() : student;
      return { ...raw, profileCompletion: completionForStudent(raw) };
    });
    res.json({ students: studentsWithCompletion, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Distinct academic/batch years in use for this college (from drives created and students on record)
// @route   GET /api/college/academic-years
const getAcademicYears = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const [driveYears, studentYears] = await Promise.all([
      CampusDrive.distinct('batchYear', { college: college._id }),
      CollegeStudent.distinct('batchYear', { college: college._id })
    ]);
    const years = [...new Set([...driveYears, ...studentYears])]
      .filter(y => y !== null && y !== undefined)
      .sort((a, b) => b - a);
    res.json({ years });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @route   GET /api/college/students/:id
const getStudentDetail = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const student = await CollegeStudent.findOne({ _id: req.params.id, college: college._id })
      .populate('user', '-password')
      .populate('campusDrive', 'title driveCode batchYear')
      .populate('driveApplications.drive', 'title driveCode companyName isActive');

    if (!student) return res.status(404).json({ msg: 'Student not found' });

    // Fetch applications for this student
    const applications = await Application.find({ applicant: student.user._id })
      .populate('job', 'title company')
      .sort({ createdAt: -1 })
      .limit(20);

    // Login/logout activity (spec: TPO-visible activity monitoring). Send a generous slice
    // (not just the last 20) so the client can paginate through real history instead of only
    // ever seeing the most recent handful — 200 is a sanity cap, not a hard product limit.
    const sessions = (student.user?.sessionLogs || []).slice(-200).reverse();
    const totalMinutes = (student.user?.sessionLogs || []).reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const loginActivity = {
      lastLoginAt: student.user?.lastLoginAt || null,
      lastLogoutAt: student.user?.lastLogoutAt || null,
      totalMinutes,
      sessions
    };

    res.json({ student, applications, loginActivity });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @route   PUT /api/college/students/:id/status
const updateStudentStatus = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const { status } = req.body;
    const validStatuses = ['unplaced', 'registered', 'active', 'applied', 'shortlisted', 'interviewing', 'placed', 'opted_out'];
    if (!validStatuses.includes(status)) return res.status(400).json({ msg: 'Invalid status' });
    if (status === 'placed') return res.status(400).json({ msg: 'Use the Accreditation Placement Record and upload the offer letter before marking a student placed' });

    const student = await CollegeStudent.findOneAndUpdate(
      { _id: req.params.id, college: college._id },
      { placementStatus: status },
      { new: true }
    );
    if (!student) return res.status(404).json({ msg: 'Student not found' });
    await logCollegeActivity(req, college, 'student_status_updated', `Updated a student’s placement status to ${status}`, 'student', student._id, { status });
    res.json(student);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @route   PUT /api/college/students/:id
// Edits the CollegeStudent record's own fields (not the underlying User account's name/email).
const updateStudentDetails = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const allowed = ['department', 'batchYear', 'rollNumber', 'cgpa', 'activeArrears', 'phone'];
    const update = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) update[field] = req.body[field]; });
    if (update.phone !== undefined) update.whatsappNumber = update.phone;

    const student = await CollegeStudent.findOneAndUpdate(
      { _id: req.params.id, college: college._id },
      update,
      { new: true }
    ).populate('user', 'name email avatar profile.skills profile.phone profile.resumeUrl isVerified');
    if (!student) return res.status(404).json({ msg: 'Student not found' });
    await logCollegeActivity(req, college, 'student_updated', 'Updated student academic/profile details', 'student', student._id, { fields: Object.keys(update) });
    res.json(student);
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   DELETE /api/college/students/:id
// Removes the student from this college only — the underlying User (job seeker) account is untouched.
const deleteStudent = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const student = await CollegeStudent.findOneAndDelete({ _id: req.params.id, college: college._id });
    if (!student) return res.status(404).json({ msg: 'Student not found' });
    res.json({ msg: 'Student removed' });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   POST /api/college/students/bulk-delete
// Same semantics as deleteStudent, applied to many students at once — scoped to this college only.
const bulkDeleteStudents = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ msg: 'No students selected' });
    }
    const result = await CollegeStudent.deleteMany({ _id: { $in: studentIds }, college: college._id });
    res.json({ msg: `${result.deletedCount} student(s) removed`, deletedCount: result.deletedCount });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// ─── CSV IMPORT ─────────────────────────────────────────────────────────────

// @route   POST /api/college/students/csv-import
const csvImport = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);

    // CSV Bulk Student Upload is available on every Campus tier including Free — see the plan matrix.

    if (!req.file) return res.status(400).json({ msg: 'Please upload a CSV file' });

    const csvContent = req.file.buffer.toString('utf-8');
    let records;
    try {
      records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
    } catch (parseErr) {
      return res.status(400).json({ msg: 'Invalid CSV format', error: parseErr.message });
    }

    const jobseekerRole = await Role.findOne({ name: 'jobseeker' });
    if (!jobseekerRole) return res.status(500).json({ msg: 'Jobseeker role not found' });

    const driveId = req.body.driveId;
    let drive = null;
    if (driveId) {
      drive = await CampusDrive.findOne({ _id: driveId, college: college._id });
    }

    const results = { imported: 0, skipped: 0, errors: [] };

    // Get current total students for limit check
    const currentStudentCount = await CollegeStudent.countDocuments({ college: college._id });
    const studentLimit = college.studentLimit || 100;

    for (let i = 0; i < records.length; i++) {
      if (currentStudentCount + results.imported >= studentLimit) {
        results.errors.push({ row: i + 2, reason: 'Student limit reached for current plan.' });
        continue;
      }
      
      const row = records[i];
      const rowNum = i + 2; // 1-indexed + header row
      const name = (row.name || row.Name || '').trim();
      const department = (row.department || row.Department || '').trim();
      const batchYear = parseInt(row.batchYear || row.BatchYear || row.batch_year || new Date().getFullYear());
      const rollNumber = (row.rollNumber || row.RollNumber || row.roll_number || '').trim();
      const phone = (row.phone || row.Phone || row.whatsapp || '').trim();
      let email = (row.email || row.Email || '').toLowerCase().trim();
      const cgpa = parseFloat(row.cgpa || row.CGPA || 0);
      const activeArrears = parseInt(row.activeArrears || row.arrears || row.Arrears || 0);
      const skills = (row.skills || row.Skills || '')
        .split(/[,;]/)
        .map(s => s.trim())
        .filter(Boolean);
      const accreditationOutcome = (row.outcome || row.Outcome || '').trim();
      const offerSourceRaw = (row.offerSource || row.offer_source || '').trim();
      const normalizedOfferSource = offerSourceRaw.toLowerCase().startsWith('campus drive') ? 'Campus drive'
        : offerSourceRaw.toLowerCase() === 'pool campus drive' ? 'Pool campus drive'
        : offerSourceRaw.toLowerCase().startsWith('off-campus') ? 'Off-campus, verified'
        : offerSourceRaw.toLowerCase() === 'platform application' ? 'Platform application' : '';
      const accreditationData = accreditationOutcome ? {
        gender: (row.gender || '').trim(),
        programme: (row.programme || '').trim(),
        outcome: accreditationOutcome,
        placement: {
          employerName: (row.employerName || row.employer_name || '').trim(),
          employerCity: (row.employerCity || row.employer_city || '').trim(),
          designation: (row.designation || '').trim(),
          packageLPA: parseFloat(row.packageLPA || row.package_lpa || 0) || 0,
          offerDate: row.offerDate || row.offer_date || null,
          offerSource: normalizedOfferSource,
          driveReference: (row.driveReference || row.drive_reference || '').trim(),
          evidenceUrl: (row.evidenceRef || row.evidence_ref || '').trim(),
          verifiedBy: accreditationOutcome === 'Placed' ? req.user.id : null,
          verifiedOn: accreditationOutcome === 'Placed' ? (row.verifiedOn || row.verified_on || new Date()) : null
        },
        progression: {
          type: (row.progressionType || row.progression_type || '').trim() || (['Higher Studies', 'Qualified Competitive Exam'].includes(accreditationOutcome) ? accreditationOutcome : ''),
          institutionJoined: (row.institutionJoined || row.institution_joined || '').trim(),
          programmeJoined: (row.programmeJoined || row.programme_joined || '').trim(),
          evidenceUrl: (row.progressionEvidenceRef || row.progression_evidence_ref || '').trim()
        }
      } : null;

      if (!name || !rollNumber) {
        results.errors.push({ row: rowNum, reason: 'Missing student name or roll number' });
        continue;
      }

      // If email is not in CSV, generate a campus email based on roll number & college code
      if (!email) {
        const cleanRoll = rollNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanCode = (college.code || 'campus').toLowerCase().replace(/[^a-z0-9]/g, '');
        email = `${cleanRoll}@${cleanCode}.portal`;
      }

      try {
        // Default password is phone number (if phone is empty, fallback to rollNumber)
        const defaultPassword = phone || rollNumber;

        // Find or create user
        let user = await User.findOne({ $or: [{ email }, { 'profile.phone': phone, email: { $exists: true } }] });
        if (!user) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(defaultPassword, salt);

          user = new User({
            name,
            email,
            password: hashedPassword,
            role: jobseekerRole._id,
            isVerified: true,
            profile: {
              phone: phone || '',
              skills,
              education: [{
                institution: college.name,
                degree: department || 'B.Tech / B.E.',
                fieldOfStudy: department || '',
                startYear: batchYear - 4,
                endYear: batchYear,
                grade: cgpa ? `${cgpa} CGPA` : ''
              }]
            }
          });
          await user.save();
        } else if (skills.length > 0 && (!user.profile?.skills || user.profile.skills.length === 0)) {
          user.profile.skills = skills;
          await user.save();
        }

        // Check if already linked to this college
        let collegeStudent = await CollegeStudent.findOne({ user: user._id, college: college._id });
        if (collegeStudent) {
          // Update details if already exists
          collegeStudent.rollNumber = rollNumber || collegeStudent.rollNumber;
          collegeStudent.phone = phone || collegeStudent.phone;
          collegeStudent.department = department || collegeStudent.department;
          collegeStudent.batchYear = batchYear || collegeStudent.batchYear;
          collegeStudent.cgpa = cgpa || collegeStudent.cgpa;
          collegeStudent.activeArrears = activeArrears !== undefined ? activeArrears : collegeStudent.activeArrears;
          if (accreditationData) {
            collegeStudent.accreditation = accreditationData;
            if (accreditationOutcome === 'Placed') collegeStudent.placementStatus = 'placed';
          }
          if (drive && !collegeStudent.driveApplications.some(da => da.drive.toString() === drive._id.toString())) {
            collegeStudent.driveApplications.push({ drive: drive._id, status: 'registered' });
          }
          await collegeStudent.save();
          results.skipped++;
          continue;
        }

        collegeStudent = new CollegeStudent({
          user: user._id,
          college: college._id,
          campusDrive: drive?._id || null,
          driveApplications: drive ? [{ drive: drive._id, status: 'registered' }] : [],
          department,
          batchYear: batchYear || null,
          rollNumber,
          phone: phone || '',
          cgpa: cgpa || 0,
          activeArrears: activeArrears || 0,
          registrationSource: 'csv',
          whatsappNumber: phone,
          placementStatus: 'registered'
        });
        if (accreditationData) {
          collegeStudent.accreditation = accreditationData;
          if (accreditationOutcome === 'Placed') collegeStudent.placementStatus = 'placed';
        }
        await collegeStudent.save();
        results.imported++;

        if (phone) {
          sendWhatsAppMessage({
            to: phone,
            template: 'campus_welcome',
            variables: { name, collegeName: college.name },
            message: `Welcome to ${college.name}'s placement portal on Velaivaaipu, ${name}! Complete your profile to get matched with real openings.`
          }).catch(() => {});
        }
      } catch (rowErr) {
        results.errors.push({ row: rowNum, reason: rowErr.message });
      }
    }

    res.json(results);
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    console.error('CSV Import Error:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   GET /api/college/students/csv-template
const getCsvTemplate = async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.csv');
  res.send('rollNumber,name,phone,email,department,batchYear,cgpa,activeArrears,skills,gender,programme,outcome,employerName,employerCity,designation,packageLPA,offerDate,offerSource,driveReference,evidenceRef,progressionType,institutionJoined,programmeJoined,progressionEvidenceRef\nCS001,John Doe,9876543210,john@college.edu,CSE,2026,8.4,0,"Java;SQL;Communication",Male,B.E. Computer Science and Engineering,Placed,TCS,Chennai,Software Engineer,5.50,2026-04-15,Campus drive,DRV-2026-001,OFFER-CS001.pdf,,,,\nIT002,Jane Smith,9876543211,jane@college.edu,IT,2026,7.9,0,"Python;Excel",Female,B.Tech Information Technology,Higher Studies,,,,,,,,Higher Studies,IIT Madras,M.Tech Information Technology,ADM-IT002.pdf\n');
};

const completionForStudent = (student) => {
  const profile = student.user?.profile || {};
  const checks = [
    ['name', Boolean(student.user?.name)], ['email', Boolean(student.user?.email)],
    ['phone', Boolean(student.phone || profile.phone)], ['department', Boolean(student.department)],
    ['batchYear', Boolean(student.batchYear)], ['rollNumber', Boolean(student.rollNumber)],
    ['cgpa', Number(student.cgpa) > 0], ['resume', Boolean(profile.resumeUrl)],
    ['skills', Array.isArray(profile.skills) && profile.skills.length > 0],
    ['qualification', Array.isArray(profile.qualification) && profile.qualification.length > 0],
    ['preferences', Boolean(profile.jobPreferences?.jobTitles?.length || profile.preferredRole)],
    ['idVerification', student.idVerification?.status === 'approved']
  ];
  const missingFields = checks.filter(([, ok]) => !ok).map(([field]) => field);
  return { score: Math.round(((checks.length - missingFields.length) / checks.length) * 100), missingFields };
};

const logCollegeActivity = async (req, college, action, description, entityType = 'college', entity = null, metadata = {}) => {
  const actor = await User.findById(req.user.id).select('name');
  return CollegeActivityLog.create({ college: college._id, actor: req.user.id, actorName: actor?.name || 'College user', action, description, entityType, entity, metadata });
};

// @route   GET /api/college/students/credentials-export
const exportCredentialsSheet = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const students = await CollegeStudent.find({ college: college._id, registrationSource: 'csv' })
      .populate('user', 'name email profile')
      .sort({ rollNumber: 1 });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${college.code || 'campus'}_student_credentials.csv`);

    let csv = 'Roll Number,Student Name,Login Email/ID,Default Password (Phone),Department,Batch Year,CGPA,Arrears,Status\n';
    students.forEach(s => {
      const roll = s.rollNumber || '—';
      const name = (s.user?.name || '').replace(/,/g, ' ');
      const email = s.user?.email || '—';
      const defaultPass = s.phone || s.user?.profile?.phone || roll;
      const dept = s.department || '—';
      const batch = s.batchYear || '—';
      const cgpa = s.cgpa || 0;
      const arrears = s.activeArrears || 0;
      const status = s.placementStatus || 'registered';
      csv += `${roll},${name},${email},${defaultPass},${dept},${batch},${cgpa},${arrears},${status}\n`;
    });

    res.send(csv);
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Failed to export credentials', error: err.message });
  }
};

// ─── ID VERIFICATION ────────────────────────────────────────────────────────

// @route   POST /api/college/students/:id/verify
const verifyStudent = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const { action, reason } = req.body; // action: 'approve' or 'reject'

    const student = await CollegeStudent.findOne({ _id: req.params.id, college: college._id }).populate('user', 'name email');
    if (!student) return res.status(404).json({ msg: 'Student not found' });

    // Campus Lite caps ID Verification Badges at 250 students; Free/Pro/Elite are unlimited
    // (Free is manual-queue-only anyway — no bulk/auto path exists to need a cap). Only check
    // when actually transitioning into 'approved', so re-clicking an already-approved student
    // isn't counted twice.
    if (action === 'approve' && student.idVerification.status !== 'approved' && college.subscriptionTier === 'campus_lite') {
      const approvedCount = await CollegeStudent.countDocuments({ college: college._id, 'idVerification.status': 'approved' });
      if (approvedCount >= 250) {
        return res.status(403).json({ msg: 'ID verification limit reached for the Campus Lite plan (250 students). Upgrade to Campus Pro for unlimited verifications.' });
      }
    }

    if (action === 'approve') {
      student.idVerification.status = 'approved';
      student.idVerification.verifiedBy = req.user.id;
      student.idVerification.verifiedAt = new Date();
    } else if (action === 'reject') {
      student.idVerification.status = 'rejected';
      student.idVerification.rejectionReason = reason || '';
      student.idVerification.verifiedBy = req.user.id;
      student.idVerification.verifiedAt = new Date();
    } else {
      return res.status(400).json({ msg: 'Action must be approve or reject' });
    }

    await student.save();

    if (student.user?.email) {
      const approved = action === 'approve';
      sendEmail({
        email: student.user.email,
        subject: approved ? 'Your college ID verification was approved' : 'Your college ID verification needs attention',
        html: emailWrapper(approved ? 'ID Verification Approved' : 'ID Verification Rejected', `
          <p>Hi ${student.user.name || 'there'},</p>
          ${approved
            ? `<p>Your student ID verification for <strong>${college.name}</strong> has been approved. You now have full access to campus placement drives.</p>`
            : `<p>Your student ID verification for <strong>${college.name}</strong> was rejected.${reason ? ` Reason: <strong>${reason}</strong>` : ''} Please re-upload a valid document.</p>`}
        `)
      }).catch(() => {});
    }
    const studentPhone = student.whatsappNumber || student.phone;
    if (studentPhone) {
      const approved = action === 'approve';
      sendWhatsAppTemplate({
        to: studentPhone,
        template: 'verification_approval_notification',
        params: [
          student.user?.name || 'there',
          'ID Verification',
          approved ? 'Approved' : 'Rejected',
          approved ? 'Verification successful! You now have full access to campus placement drives.' : (reason || 'Please re-upload a valid document'),
          `${FRONTEND_URL}/jobseeker/campus-drives`
        ]
      }).catch(() => {});
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @route   GET /api/college/verification
const getVerificationQueue = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const students = await CollegeStudent.find({
      college: college._id,
      'idVerification.status': { $in: ['pending'] }
    })
    .populate('user', 'name email avatar')
    .sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error' });
  }
};

// ─── PUBLIC ENDPOINTS (campus registration) ─────────────────────────────────

// @route   GET /api/college/public/drive/:driveCode
const getPublicDrive = async (req, res) => {
  try {
    const drive = await CampusDrive.findOne({ driveCode: req.params.driveCode, isActive: true })
      .populate('college', 'name code logo location departments verificationStatus');

    if (!drive) return res.status(404).json({ msg: 'Drive not found or inactive' });
    if (drive.college?.verificationStatus !== 'verified') {
      return res.status(403).json({ msg: 'This institution is pending platform verification' });
    }
    res.json(drive);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Shared lookup for the two company-facing endpoints below — finds the drive and the specific
// company entry by its unguessable accessToken (no login required, same trust model as the
// drive registration QR link).
const findDriveByCompanyToken = async (token) => {
  const drive = await CampusDrive.findOne({ 'companies.accessToken': token }).populate('college', 'name logo');
  if (!drive) return null;
  const company = drive.companies.find(c => c.accessToken === token);
  return company ? { drive, company } : null;
};

// @route   GET /api/college/public/company-drive/:token
const getCompanyDriveView = async (req, res) => {
  try {
    const found = await findDriveByCompanyToken(req.params.token);
    if (!found) return res.status(404).json({ msg: 'Invalid or expired link' });
    const { drive, company } = found;

    const students = await CollegeStudent.find({
      $or: [{ campusDrive: drive._id }, { 'driveApplications.drive': drive._id }]
    })
      .populate('user', 'name email profile.skills profile.resumeUrl profile.phone')
      .sort({ department: 1, rollNumber: 1 });

    const studentsWithApplication = students.map(s => {
      const application = s.driveApplications?.find(da => da.drive.toString() === drive._id.toString());
      return {
        name: s.user?.name || '—',
        email: s.user?.email || '—',
        phone: s.phone || s.user?.profile?.phone || '—',
        rollNumber: s.rollNumber || '—',
        department: s.department || '—',
        batchYear: s.batchYear || '—',
        cgpa: s.cgpa || 0,
        skills: s.user?.profile?.skills || [],
        resumeUrl: s.user?.profile?.resumeUrl || '',
        status: application?.status || 'registered'
      };
    });

    res.json({
      drive: { title: drive.title, driveCode: drive.driveCode, batchYear: drive.batchYear, description: drive.description },
      college: { name: drive.college?.name, logo: drive.college?.logo },
      company: { name: company.name, packageLPA: company.packageLPA, tierPolicy: company.tierPolicy },
      students: studentsWithApplication
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   GET /api/college/public/company-drive/:token/export
const exportCompanyDriveStudents = async (req, res) => {
  try {
    const found = await findDriveByCompanyToken(req.params.token);
    if (!found) return res.status(404).json({ msg: 'Invalid or expired link' });
    const { drive } = found;

    const students = await CollegeStudent.find({
      $or: [{ campusDrive: drive._id }, { 'driveApplications.drive': drive._id }]
    })
      .populate('user', 'name email profile.phone')
      .sort({ department: 1, rollNumber: 1 });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${(drive.driveCode || 'drive')}_candidates.csv`);

    let csv = 'Name,Email,Phone,Roll Number,Department,Batch Year,CGPA,Status\n';
    students.forEach(s => {
      const application = s.driveApplications?.find(da => da.drive.toString() === drive._id.toString());
      const name = (s.user?.name || '').replace(/,/g, ' ');
      const email = s.user?.email || '—';
      const phone = (s.phone || s.user?.profile?.phone || '—').replace(/,/g, ' ');
      csv += `${name},${email},${phone},${s.rollNumber || '—'},${s.department || '—'},${s.batchYear || '—'},${s.cgpa || 0},${application?.status || 'registered'}\n`;
    });

    res.send(csv);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   POST /api/college/public/drive/:driveCode/register
const publicRegister = async (req, res) => {
  try {
    const drive = await CampusDrive.findOne({ driveCode: req.params.driveCode, isActive: true })
      .populate('college');
    if (!drive) return res.status(404).json({ msg: 'Drive not found or inactive' });
    if (drive.college?.verificationStatus !== 'verified') {
      return res.status(403).json({ msg: 'This institution is pending platform verification' });
    }

    const { name, email, whatsapp, department, rollNumber, source } = req.body;
    if (!name || !email) return res.status(400).json({ msg: 'Name and email are required' });

    const normalizedEmail = email.toLowerCase().trim();
    const jobseekerRole = await Role.findOne({ name: 'jobseeker' });

    // Find or create user account
    let user = await User.findOne({ email: normalizedEmail });
    let isNewUser = false;

    if (!user) {
      const tempPassword = crypto.randomBytes(8).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      user = new User({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: jobseekerRole._id,
        isVerified: true,
        profile: { phone: whatsapp || '' }
      });
      await user.save();
      isNewUser = true;
    }

    // Check if already registered for this college
    let collegeStudent = await CollegeStudent.findOne({ user: user._id, college: drive.college._id });
    if (collegeStudent) {
      return res.json({
        msg: 'Already registered for this college',
        alreadyRegistered: true,
        studentId: collegeStudent._id,
        userId: user._id
      });
    }

    // Enforce the college's plan-driven student capacity — this is the self-registration path,
    // so unlike CSV import there's no admin around to see a partial-import error; block cleanly.
    const currentStudentCount = await CollegeStudent.countDocuments({ college: drive.college._id });
    const studentLimit = drive.college.studentLimit || 100;
    if (currentStudentCount >= studentLimit) {
      return res.status(403).json({ msg: 'This college has reached its student capacity for the current plan. Please contact your placement officer.' });
    }

    collegeStudent = new CollegeStudent({
      user: user._id,
      college: drive.college._id,
      campusDrive: drive._id,
      driveApplications: [{ drive: drive._id, status: 'registered' }],
      department: department || '',
      batchYear: drive.batchYear,
      rollNumber: rollNumber || '',
      registrationSource: source === 'qr' ? 'qr' : 'self',
      whatsappNumber: whatsapp || '',
      placementStatus: 'registered'
    });
    await collegeStudent.save();

    res.status(201).json({
      msg: 'Registration successful',
      studentId: collegeStudent._id,
      userId: user._id,
      isNewUser,
      collegeName: drive.college.name,
      driveTitle: drive.title
    });
  } catch (err) {
    console.error('Public Registration Error:', err.message);
    if (err.code === 11000) return res.json({ msg: 'Already registered', alreadyRegistered: true });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   POST /api/college/public/submit-assessment
const submitAssessment = async (req, res) => {
  try {
    const { studentId, skill, score, total, category } = req.body;
    if (!studentId || !skill) return res.status(400).json({ msg: 'studentId and skill required' });

    const student = await CollegeStudent.findById(studentId).populate('college').populate('user', 'name email');
    if (!student) return res.status(404).json({ msg: 'Student not found' });

    student.assessmentScores.push({
      skill,
      score: score || 0,
      total: total || 10,
      category: category || 'general',
      completedAt: new Date()
    });

    // Auto-update status to active after assessment
    if (student.placementStatus === 'registered') {
      student.placementStatus = 'active';
    }

    const passed = (score / total) >= 0.6;

    // Generate certificate code + PDF (co-branded with the college on any paid Campus plan)
    const certCode = `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    student.certificateCode = certCode;

    const hasCoBranding = isPaidPlan(student.college?.subscriptionTier);
    let certificateUrl = '';
    if (passed) {
      const pdfBuffer = await generateCertificatePdf({
        studentName: student.user?.name,
        skill,
        score,
        total,
        certCode,
        college: student.college,
        hasCoBranding
      });
      certificateUrl = savePdfToUploads(pdfBuffer, 'certificate');
      student.certificateUrl = certificateUrl;
    }

    await student.save();

    if (passed && student.user?.email) {
      sendEmail({
        email: student.user.email,
        subject: `You passed the ${skill} skill assessment!`,
        html: emailWrapper('Certificate Earned', `
          <p>Hi ${student.user.name || 'there'},</p>
          <p>Congratulations! You scored <strong>${score}/${total}</strong> on the <strong>${skill}</strong> assessment and earned a certificate.</p>
          <p>Certificate Code: <strong>${certCode}</strong></p>
          ${certificateUrl ? `<p><a href="${FRONTEND_URL}${certificateUrl}" style="color:#059669;">Download your certificate</a></p>` : ''}
        `)
      }).catch(() => {});
    }
    if (passed && (student.whatsappNumber || student.phone) && certificateUrl) {
      sendWhatsAppTemplate({
        to: student.whatsappNumber || student.phone,
        template: 'offer_letter_document_delivery',
        params: [student.user?.name || 'there', student.college?.name || 'your college', `${skill} Certificate`, `${FRONTEND_URL}${certificateUrl}`]
      }).catch(() => {});
    }

    const certificateDetails = {
      code: certCode,
      hasCoBranding,
      collegeName: hasCoBranding ? student.college.name : null,
      collegeLogo: hasCoBranding ? student.college.logo : null,
      certificateUrl
    };

    res.json({
      msg: 'Assessment submitted',
      score,
      total,
      certificateCode: certCode,
      certificateDetails,
      passed
    });
  } catch (err) {
    console.error('Submit Assessment Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// ─── COMPANY MATCHING STATUS ────────────────────────────────────────────────

// @route   GET /api/college/company-match
const getCompanyMatchStatus = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);

    // Get all student user IDs for this college
    const collegeStudents = await CollegeStudent.find({ college: college._id }).select('user');
    const studentUserIds = collegeStudents.map(s => s.user);

    // Find applications by these students, grouped by company
    const matches = await Application.aggregate([
      { $match: { applicant: { $in: studentUserIds } } },
      { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'jobInfo' } },
      { $unwind: '$jobInfo' },
      { $lookup: { from: 'companies', localField: 'jobInfo.company', foreignField: '_id', as: 'companyInfo' } },
      { $unwind: { path: '$companyInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$jobInfo.company',
          companyName: { $first: '$companyInfo.name' },
          companyLogo: { $first: '$companyInfo.logo' },
          totalApplications: { $sum: 1 },
          shortlisted: { $sum: { $cond: [{ $eq: ['$status', 'shortlisted'] }, 1, 0] } },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
        }
      },
      { $sort: { totalApplications: -1 } },
      { $limit: 30 }
    ]);

    res.json(matches);
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error' });
  }
};

// ─── PROOF UPLOAD & ADMIN VERIFICATION ──────────────────────────────────────

// @route   POST /api/college/proof-upload
const uploadProofDocument = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const proofUrl = `/uploads/${req.file.filename}`;
    college.proofDocumentUrl = proofUrl;
    college.verificationStatus = 'pending';
    await college.save();

    notifyRoles({
      io: req.io,
      roles: ['admin', 'subadmin'],
      title: 'College verification requested',
      message: `${college.name} submitted proof for verification.`,
      type: 'college_verification_request',
      link: `/admin/colleges/${college._id}`,
      metadata: { collegeId: college._id }
    }).catch(err => console.error('College verification request notification failed:', err.message));

    res.json({ msg: 'Proof document uploaded. Pending verification by Platform Admin.', proofDocumentUrl: proofUrl, verificationStatus: college.verificationStatus });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   GET /api/college/admin/all-colleges
const getAllCollegesForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { code: regex }];
    }

    const [colleges, total] = await Promise.all([
      College.find(filter)
        .populate('tpoUser', 'name email profile')
        .populate('verifiedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      College.countDocuments(filter)
    ]);

    res.json({ colleges, total, page: parseInt(page), pages: Math.max(Math.ceil(total / parseInt(limit)), 1) });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   GET /api/college/admin/colleges/:collegeId
const getCollegeByIdForAdmin = async (req, res) => {
  try {
    const college = await College.findById(req.params.collegeId)
      .populate('tpoUser', 'name email profile')
      .populate('verifiedBy', 'name email');
    if (!college) return res.status(404).json({ msg: 'College not found' });
    res.json(college);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   PUT /api/college/admin/verify/:collegeId
const adminVerifyCollege = async (req, res) => {
  try {
    const { status } = req.body; // 'verified' or 'rejected'
    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const college = await College.findById(req.params.collegeId).populate('tpoUser', 'name email phone');
    if (!college) return res.status(404).json({ msg: 'College not found' });

    college.verificationStatus = status;
    if (status === 'verified') {
      college.verifiedBy = req.user.id;
      college.verifiedAt = new Date();
    }
    await college.save();

    if (status !== 'pending' && college.tpoUser?._id) {
      notifyUser({
        io: req.io,
        recipientId: college.tpoUser._id,
        title: status === 'verified' ? 'College verification approved' : 'College verification rejected',
        message: status === 'verified'
          ? `${college.name} is now verified.`
          : `${college.name} verification was rejected. Please review and resubmit your proof.`,
        type: 'college_verification',
        link: '/college/settings',
        metadata: { collegeId: college._id, status }
      }).catch(err => console.error('College verification notification failed:', err.message));
    }

    const recipientEmail = college.principalEmail || college.tpoUser?.email;
    if (recipientEmail && status !== 'pending') {
      const approved = status === 'verified';
      sendEmail({
        email: recipientEmail,
        subject: approved ? `[Velaivaaipu] ${college.name} is now verified` : `[Velaivaaipu] ${college.name} verification was rejected`,
        html: emailWrapper(approved ? 'College Verified' : 'Verification Rejected', `
          <p>Hi ${college.tpoUser?.name || college.principalName || 'there'},</p>
          ${approved
            ? `<p>Great news — <strong>${college.name}</strong> has been verified on Velaivaaipu. You now have full access to campus placement features.</p>`
            : `<p>Your college verification submission for <strong>${college.name}</strong> was rejected. Please review and re-upload your authorization proof document in Settings.</p>`}
        `)
      }).catch(() => {});
    }
    const collegeContactPhone = college.tpoUser?.phone || college.collegePhone;
    if (collegeContactPhone && status !== 'pending') {
      const approved = status === 'verified';
      sendWhatsAppTemplate({
        to: collegeContactPhone,
        template: 'verification_approval_notification',
        params: [
          college.tpoUser?.name || college.principalName || 'there',
          'College Verification',
          approved ? 'Approved' : 'Rejected',
          approved ? 'Verification successful! Your college now has full access to campus placement features.' : 'Please re-upload your authorization proof document',
          `${FRONTEND_URL}/college/settings`
        ]
      }).catch(() => {});
    }

    res.json({ msg: `College marked as ${status}`, college });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// ─── PRINCIPAL PASSKEY EXECUTIVE DASHBOARD ──────────────────────────────────

// @desc    Activate the (stable) executive link if needed, and issue a fresh 4-digit access code.
//          Every call rotates the code — the previously shared code stops working immediately.
// @route   POST /api/college/principal-passkey
const generatePrincipalPasskey = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    if (!college.principalPasskey) {
      college.principalPasskey = `PK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    }
    const code = String(crypto.randomInt(1000, 10000));
    college.principalAccessCode = code;
    college.principalAccessCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // valid 24h
    await college.save();

    const executiveUrl = `${FRONTEND_URL}/principal/executive-summary/${college.principalPasskey}`;
    res.json({
      msg: 'Access code generated',
      passkey: college.principalPasskey,
      executiveUrl,
      code,
      codeExpiry: college.principalAccessCodeExpiry
    });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Verify the 4-digit access code and, if it matches, return the executive report.
//          The link alone is not sufficient — an incorrect/missing/expired code is Unauthorized.
// @route   POST /api/college/public/principal-report/:passkey
const getPrincipalExecutiveReport = async (req, res) => {
  try {
    const { code } = req.body;
    const college = await College.findOne({ principalPasskey: req.params.passkey });
    if (!college) return res.status(404).json({ msg: 'Invalid executive link' });

    if (!college.principalAccessCode || !college.principalAccessCodeExpiry || college.principalAccessCodeExpiry < new Date()) {
      return res.status(401).json({ msg: 'This access code has expired. Ask the TPO to share a new one.' });
    }
    if (!code || String(code) !== college.principalAccessCode) {
      return res.status(401).json({ msg: 'Unauthorized: incorrect access code.' });
    }

    const totalStudents = await CollegeStudent.countDocuments({ college: college._id });
    const statusCounts = await CollegeStudent.aggregate([
      { $match: { college: college._id } },
      { $group: { _id: '$placementStatus', count: { $sum: 1 } } }
    ]);

    const stats = {
      unplaced: 0,
      registered: 0,
      active: 0,
      applied: 0,
      shortlisted: 0,
      interviewing: 0,
      placed: 0,
      opted_out: 0
    };
    statusCounts.forEach(item => { if (stats[item._id] !== undefined) stats[item._id] = item.count; });

    // Department breakdown
    const deptCounts = await CollegeStudent.aggregate([
      { $match: { college: college._id } },
      { $group: { _id: { dept: '$department', status: '$placementStatus' }, count: { $sum: 1 } } }
    ]);

    // Highest and Average LPA
    const placedStudents = await CollegeStudent.find({ college: college._id, placementStatus: 'placed' });
    let highestLPA = 0;
    let totalLPA = 0;
    let lpaCount = 0;
    placedStudents.forEach(s => {
      s.placedDetails?.forEach(p => {
        if (p.packageLPA > highestLPA) highestLPA = p.packageLPA;
        if (p.packageLPA > 0) { totalLPA += p.packageLPA; lpaCount++; }
      });
    });
    const averageLPA = lpaCount > 0 ? (totalLPA / lpaCount).toFixed(2) : 0;

    res.json({
      college: {
        name: college.name,
        code: college.code,
        logo: college.logo,
        principalName: college.principalName
      },
      stats,
      totalStudents,
      highestLPA,
      averageLPA,
      deptCounts
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   PUT /api/college/drives/:driveId/student-round
// Accessible by the owning TPO/admin, or an accepted drive in-charge (see requireDriveAccess in collegeRoutes.js).
// Tracks per-drive pipeline stage on CollegeStudent.driveApplications rather than the aggregate placementStatus,
// so a student's status in one drive doesn't clobber their status in another.
const STAGE_TO_PLACEMENT_STATUS = {
  stage1: 'interviewing',
  stage2: 'interviewing',
  final_interview: 'interviewing',
  certificate_verification: 'interviewing',
  // Selection is provisional until the TPO records the offer and uploads evidence.
  selected: 'shortlisted'
};

const ROUND_STATUS_LABELS = {
  registered: 'Registered',
  stage1: 'Stage 1',
  stage2: 'Stage 2',
  final_interview: 'Final Interview',
  certificate_verification: 'Certificate Verification',
  selected: 'Selected',
  rejected: 'Not Selected',
  withdrawn: 'Withdrawn'
};

const updateDriveRoundStatus = async (req, res) => {
  try {
    const drive = req.drive || await CampusDrive.findById(req.params.driveId);
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    const { studentIds, status, roundName, packageLPA, companyName, tierPolicy } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ msg: 'No students selected' });
    }
    if (!status) return res.status(400).json({ msg: 'status is required' });

    for (const sid of studentIds) {
      const student = await CollegeStudent.findOne({ _id: sid, college: drive.college }).populate('user', 'name email');
      if (!student) continue;

      let application = student.driveApplications.find(da => da.drive.toString() === drive._id.toString());
      if (!application) {
        student.driveApplications.push({ drive: drive._id, status: 'registered' });
        application = student.driveApplications[student.driveApplications.length - 1];
      }
      application.status = status;
      if (roundName) application.currentRound = roundName;
      application.updatedAt = new Date();
      application.updatedBy = req.user.id;

      const mappedPlacementStatus = STAGE_TO_PLACEMENT_STATUS[status];
      if (mappedPlacementStatus) student.placementStatus = mappedPlacementStatus;

      if (status === 'selected') {
        student.placedDetails.push({
          companyName: companyName || drive.companyName || drive.title,
          packageLPA: packageLPA || drive.packageLPA || 0,
          tierPolicy: tierPolicy || drive.tierPolicy || 'regular',
          placedAt: new Date()
        });
      }
      await student.save();

      if (student.user?.email) {
        const label = ROUND_STATUS_LABELS[status] || status;
        sendEmail({
          email: student.user.email,
          subject: `${drive.title}: Your status is now "${label}"`,
          html: emailWrapper('Campus Drive Update', `
            <p>Hi ${student.user.name || 'there'},</p>
            <p>Your status in <strong>${drive.title}</strong> has been updated to:</p>
            <p style="font-size:18px;font-weight:800;color:#059669;">${label}</p>
            ${roundName ? `<p>Round: <strong>${roundName}</strong></p>` : ''}
            ${status === 'selected' ? '<p>Congratulations on getting selected!</p>' : ''}
          `)
        }).catch(() => {});
      }
      const roundStudentPhone = student.whatsappNumber || student.phone;
      if (roundStudentPhone) {
        const label = ROUND_STATUS_LABELS[status] || status;
        sendWhatsAppTemplate({
          to: roundStudentPhone,
          template: 'placement_onboarding_alert',
          params: [
            student.user?.name || 'there',
            roundName || drive.title,
            label,
            `${FRONTEND_URL}/jobseeker/campus-drives`
          ]
        }).catch(() => {});
      }
    }

    await logCollegeActivity(req, { _id: drive.college }, 'pipeline_updated', `Moved ${studentIds.length} student(s) to ${ROUND_STATUS_LABELS[status] || status}`, 'drive', drive._id, { studentIds, status, roundName });
    res.json({ msg: `Updated ${studentIds.length} students to ${status}` });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   POST /api/college/drives/:driveId/announcements
// Accessible by the owning TPO/admin, or an accepted drive in-charge.
const postAnnouncement = async (req, res) => {
  try {
    const drive = req.drive || await CampusDrive.findById(req.params.driveId);
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    const { title, message, link } = req.body;
    if (!title) return res.status(400).json({ msg: 'Title is required' });

    drive.announcements.push({ title, message: message || '', link: link || '', postedBy: req.user.id });
    await drive.save();

    // Fan out to every student already registered for this drive.
    const registeredStudents = await CollegeStudent.find({ 'driveApplications.drive': drive._id }).populate('user', 'name email').populate('college', 'name');
    registeredStudents.forEach(student => {
      if (student.user?.email) {
        sendEmail({
          email: student.user.email,
          subject: `[${drive.title}] ${title}`,
          html: emailWrapper('Campus Drive Announcement', `
            <p>Hi ${student.user.name || 'there'},</p>
            <p><strong>${title}</strong></p>
            ${message ? `<p>${message}</p>` : ''}
            ${link ? `<p><a href="${link}" style="color:#059669;">Open link</a></p>` : ''}
          `)
        }).catch(() => {});
      }
      const announcementStudentPhone = student.whatsappNumber || student.phone;
      if (announcementStudentPhone) {
        sendWhatsAppTemplate({
          to: announcementStudentPhone,
          template: 'campus_drive_interview_notification',
          params: [
            student.user?.name || 'there',
            drive.companyName || drive.title,
            student.college?.name || 'registered',
            title,
            message ? message.slice(0, 60) : 'See announcement for details',
            link || `${FRONTEND_URL}/jobseeker/campus-drives`
          ]
        }).catch(() => {});
      }
    });

    res.status(201).json(drive.announcements[drive.announcements.length - 1]);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   PUT /api/college/me/subscription/auto-renew
const toggleAutoRenew = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const { autoRenewEnabled } = req.body;
    
    if (typeof autoRenewEnabled !== 'boolean') {
      return res.status(400).json({ msg: 'autoRenewEnabled must be a boolean' });
    }

    college.autoRenewEnabled = autoRenewEnabled;
    await college.save();

    res.json({ msg: `Auto-renew ${autoRenewEnabled ? 'enabled' : 'disabled'}`, autoRenewEnabled });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// ─── MoU (spec 8.7) ─────────────────────────────────────────────────────────

// Automated MoU Generation is a Pro/Elite perk per the Campus plan matrix — gated against the
// college's current plan's own feature flag.
// @route   GET /api/college/mou
const generateMou = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const plan = college.subscription
      ? await Subscription.findById(college.subscription)
      : await Subscription.findOne({ role: 'college', price: 0, isActive: true });
    if (!plan || plan.role !== 'college') return res.status(404).json({ msg: 'Plan not found' });

    const hasAutoMoU = plan.features?.find(f => f.name === 'Automated MoU Generation')?.isActive;
    if (!hasAutoMoU) {
      return res.status(403).json({ msg: 'MoU generation is available on Campus Pro and above. Upgrade your plan to generate one.' });
    }

    const pdfBuffer = await generateMouPdf(college, plan);
    const mouUrl = savePdfToUploads(pdfBuffer, `mou-${college.code || 'campus'}`);

    college.mouDocument = mouUrl;
    college.mouSignedAt = new Date();
    await college.save();

    res.json({ msg: 'MoU generated', mouDocument: mouUrl });
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    console.error('Generate MoU Error:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// ─── PLACEMENT REPORTS (spec 8.6) ───────────────────────────────────────────

// @route   GET /api/college/reports
const getPlacementReports = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const reports = await CollegePlacementReport.find({ college: college._id }).sort({ createdAt: -1 }).limit(50);
    res.json(reports);
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Build the periodic placement report PDF and email it to the principal + any extra
//          recipients. Shared by the manual "Generate Report Now" endpoint below and the
//          weekly/monthly cron job (see server/cron) — same logic, two triggers.
const generatePlacementReportForCollege = async (college) => {
  const statusCounts = await CollegeStudent.aggregate([
    { $match: { college: college._id } },
    { $group: { _id: '$placementStatus', count: { $sum: 1 } } }
  ]);
  const stats = { registered: 0, active: 0, applied: 0, interviewing: 0, placed: 0, opted_out: 0 };
  statusCounts.forEach(s => { if (stats[s._id] !== undefined) stats[s._id] = s.count; });
  stats.totalStudents = Object.values(stats).reduce((a, b) => a + b, 0);
  stats.successRate = stats.totalStudents > 0 ? Math.round((stats.placed / stats.totalStudents) * 100) : 0;

  const placedStudents = await CollegeStudent.find({ college: college._id, placementStatus: 'placed' });
  let totalLPA = 0, lpaCount = 0;
  placedStudents.forEach(s => (s.placedDetails || []).forEach(p => {
    if (p.packageLPA > 0) { totalLPA += p.packageLPA; lpaCount++; }
  }));
  stats.averageLPA = lpaCount > 0 ? Number((totalLPA / lpaCount).toFixed(2)) : 0;

  const deptCounts = await CollegeStudent.aggregate([
    { $match: { college: college._id } },
    { $group: { _id: '$department', count: { $sum: 1 } } }
  ]);
  stats.departments = deptCounts.map(d => ({ name: d._id || 'Unknown', count: d.count }));

  const frequency = isProPlus(college.subscriptionTier) ? 'weekly' : 'monthly';
  const periodLabel = `${frequency === 'weekly' ? 'Week of' : 'Month of'} ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const pdfBuffer = await generatePlacementReportPdf(college, stats, periodLabel);
  const reportUrl = savePdfToUploads(pdfBuffer, `report-${college.code || 'campus'}`);

  const report = await CollegePlacementReport.create({
    college: college._id,
    frequency,
    periodLabel,
    reportUrl,
    stats
  });

  const recipients = [college.principalEmail, ...(college.additionalReportRecipients || [])].filter(Boolean);
  if (recipients.length > 0) {
    const html = emailWrapper(`${college.name} Placement Report`, `
      <p>Dear ${college.principalName || 'Principal'},</p>
      <p>The ${frequency} placement report for <strong>${college.name}</strong> is ready: <strong>${stats.placed}/${stats.totalStudents}</strong> students placed (${stats.successRate}% success rate).</p>
      <p><a href="${FRONTEND_URL}${reportUrl}" style="color:#059669;">Download the full report</a></p>
    `);
    Promise.all(recipients.map(email => sendEmail({
      email,
      subject: `[Velaivaaipu] ${college.name} Placement Report — ${periodLabel}`,
      html
    }))).then(() => { report.sentToPrincipal = true; report.save(); }).catch(() => {});
  }

  const tpoUserId = college.tpoUser?._id || college.tpoUser;
  const tpo = tpoUserId ? await User.findById(tpoUserId).select('name phone') : null;
  const tpoPhone = tpo?.phone || college.collegePhone;
  if (tpoPhone) {
    sendWhatsAppTemplate({
      to: tpoPhone,
      template: 'report_delivery_for_tp_officers_tpos',
      params: [
        tpo?.name || college.principalName || 'there',
        frequency,
        college.name,
        `${stats.placed}/${stats.totalStudents} placed (${stats.successRate}%)`,
        `${FRONTEND_URL}${reportUrl}`
      ]
    }).catch(() => {});
  }

  return report;
};

// @route   POST /api/college/reports/generate
// Manual, on-demand trigger by the TPO — unrestricted by plan, unlike the automatic cadence.
// The same underlying logic also runs automatically — see server/cron/reportScheduler.js —
// weekly for Campus Pro+/Elite, monthly for Campus Lite, and not at all for Campus Free.
const generatePlacementReport = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const report = await generatePlacementReportForCollege(college);
    res.status(201).json(report);
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    console.error('Generate Placement Report Error:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    On-demand, full-detail PDF export — every student's details, department/status
//          charts, and drive-wise hiring counts. Streamed straight to the browser as a download
//          rather than persisted, unlike the periodic auto-generated report above.
// @route   GET /api/college/reports/summary-pdf
const downloadSummaryReport = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);

    const statusCounts = await CollegeStudent.aggregate([
      { $match: { college: college._id } },
      { $group: { _id: '$placementStatus', count: { $sum: 1 } } }
    ]);
    const stats = { registered: 0, active: 0, applied: 0, shortlisted: 0, interviewing: 0, placed: 0, opted_out: 0 };
    statusCounts.forEach(s => { if (stats[s._id] !== undefined) stats[s._id] = s.count; });
    stats.totalStudents = Object.values(stats).reduce((a, b) => a + b, 0);
    stats.successRate = stats.totalStudents > 0 ? Math.round((stats.placed / stats.totalStudents) * 100) : 0;

    const placedStudents = await CollegeStudent.find({ college: college._id, placementStatus: 'placed' });
    let totalLPA = 0, lpaCount = 0;
    placedStudents.forEach(s => (s.placedDetails || []).forEach(p => {
      if (p.packageLPA > 0) { totalLPA += p.packageLPA; lpaCount++; }
    }));
    stats.averageLPA = lpaCount > 0 ? Number((totalLPA / lpaCount).toFixed(2)) : 0;

    const deptCounts = await CollegeStudent.aggregate([
      { $match: { college: college._id } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    const departments = deptCounts.map(d => ({ name: d._id || 'Unknown', count: d.count }));

    // Drive-wise hiring: how many students registered vs. actually got selected through each drive.
    const [registeredByDrive, hiredByDrive] = await Promise.all([
      CollegeStudent.aggregate([
        { $match: { college: college._id } },
        { $unwind: '$driveApplications' },
        { $group: { _id: '$driveApplications.drive', count: { $sum: 1 } } }
      ]),
      CollegeStudent.aggregate([
        { $match: { college: college._id } },
        { $unwind: '$driveApplications' },
        { $match: { 'driveApplications.status': 'selected' } },
        { $group: { _id: '$driveApplications.drive', count: { $sum: 1 } } }
      ])
    ]);
    const registeredMap = new Map(registeredByDrive.map(d => [String(d._id), d.count]));
    const hiredMap = new Map(hiredByDrive.map(d => [String(d._id), d.count]));

    const driveList = await CampusDrive.find({ college: college._id }).sort({ createdAt: -1 }).lean();
    const drives = driveList.map(d => ({
      title: d.title,
      batchYear: d.batchYear,
      companies: (d.companies?.length > 0 ? d.companies.map(c => c.name) : [d.companyName].filter(Boolean)).join(', ') || '—',
      registered: registeredMap.get(String(d._id)) || 0,
      hired: hiredMap.get(String(d._id)) || 0
    }));

    const studentDocs = await CollegeStudent.find({ college: college._id })
      .populate('user', 'name email profile.phone')
      .sort({ department: 1, batchYear: 1 })
      .lean();
    const students = studentDocs.map(s => ({
      name: s.user?.name || '—',
      email: s.user?.email || '—',
      department: s.department || '—',
      batchYear: s.batchYear || '—',
      rollNumber: s.rollNumber || '—',
      status: s.placementStatus,
      phone: s.phone || s.user?.profile?.phone || '—'
    }));

    const pdfBuffer = await generateSummaryReportPdf(college, { stats, departments, drives, students });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${college.code || 'campus'}_placement_summary.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    if (err.message === 'NO_COLLEGE') return res.status(404).json({ msg: 'No college linked' });
    console.error('Download Summary Report Error:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// ─── STUDENT SELF-SERVICE ("me" endpoints, jobseeker role) ──────────────────

// @route   GET /api/college/me/student
const getMyCollegeStudent = async (req, res) => {
  try {
    const student = await CollegeStudent.findOne({ user: req.user.id })
      .populate('college', 'name code logo verificationStatus')
      .sort({ createdAt: -1 });
    res.json(student || null);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   POST /api/college/me/join
const joinCollege = async (req, res) => {
  try {
    const { collegeCode, department, batchYear, rollNumber, phone } = req.body;
    if (!collegeCode) return res.status(400).json({ msg: 'College code is required' });
    if (!department || !batchYear || !rollNumber || !phone) {
      return res.status(400).json({ msg: 'Roll number, department, batch year, and phone number are all required to send a join request.' });
    }

    const college = await College.findOne({ code: collegeCode.toUpperCase().trim() });
    if (!college) return res.status(404).json({ msg: 'No college found with that code' });
    if (college.verificationStatus !== 'verified') {
      return res.status(403).json({ msg: 'This institution is pending platform verification' });
    }

    const existing = await CollegeStudent.findOne({ user: req.user.id, college: college._id });
    if (existing) {
      // A previously rejected self-registration can be resubmitted for another review.
      if (existing.idVerification?.status === 'rejected') {
        existing.idVerification.status = 'pending';
        existing.idVerification.rejectionReason = '';
        existing.idVerification.verifiedBy = undefined;
        existing.idVerification.verifiedAt = undefined;
        existing.department = department;
        existing.batchYear = batchYear;
        existing.rollNumber = rollNumber;
        existing.phone = phone;
        existing.whatsappNumber = phone;
        await existing.save();
        return res.json({ msg: `Re-submitted your join request to ${college.name}. Awaiting TPO approval.`, student: existing });
      }
      return res.status(400).json({ msg: 'You are already linked to this college', student: existing });
    }

    const student = new CollegeStudent({
      user: req.user.id,
      college: college._id,
      department,
      batchYear,
      rollNumber,
      phone,
      whatsappNumber: phone,
      registrationSource: 'self',
      placementStatus: 'registered',
      idVerification: { status: 'pending' }
    });
    await student.save();

    res.status(201).json({ msg: `Join request sent to ${college.name}. Awaiting TPO approval.`, student });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ msg: 'You are already linked to this college' });
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   POST /api/college/me/activate
const activateProfile = async (req, res) => {
  try {
    const student = await CollegeStudent.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (!student) return res.status(404).json({ msg: 'You are not linked to a college yet' });

    if (student.idVerification?.status === 'pending') {
      return res.status(400).json({ msg: 'Your join request is still awaiting TPO approval.' });
    }
    if (student.idVerification?.status === 'rejected') {
      return res.status(400).json({ msg: 'Your join request was rejected. Please re-apply from the Campus tab.' });
    }

    student.isActivated = true;
    if (student.placementStatus === 'registered') student.placementStatus = 'active';
    await student.save();

    const activatedStudent = await CollegeStudent.findById(student._id)
      .populate('user', 'name')
      .populate('college', 'tpoUser name');
    if (activatedStudent?.college?.tpoUser) {
      notifyUser({
        io: req.io,
        recipientId: activatedStudent.college.tpoUser,
        title: 'Student profile activated',
        message: `${activatedStudent.user?.name || 'A student'} activated their profile.`,
        type: 'student_activated',
        link: '/college/students',
        metadata: { studentId: student._id }
      }).catch(err => console.error('Student activation notification failed:', err.message));
    }

    res.json({ msg: 'Profile activated', student });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   GET /api/college/me/drives
const getMyDrives = async (req, res) => {
  try {
    const student = await CollegeStudent.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (!student) return res.json({ student: null, drives: [] });

    const drives = await CampusDrive.find({ college: student.college, isActive: true }).sort({ createdAt: -1 });

    const eligible = drives.filter(d =>
      (!d.departments?.length || !student.department || d.departments.includes(student.department)) &&
      (!d.batchYear || !student.batchYear || d.batchYear === student.batchYear)
    );

    const drivesWithStatus = eligible.map(d => {
      const application = student.driveApplications.find(da => da.drive.toString() === d._id.toString());
      return { ...d.toObject(), myApplication: application || null };
    });

    res.json({ student, drives: drivesWithStatus });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @route   POST /api/college/me/drives/:driveId/register
const registerForDrive = async (req, res) => {
  try {
    const student = await CollegeStudent.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (!student) return res.status(404).json({ msg: 'You are not linked to a college yet' });
    if (student.idVerification?.status === 'rejected') {
      return res.status(403).json({ msg: 'Your college join request was rejected. Contact your TPO.' });
    }

    const drive = await CampusDrive.findOne({ _id: req.params.driveId, college: student.college });
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });
    if (!drive.isActive) return res.status(400).json({ msg: 'This drive is closed' });

    if (student.driveApplications.some(da => da.drive.toString() === drive._id.toString())) {
      return res.status(400).json({ msg: 'You are already registered for this drive' });
    }

    student.driveApplications.push({ drive: drive._id, status: 'registered' });
    if (!student.campusDrive) student.campusDrive = drive._id;
    await student.save();

    res.status(201).json({ msg: 'Registered for drive', student });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// Placement-readiness dashboard with exact missing fields for every student.
const getProfileCompletionDashboard = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const students = await CollegeStudent.find({ college: college._id })
      .populate('user', 'name email profile')
      .sort({ department: 1, batchYear: -1 });
    const rows = students.map(s => {
      const raw = s.toObject();
      return { _id: raw._id, user: { name: raw.user?.name, email: raw.user?.email }, department: raw.department, batchYear: raw.batchYear, rollNumber: raw.rollNumber, ...completionForStudent(raw) };
    });
    const distribution = { ready: 0, nearlyReady: 0, incomplete: 0 };
    rows.forEach(r => { if (r.score >= 85) distribution.ready++; else if (r.score >= 60) distribution.nearlyReady++; else distribution.incomplete++; });
    const average = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.score, 0) / rows.length) : 0;
    res.json({ average, total: rows.length, distribution, students: rows });
  } catch (err) { res.status(500).json({ msg: 'Server Error', error: err.message }); }
};

const evaluateEligibility = (student, drive) => {
  const rule = drive.eligibility || {};
  const reasons = [];
  if (Number(student.cgpa || 0) < Number(rule.minCGPA || 0)) reasons.push(`CGPA below ${rule.minCGPA}`);
  if (Number(student.activeArrears || 0) > Number(rule.maxArrears ?? 10)) reasons.push(`More than ${rule.maxArrears} active arrears`);
  const departments = rule.allowedDepartments?.length ? rule.allowedDepartments : drive.departments;
  if (departments?.length && !departments.includes(student.department)) reasons.push('Department not allowed');
  if (rule.batchYears?.length && !rule.batchYears.includes(student.batchYear)) reasons.push('Batch year not allowed');
  const skills = (student.user?.profile?.skills || []).map(s => s.toLowerCase());
  const missingSkills = (rule.requiredSkills || []).filter(s => !skills.includes(s.toLowerCase()));
  if (missingSkills.length) reasons.push(`Missing skills: ${missingSkills.join(', ')}`);
  if (rule.requireResume && !student.user?.profile?.resumeUrl) reasons.push('Resume missing');
  if (rule.requireVerifiedProfile && student.idVerification?.status !== 'approved') reasons.push('ID not verified');
  return { eligible: reasons.length === 0, reasons };
};

const getDriveEligibility = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const drive = await CampusDrive.findOne({ _id: req.params.driveId, college: college._id });
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });
    const students = await CollegeStudent.find({ college: college._id }).populate('user', 'name email profile.skills profile.resumeUrl');
    const results = students.map(s => ({ ...s.toObject(), eligibilityResult: evaluateEligibility(s, drive) }));
    res.json({ eligible: results.filter(r => r.eligibilityResult.eligible), ineligible: results.filter(r => !r.eligibilityResult.eligible) });
  } catch (err) { res.status(500).json({ msg: 'Server Error', error: err.message }); }
};

const addEligibleStudentsToDrive = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    const drive = await CampusDrive.findOne({ _id: req.params.driveId, college: college._id });
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });
    const students = await CollegeStudent.find({ college: college._id }).populate('user', 'profile.skills profile.resumeUrl');
    let added = 0;
    for (const student of students) {
      if (!evaluateEligibility(student, drive).eligible || student.driveApplications.some(a => a.drive.toString() === drive._id.toString())) continue;
      student.driveApplications.push({ drive: drive._id, status: 'registered', updatedBy: req.user.id });
      if (!student.campusDrive) student.campusDrive = drive._id;
      await student.save(); added++;
    }
    await logCollegeActivity(req, college, 'eligible_students_added', `Automatically added ${added} eligible student(s) to ${drive.title}`, 'drive', drive._id);
    res.json({ msg: `${added} eligible student(s) added`, added });
  } catch (err) { res.status(500).json({ msg: 'Server Error', error: err.message }); }
};

const getCollegeTeam = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    await college.populate('teamMembers.user', 'name email lastLoginAt');
    res.json({ owner: college.tpoUser, members: college.teamMembers });
  } catch (err) { res.status(500).json({ msg: 'Server Error', error: err.message }); }
};

const addCollegeTeamMember = async (req, res) => {
  try {
    const college = await College.findOne({ tpoUser: req.user.id });
    if (!college) return res.status(403).json({ msg: 'Only the placement head can manage the team' });
    const { name, email, role, departments = [], permissions = [] } = req.body;
    if (!name || !email) return res.status(400).json({ msg: 'Name and email are required' });
    let user = await User.findOne({ email: email.toLowerCase() });
    let temporaryPassword;
    const collegeRole = await Role.findOne({ name: 'college' });
    if (!collegeRole) return res.status(500).json({ msg: 'College role is not configured' });
    if (!user) {
      temporaryPassword = crypto.randomBytes(6).toString('base64url');
      user = await User.create({ name, email: email.toLowerCase(), password: await bcrypt.hash(temporaryPassword, 10), role: collegeRole._id, isVerified: true, collegeProfile: { college: college._id, designation: role || 'faculty_coordinator' } });
    } else {
      if (user.role.toString() !== collegeRole._id.toString()) return res.status(400).json({ msg: 'This email belongs to a different account type. Use a dedicated college staff email.' });
      user.collegeProfile = { college: college._id, designation: role || 'faculty_coordinator' };
      await user.save();
    }
    if (college.teamMembers.some(m => m.user.toString() === user._id.toString())) return res.status(400).json({ msg: 'This user is already on the team' });
    college.teamMembers.push({ user: user._id, role, departments, permissions, isActive: true });
    await college.save();
    await logCollegeActivity(req, college, 'team_member_added', `Added ${name} as ${role}`, 'team', user._id, { departments, permissions });
    res.status(201).json({ msg: 'Team member added', temporaryPassword });
  } catch (err) { res.status(500).json({ msg: 'Server Error', error: err.message }); }
};

const updateCollegeTeamMember = async (req, res) => {
  try {
    const college = await College.findOne({ tpoUser: req.user.id });
    if (!college) return res.status(403).json({ msg: 'Only the placement head can manage the team' });
    const member = college.teamMembers.id(req.params.memberId);
    if (!member) return res.status(404).json({ msg: 'Team member not found' });
    ['role', 'departments', 'permissions', 'isActive'].forEach(k => { if (req.body[k] !== undefined) member[k] = req.body[k]; });
    await college.save();
    await logCollegeActivity(req, college, 'team_member_updated', 'Updated a team member’s access', 'team', member.user, req.body);
    res.json(member);
  } catch (err) { res.status(500).json({ msg: 'Server Error', error: err.message }); }
};

const getCollegeAuditLog = async (req, res) => {
  try {
    const college = await getCollegeForTPO(req.user.id);
    res.json(await CollegeActivityLog.find({ college: college._id }).sort({ createdAt: -1 }).limit(100));
  } catch (err) { res.status(500).json({ msg: 'Server Error', error: err.message }); }
};

module.exports = {
  getDashboard,
  getDashboardStats,
  getProfile,
  updateProfile,
  createDrive,
  getDrives,
  getDriveDetail,
  exportDriveStudents,
  exportDriveCompanies,
  updateDrive,
  sendCompanyLink,
  searchRegisteredCompanies,
  requestCompanyForDrive,
  resendCompanyInvite,
  getCompanyDriveView,
  exportCompanyDriveStudents,
  deleteDrive,
  regenerateQR,
  getStudents,
  getAcademicYears,
  getStudentDetail,
  updateStudentStatus,
  updateStudentDetails,
  deleteStudent,
  bulkDeleteStudents,
  csvImport,
  getCsvTemplate,
  exportCredentialsSheet,
  verifyStudent,
  getVerificationQueue,
  getPublicDrive,
  publicRegister,
  submitAssessment,
  getCompanyMatchStatus,
  uploadProofDocument,
  getAllCollegesForAdmin,
  getCollegeByIdForAdmin,
  adminVerifyCollege,
  generatePrincipalPasskey,
  getPrincipalExecutiveReport,
  updateDriveRoundStatus,
  postAnnouncement,
  inviteIncharge,
  resendInchargeInvite,
  removeIncharge,
  verifyInchargeInvite,
  acceptInchargeInviteExisting,
  acceptInchargeInviteNew,
  linkInchargeInvite,
  getMyInchargeDrives,
  toggleAutoRenew,
  generateMou,
  getPlacementReports,
  generatePlacementReport,
  generatePlacementReportForCollege,
  downloadSummaryReport,
  getMyCollegeStudent,
  joinCollege,
  activateProfile,
  getMyDrives,
  registerForDrive
  ,getProfileCompletionDashboard
  ,getDriveEligibility
  ,addEligibleStudentsToDrive
  ,getCollegeTeam
  ,addCollegeTeamMember
  ,updateCollegeTeamMember
  ,getCollegeAuditLog
};
