const express = require('express');
const router = express.Router();
const { applyJob, getJobApplicants, updateApplicationStatus, trackDownload, getMyApplications } = require('../controllers/applicationController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Job seeker: view their own applications
router.get('/my-applications', authorizeRoles('jobseeker'), getMyApplications);

// Apply for a job
router.post('/apply', applyJob);

// Recruiter routes
router.get('/job/:jobId', authorizeRoles('recruiter', 'company'), getJobApplicants);
router.put('/:id/status', authorizeRoles('recruiter', 'company'), updateApplicationStatus);
router.post('/:id/track-download', authorizeRoles('recruiter', 'company'), trackDownload);

module.exports = router;
