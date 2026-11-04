const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles, isAdmin } = require('../middlewares/authMiddleware');
const { requireAdminOr } = require('../middlewares/staffPermission');
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

const { aiDailyCap } = require('../middlewares/aiDailyCap');

router.use(verifyToken);

router.post('/counselling', authorizeRoles('jobseeker'), submitCounsellingRequest);
router.post('/mock-interview', authorizeRoles('jobseeker'), submitMockInterviewRequest);
router.post('/ai-resume-review', authorizeRoles('jobseeker'), aiDailyCap('other'), submitAiResumeReviewRequest);
router.get('/my-sessions', authorizeRoles('jobseeker'), getMySessions);
router.get('/my-mock-interviews', authorizeRoles('jobseeker'), getMyMockInterviews);
router.get('/my-ai-resume-reviews', authorizeRoles('jobseeker'), getMyAiResumeReviews);
router.patch('/mock-interview/:id/cancel', authorizeRoles('jobseeker'), cancelMyMockInterview);
router.patch('/counselling/:id/cancel', authorizeRoles('jobseeker'), cancelMySession);
router.patch('/counselling/:id', authorizeRoles('jobseeker'), updateMySession);
router.patch('/:id/select-slot', authorizeRoles('jobseeker'), selectSlot);

router.post('/website-request', authorizeRoles('recruiter', 'company', 'org_employee'), submitWebsiteRequest);

// Admin, or a staff member with the matching permission (counsellor role). Staff only see and touch
// counselling, mock interview and resume review requests (controller applies the scope).
router.get('/admin', requireAdminOr('requests_view'), getAdminRequests);
router.get('/admin/assignees', requireAdminOr('requests_assign'), getAssignees);
router.patch('/admin/:id', requireAdminOr('requests_update'), updateRequestStatus);
router.patch('/admin/:id/assign', requireAdminOr('requests_assign'), adminAssignRequest);

router.get('/assigned', authorizeRoles('recruiter', 'company', 'org_employee'), getAssignedRequests);
router.patch('/assigned/:id', authorizeRoles('recruiter', 'company', 'org_employee'), updateAssignedRequest);

module.exports = router;
