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

router.use(verifyToken);
router.use(authorizeRoles('recruiter', 'company'));

router.post('/', scheduleInterview);
router.get('/recruiter', getRecruiterInterviews);
router.get('/schedulable/:jobId', getSchedulableApplicants);
router.patch('/:id/cancel', cancelInterview);
router.patch('/:id/complete', completeInterview);

module.exports = router;
