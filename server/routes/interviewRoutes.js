const express = require('express');
const router = express.Router();
const {
  scheduleInterview,
  getRecruiterInterviews,
  cancelInterview,
  completeInterview,
  getSchedulableApplicants
} = require('../controllers/interviewController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { requireTeamPermission } = require('../middlewares/teamPermission');

router.use(verifyToken);
router.use(authorizeRoles('recruiter', 'company', 'org_employee'));
// Team-managed recruiters need the Video Interview / Scheduling permission (middlewares/teamPermission.js).
router.use(requireTeamPermission('interview_scheduling'));

router.post('/', scheduleInterview);
router.get('/recruiter', getRecruiterInterviews);
router.get('/schedulable/:jobId', getSchedulableApplicants);
router.patch('/:id/cancel', cancelInterview);
router.patch('/:id/complete', completeInterview);

module.exports = router;
