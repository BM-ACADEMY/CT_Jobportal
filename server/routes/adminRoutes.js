const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  toggleBlockUser,
  getRoles,
  getCompanies,
  deleteCompany,
  getJobs,
  deleteJob,
  verifyAdminLoginOTP,
  updateAdminProfile,
  verifyAdminEmailOTP,
  toggleAdmin2FA,
  getUserApplications,
  extendSubscription
} = require('../controllers/adminController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Public route for admin login
router.post('/login', loginAdmin);
router.post('/login-verify-otp', verifyAdminLoginOTP);

// Protected routes (Admin only)
router.use(verifyToken);
router.use(authorizeRoles('admin'));

router.get('/dashboard-stats', getDashboardStats);

// Admin Settings
router.put('/profile', updateAdminProfile);
router.post('/verify-email-otp', verifyAdminEmailOTP);
router.patch('/2fa', toggleAdmin2FA);

router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.get('/users/:id/applications', getUserApplications);
router.patch('/users/:id/extend-subscription', extendSubscription);
router.get('/roles', getRoles);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/block', toggleBlockUser);

router.get('/companies', getCompanies);
router.delete('/companies/:id', deleteCompany);

router.get('/jobs', getJobs);
router.delete('/jobs/:id', deleteJob);

module.exports = router;
