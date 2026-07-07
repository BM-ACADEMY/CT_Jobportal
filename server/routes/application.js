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
router.get('/job/:jobId', authorizeRoles('recruiter', 'company', 'admin'), getJobApplicants);
router.put('/:id/status', authorizeRoles('recruiter', 'company', 'admin'), updateApplicationStatus);
router.post('/:id/track-download', authorizeRoles('recruiter', 'company', 'admin'), trackDownload);
router.get('/export/:jobId', authorizeRoles('recruiter', 'company', 'admin'), exportApplicants);
router.post('/:id/calculate-match', authorizeRoles('recruiter', 'company', 'admin'), require('../controllers/applicationController').calculateApplicationMatch);

module.exports = router;
