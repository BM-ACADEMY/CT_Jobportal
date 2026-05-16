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
  deleteJob
} = require('../controllers/adminController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Public route for admin login
router.post('/login', loginAdmin);

// Protected routes (Admin only)
router.use(verifyToken);
router.use(authorizeRoles('admin'));

router.get('/dashboard-stats', getDashboardStats);

router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.get('/roles', getRoles);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/block', toggleBlockUser);

router.get('/companies', getCompanies);
router.delete('/companies/:id', deleteCompany);

router.get('/jobs', getJobs);
router.delete('/jobs/:id', deleteJob);

module.exports = router;
