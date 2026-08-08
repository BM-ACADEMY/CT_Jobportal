const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles, isAdmin } = require('../middlewares/authMiddleware');
const {
  submitCounsellingRequest,
  submitMockInterviewRequest,
  getMySessions,
  getMyMockInterviews,
  getMyAiResumeReviews,
  cancelMySession,
  cancelMyMockInterview,
  getAdminRequests,
  updateRequestStatus,
  adminAssignRequest,
  getAssignees,
  getAssignedRequests,
  updateAssignedRequest,
  submitWebsiteRequest,
  submitAiResumeReviewRequest,
  updateMySession,
  selectSlot,
} = require('../controllers/requestController');

router.use(verifyToken);

router.post('/counselling', authorizeRoles('jobseeker'), submitCounsellingRequest);
router.post('/mock-interview', authorizeRoles('jobseeker'), submitMockInterviewRequest);
router.post('/ai-resume-review', authorizeRoles('jobseeker'), submitAiResumeReviewRequest);
router.get('/my-sessions', authorizeRoles('jobseeker'), getMySessions);
router.get('/my-mock-interviews', authorizeRoles('jobseeker'), getMyMockInterviews);
router.get('/my-ai-resume-reviews', authorizeRoles('jobseeker'), getMyAiResumeReviews);
router.patch('/mock-interview/:id/cancel', authorizeRoles('jobseeker'), cancelMyMockInterview);
router.patch('/counselling/:id/cancel', authorizeRoles('jobseeker'), cancelMySession);
router.patch('/counselling/:id', authorizeRoles('jobseeker'), updateMySession);
router.patch('/:id/select-slot', authorizeRoles('jobseeker'), selectSlot);

router.post('/website-request', authorizeRoles('recruiter', 'company', 'org_employee'), submitWebsiteRequest);

router.get('/admin', isAdmin, getAdminRequests);
router.get('/admin/assignees', isAdmin, getAssignees);
router.patch('/admin/:id', isAdmin, updateRequestStatus);
router.patch('/admin/:id/assign', isAdmin, adminAssignRequest);

router.get('/assigned', authorizeRoles('recruiter', 'company', 'org_employee'), getAssignedRequests);
router.patch('/assigned/:id', authorizeRoles('recruiter', 'company', 'org_employee'), updateAssignedRequest);

module.exports = router;
