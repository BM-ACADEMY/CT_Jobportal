const express = require('express');
const router = express.Router();
const { applyJob, getJobApplicants, updateApplicationStatus, trackDownload, getMyApplications, revokeApplication, exportApplicants } = require('../controllers/applicationController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Job seeker: view their own applications
router.get('/my-applications', authorizeRoles('jobseeker'), getMyApplications);
router.patch('/:id/revoke', authorizeRoles('jobseeker'), revokeApplication);

// Apply for a job
router.post('/apply', applyJob);

// Recruiter routes
router.get('/job/:jobId', authorizeRoles('recruiter', 'company'), getJobApplicants);
router.put('/:id/status', authorizeRoles('recruiter', 'company'), updateApplicationStatus);
router.post('/:id/track-download', authorizeRoles('recruiter', 'company'), trackDownload);
router.get('/export/:jobId', authorizeRoles('recruiter', 'company'), exportApplicants);

module.exports = router;
