const express = require('express');
const router = express.Router();
// Trigger nodemon restart
const { createJob, getCompanyJobs, getCompanyJobsWithStats, updateJob, deleteJob, getAllJobs, getJobById, getMatchingJobs, calculatePreMatch, getRecruiterAnalytics, searchCandidates, viewCandidateProfile, getAICandidateMatches, getJobQuota, cloneJob } = require('../controllers/jobController');
const { verifyToken, authorizeRoles, optionalVerifyToken } = require('../middlewares/authMiddleware');

// --- Jobseeker Routes ---
router.get('/matching', verifyToken, authorizeRoles('jobseeker'), getMatchingJobs);
router.get('/:jobId/pre-match', verifyToken, authorizeRoles('jobseeker'), calculatePreMatch);

// --- Recruiter / Company Routes ---
router.post('/', verifyToken, authorizeRoles('recruiter', 'company'), createJob);
router.get('/company-jobs', verifyToken, authorizeRoles('recruiter', 'company'), getCompanyJobs);
router.get('/company-jobs-stats', verifyToken, authorizeRoles('recruiter', 'company'), getCompanyJobsWithStats);
router.get('/analytics', verifyToken, authorizeRoles('recruiter', 'company'), getRecruiterAnalytics);
router.get('/quota', verifyToken, authorizeRoles('recruiter', 'company'), getJobQuota);
router.get('/candidates/search', verifyToken, authorizeRoles('recruiter', 'company'), searchCandidates);
router.get('/candidates/:candidateId/profile', verifyToken, authorizeRoles('recruiter', 'company'), viewCandidateProfile);
router.get('/:jobId/matched-candidates', verifyToken, authorizeRoles('recruiter', 'company'), getAICandidateMatches);
router.post('/:id/clone', verifyToken, authorizeRoles('recruiter', 'company'), cloneJob);
router.put('/:id', verifyToken, authorizeRoles('recruiter', 'company'), updateJob);
router.delete('/:id', verifyToken, authorizeRoles('recruiter', 'company'), deleteJob);

// --- Public / General Routes ---
router.get('/', optionalVerifyToken, getAllJobs);
router.get('/:id', optionalVerifyToken, getJobById);

module.exports = router;

