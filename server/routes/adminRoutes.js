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
const { rateLimit: adminRateLimit } = require('../middlewares/rateLimit');
router.post('/login', adminRateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many login attempts. Please wait a few minutes.' }), loginAdmin);
router.post('/login-verify-otp', adminRateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many attempts. Please wait a few minutes.' }), verifyAdminLoginOTP);

// Protected routes (Admin only)
router.use(verifyToken);

// Staff with users_view (support role) may READ users; everything from the gate below on is admin-only.
router.get('/users', requireAdminOr('users_view'), getUsers);
router.get('/users/:id', requireAdminOr('users_view'), getUserDetails);
router.get('/users/:id/applications', requireAdminOr('users_view'), getUserApplications);
router.get('/roles', requireAdminOr('users_view'), getRoles);

router.use(authorizeRoles('admin'));

// Employers' active-job limits: see them and raise them without a payment (Super Admin only).
// Business advisor: weekly numbers, AI notes and ideas (Super Admin only).
router.get('/free-ai', require('../controllers/freeAiController').adminSummary);
router.get('/growth/sources', require('../controllers/growthController').getSources);
router.get('/brand-leads', require('../controllers/brandLeadController').listBrandLeads);
router.patch('/brand-leads/:userId', require('../controllers/brandLeadController').updateBrandLead);
router.patch('/jobs/:id/hide', require('../controllers/visibilityController').hideJob);
router.patch('/companies/:id/hide', require('../controllers/visibilityController').hideCompany);
router.get('/services-overview', require('../controllers/adminServicesController').getServicesOverview);
router.get('/advisor', require('../controllers/advisorController').getAdvisor);
router.post('/advisor/generate', require('../controllers/advisorController').generate);
router.post('/advisor/ask', require('../controllers/advisorController').ask);
router.post('/advisor/ideas/:id', require('../controllers/advisorController').setIdeaStatus);
// Walk-in drives: approve, reject and mark paid by hand (Super Admin only; no Razorpay).
router.get('/drives', require('../controllers/walkInDriveController').adminListDrives);
router.post('/drives/:id/review', require('../controllers/walkInDriveController').reviewDrive);
router.post('/drives/:id/mark-paid', require('../controllers/walkInDriveController').markPaid);
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
router.patch('/companies/:id/logo-approval', require('../controllers/logoController').approveCompanyLogo);
router.patch('/colleges/:id/logo', require('../controllers/logoController').setCollegeLogo);
router.patch('/companies/:id/verify', require('../controllers/companyVerificationController').setCompanyVerified);

router.get('/spend', require('../controllers/spendController').getSpend);
router.post('/spend', require('../controllers/spendController').addSpend);
router.patch('/spend/:id/void', require('../controllers/spendController').voidSpend);
const blogCtl = require('../controllers/blogController');
const blogImageUpload = require('multer')({ storage: require('multer').memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)) });
router.get('/blog-posts', blogCtl.listAdmin);
router.post('/blog-posts', blogCtl.createPost);
router.get('/blog-posts/:id', blogCtl.getAdmin);
router.put('/blog-posts/:id', blogCtl.updatePost);
router.delete('/blog-posts/:id', blogCtl.deletePost);
router.post('/blog-images', blogImageUpload.single('image'), blogCtl.uploadImage);
router.get('/whatsapp', require('../controllers/whatsappInboxController').getInbox);
router.post('/whatsapp/reply', require('../controllers/whatsappInboxController').replyToThread);
router.put('/whatsapp/:phone/done', require('../controllers/whatsappInboxController').markDone);
router.get('/needs-action', require('../controllers/needsActionController').getNeedsAction);
router.put('/needs-action/assign', require('../controllers/needsActionController').assignItem);
router.put('/needs-action/rules', require('../controllers/needsActionController').setRule);
router.get('/jobs', getJobs);
router.patch('/jobs/:id/scam-review', require('../controllers/jobScamReviewController').setJobScamReviewed);
router.delete('/jobs/:id', deleteJob);
router.post('/jobs/:id/sponsor', require('../controllers/jobPromotionController').sponsorJob);
router.post('/jobs/:id/unsponsor', require('../controllers/jobPromotionController').unsponsorJob);
router.post('/jobs/:id/urgent', require('../controllers/jobPromotionController').urgentJob);

module.exports = router;
