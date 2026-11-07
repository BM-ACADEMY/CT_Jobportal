const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  updateUserVerificationStatus,
  toggleBlockUser,
  getRoles,
  getCompanies,
  deleteCompany,
  getJobs,
  deleteJob,
  verifyAdminLoginOTP,
  updateAdminProfile,
  changeAdminPassword,
  verifyAdminEmailOTP,
  toggleAdmin2FA,
  getUserApplications,
  extendSubscription
} = require('../controllers/adminController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { requireAdminOr } = require('../middlewares/staffPermission');
const { listStaff, addStaff, updateStaff, removeStaff } = require('../controllers/staffController');
const { listJobLimits, grantJobLimits } = require('../controllers/adminJobLimitController');

// Public route for admin login
router.post('/login', loginAdmin);
router.post('/login-verify-otp', verifyAdminLoginOTP);

// Protected routes (Admin only)
router.use(verifyToken);

// Staff with users_view (support role) may READ users; everything from the gate below on is admin-only.
router.get('/users', requireAdminOr('users_view'), getUsers);
router.get('/users/:id', requireAdminOr('users_view'), getUserDetails);
router.get('/users/:id/applications', requireAdminOr('users_view'), getUserApplications);
router.get('/roles', requireAdminOr('users_view'), getRoles);

router.use(authorizeRoles('admin'));

// Employers' active-job limits: see them and raise them without a payment (Super Admin only).
router.get('/skill-tests', require('../controllers/skillTestAdminController').getSkillTestSummary);
router.get('/job-limits', listJobLimits);
router.post('/job-limits/grant', grantJobLimits);

// Staff accounts (support, counsellor, college verifier): Super Admin only.
router.get('/staff', listStaff);
router.post('/staff', addStaff);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', removeStaff);

router.get('/dashboard-stats', getDashboardStats);
router.get('/recommendations/summary', require('../controllers/recommendationController').getSummary);

// Admin Settings
router.put('/profile', updateAdminProfile);
router.patch('/change-password', changeAdminPassword);
router.post('/verify-email-otp', verifyAdminEmailOTP);
router.patch('/2fa', toggleAdmin2FA);

router.patch('/users/:id/extend-subscription', extendSubscription);
router.put('/users/:id', updateUser);
router.put('/users/:id/verification-status', updateUserVerificationStatus);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/block', toggleBlockUser);

router.get('/companies', getCompanies);
router.delete('/companies/:id', deleteCompany);
router.patch('/companies/:id/verify', require('../controllers/companyVerificationController').setCompanyVerified);

router.get('/needs-action', require('../controllers/needsActionController').getNeedsAction);
router.put('/needs-action/assign', require('../controllers/needsActionController').assignItem);
router.put('/needs-action/rules', require('../controllers/needsActionController').setRule);
router.get('/jobs', getJobs);
router.patch('/jobs/:id/scam-review', require('../controllers/jobScamReviewController').setJobScamReviewed);
router.delete('/jobs/:id', deleteJob);

module.exports = router;
