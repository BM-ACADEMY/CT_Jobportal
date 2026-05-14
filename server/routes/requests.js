const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles, isAdmin } = require('../middlewares/authMiddleware');
const {
  submitCounsellingRequest,
  submitInterviewPrepRequest,
  submitSalaryBenchmarkRequest,
  getMySessions,
  getAdminRequests,
  updateRequestStatus,
} = require('../controllers/requestController');

router.use(verifyToken);

router.post('/counselling', authorizeRoles('jobseeker'), submitCounsellingRequest);
router.post('/interview-prep', authorizeRoles('jobseeker'), submitInterviewPrepRequest);
router.post('/salary-benchmark', authorizeRoles('jobseeker'), submitSalaryBenchmarkRequest);
router.get('/my-sessions', authorizeRoles('jobseeker'), getMySessions);

router.get('/admin', isAdmin, getAdminRequests);
router.patch('/admin/:id', isAdmin, updateRequestStatus);

module.exports = router;
