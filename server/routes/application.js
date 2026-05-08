const express = require('express');
const router = express.Router();
const { applyJob, getJobApplicants, updateApplicationStatus, trackDownload } = require('../controllers/applicationController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Apply for a job (All roles except company as per recent changes)
router.post('/apply', applyJob);

// Recruiter routes
router.get('/job/:jobId', authorizeRoles('recruiter', 'company'), getJobApplicants);
router.put('/:id/status', authorizeRoles('recruiter', 'company'), updateApplicationStatus);
router.post('/:id/track-download', authorizeRoles('recruiter', 'company'), trackDownload);

module.exports = router;
