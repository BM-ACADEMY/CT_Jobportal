const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles, isAdmin } = require('../middlewares/authMiddleware');
const {
  submitCounsellingRequest,
  submitInterviewPrepRequest,
  submitSalaryBenchmarkRequest,
  getMySessions,
  getMyInterviewPrep,
  cancelMySession,
  cancelMyInterviewPrep,
  getAdminRequests,
  updateRequestStatus,
  adminAssignRequest,
  getAssignees,
  getAssignedRequests,
  updateAssignedRequest,
} = require('../controllers/requestController');

router.use(verifyToken);

router.post('/counselling', authorizeRoles('jobseeker'), submitCounsellingRequest);
router.post('/interview-prep', authorizeRoles('jobseeker'), submitInterviewPrepRequest);
router.post('/salary-benchmark', authorizeRoles('jobseeker'), submitSalaryBenchmarkRequest);
router.get('/my-sessions', authorizeRoles('jobseeker'), getMySessions);
router.get('/my-interview-prep', authorizeRoles('jobseeker'), getMyInterviewPrep);
router.patch('/interview-prep/:id/cancel', authorizeRoles('jobseeker'), cancelMyInterviewPrep);
router.patch('/counselling/:id/cancel', authorizeRoles('jobseeker'), cancelMySession);

router.get('/admin', isAdmin, getAdminRequests);
router.get('/admin/assignees', isAdmin, getAssignees);
router.patch('/admin/:id', isAdmin, updateRequestStatus);
router.patch('/admin/:id/assign', isAdmin, adminAssignRequest);

router.get('/assigned', authorizeRoles('recruiter', 'company'), getAssignedRequests);
router.patch('/assigned/:id', authorizeRoles('recruiter', 'company'), updateAssignedRequest);

module.exports = router;
