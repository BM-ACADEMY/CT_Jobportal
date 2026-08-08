const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middleware/upload');
const CampusDrive = require('../models/CampusDrive');
const College = require('../models/College');
const {
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
  verifyStudent,
  getVerificationQueue,
  getPublicDrive,
  publicRegister,
  submitAssessment,
  getCompanyMatchStatus,
  exportCredentialsSheet,
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
  downloadSummaryReport,
  getMyCollegeStudent,
  joinCollege,
  activateProfile,
  getMyDrives,
  registerForDrive
} = require('../controllers/collegeController');

// CSV upload uses memory storage (not disk)
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Grants access to a single drive's management routes to the owning college's TPO/admin,
// OR to any authenticated user (regardless of their primary role — jobseeker, recruiter,
// company, college, ...) who has an accepted in-charge invite for this specific drive.
// "Manage Drive" is a capability layered on top of whatever account someone already has,
// not a separate role.
const requireDriveAccess = async (req, res, next) => {
  try {
    const drive = await CampusDrive.findById(req.params.driveId);
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    if (req.user.role === 'admin') {
      req.drive = drive;
      return next();
    }

    if (req.user.role === 'college') {
      const college = await College.findOne({ _id: drive.college, tpoUser: req.user.id });
      if (college) {
        req.drive = drive;
        return next();
      }
    }

    const isIncharge = drive.inCharges.some(ic =>
      ic.status === 'accepted' && ic.user && ic.user.toString() === req.user.id
    );
    if (isIncharge) {
      req.drive = drive;
      return next();
    }

    return res.status(403).json({ msg: 'Access denied: not assigned to this drive' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// ── Public routes (no auth) ─────────────────────────────────────────────────
router.get('/public/drive/:driveCode', getPublicDrive);
router.post('/public/drive/:driveCode/register', publicRegister);
router.post('/public/submit-assessment', submitAssessment);
router.post('/public/principal-report/:passkey', getPrincipalExecutiveReport);
router.get('/drives/incharge/verify/:driveId/:token', verifyInchargeInvite);
router.post('/drives/incharge/accept-existing/:driveId/:token', acceptInchargeInviteExisting);
router.post('/drives/incharge/accept-new/:driveId/:token', acceptInchargeInviteNew);
router.get('/public/company-drive/:token', getCompanyDriveView);
router.get('/public/company-drive/:token/export', exportCompanyDriveStudents);

// ── Admin routes ────────────────────────────────────────────────────────────
router.get('/admin/all-colleges', verifyToken, authorizeRoles('admin'), getAllCollegesForAdmin);
router.get('/admin/colleges/:collegeId', verifyToken, authorizeRoles('admin'), getCollegeByIdForAdmin);
router.put('/admin/verify/:collegeId', verifyToken, authorizeRoles('admin'), adminVerifyCollege);

// ── TPO authenticated routes ────────────────────────────────────────────────
router.get('/dashboard', verifyToken, authorizeRoles('college'), getDashboard);
router.get('/me/dashboard-stats', verifyToken, authorizeRoles('college'), getDashboardStats);
router.get('/profile', verifyToken, authorizeRoles('college'), getProfile);
router.put('/profile', verifyToken, authorizeRoles('college'), updateProfile);
router.post('/proof-upload', verifyToken, authorizeRoles('college'), upload.single('proof'), uploadProofDocument);
router.post('/principal-passkey', verifyToken, authorizeRoles('college'), generatePrincipalPasskey);
router.put('/me/subscription/auto-renew', verifyToken, authorizeRoles('college'), toggleAutoRenew);

// MoU + Placement Reports
router.get('/mou', verifyToken, authorizeRoles('college'), generateMou);
router.get('/reports', verifyToken, authorizeRoles('college'), getPlacementReports);
router.post('/reports/generate', verifyToken, authorizeRoles('college'), generatePlacementReport);
router.get('/reports/summary-pdf', verifyToken, authorizeRoles('college'), downloadSummaryReport);

// Drives
router.post('/drives', verifyToken, authorizeRoles('college'), createDrive);
router.get('/drives', verifyToken, authorizeRoles('college'), getDrives);
router.get('/drives/:driveId', verifyToken, requireDriveAccess, getDriveDetail);
router.get('/drives/:driveId/students-export', verifyToken, requireDriveAccess, exportDriveStudents);
router.get('/drives/:driveId/companies-export', verifyToken, requireDriveAccess, exportDriveCompanies);
router.put('/drives/:driveId', verifyToken, authorizeRoles('college'), updateDrive);
router.post('/drives/:driveId/companies/:companyId/send-link', verifyToken, authorizeRoles('college'), sendCompanyLink);
router.get('/companies/search', verifyToken, authorizeRoles('college'), searchRegisteredCompanies);
router.post('/drives/:driveId/invite-company/:companyId', verifyToken, authorizeRoles('college'), requestCompanyForDrive);
router.post('/drives/:driveId/companies/:companyEntryId/resend-invite', verifyToken, authorizeRoles('college'), resendCompanyInvite);
router.delete('/drives/:driveId', verifyToken, authorizeRoles('college'), deleteDrive);
router.get('/drives/:driveId/regenerate-qr', verifyToken, authorizeRoles('college'), regenerateQR);
router.put('/drives/:driveId/student-round', verifyToken, requireDriveAccess, updateDriveRoundStatus);
router.post('/drives/:driveId/announcements', verifyToken, requireDriveAccess, postAnnouncement);
router.post('/drives/:driveId/incharge/invite', verifyToken, authorizeRoles('college'), inviteIncharge);
router.post('/drives/:driveId/incharge/:inchargeId/resend', verifyToken, authorizeRoles('college'), resendInchargeInvite);
router.delete('/drives/:driveId/incharge/:inchargeId', verifyToken, authorizeRoles('college'), removeIncharge);
router.post('/drives/incharge/link/:driveId/:token', verifyToken, linkInchargeInvite);

// Students
router.get('/academic-years', verifyToken, authorizeRoles('college'), getAcademicYears);
router.get('/students', verifyToken, authorizeRoles('college'), getStudents);
router.get('/students/csv-template', verifyToken, authorizeRoles('college'), getCsvTemplate);
router.get('/students/credentials-export', verifyToken, authorizeRoles('college'), exportCredentialsSheet);
router.post('/students/csv-import', verifyToken, authorizeRoles('college'), csvUpload.single('file'), csvImport);
router.post('/students/bulk-upload', verifyToken, authorizeRoles('college'), csvUpload.single('file'), csvImport);
router.post('/students/bulk-delete', verifyToken, authorizeRoles('college'), bulkDeleteStudents);
router.get('/students/:id', verifyToken, authorizeRoles('college'), getStudentDetail);
router.put('/students/:id', verifyToken, authorizeRoles('college'), updateStudentDetails);
router.delete('/students/:id', verifyToken, authorizeRoles('college'), deleteStudent);
router.put('/students/:id/status', verifyToken, authorizeRoles('college'), updateStudentStatus);

// Verification
router.get('/verification', verifyToken, authorizeRoles('college'), getVerificationQueue);
router.post('/students/:id/verify', verifyToken, authorizeRoles('college', 'admin'), verifyStudent);

// Company match
router.get('/company-match', verifyToken, authorizeRoles('college'), getCompanyMatchStatus);

// Logo upload
router.post('/upload-logo', verifyToken, authorizeRoles('college'), upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
  const logoUrl = `/uploads/${req.file.filename}`;
  res.json({ logoUrl });
});

// ── Student self-service ("me" endpoints, jobseeker role) ───────────────────
router.get('/me/student', verifyToken, authorizeRoles('jobseeker'), getMyCollegeStudent);
router.post('/me/join', verifyToken, authorizeRoles('jobseeker'), joinCollege);
router.post('/me/activate', verifyToken, authorizeRoles('jobseeker'), activateProfile);
router.get('/me/drives', verifyToken, authorizeRoles('jobseeker'), getMyDrives);
router.post('/me/drives/:driveId/register', verifyToken, authorizeRoles('jobseeker'), registerForDrive);

// ── "Manage Drive" capability (any role) ─────────────────────────────────────
router.get('/me/incharge-drives', verifyToken, getMyInchargeDrives);

module.exports = router;
