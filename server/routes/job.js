const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Trigger nodemon restart
const { createJob, getCompanyJobs, getCompanyJobsWithStats, updateJob, deleteJob, getAllJobs, getJobById, getMatchingJobs, calculatePreMatch, getRecruiterAnalytics, searchCandidates, viewCandidateProfile, getAICandidateMatches, getJobQuota, cloneJob, importPipeline, bulkAiMatch } = require('../controllers/jobController');
const { verifyToken, authorizeRoles, optionalVerifyToken } = require('../middlewares/authMiddleware');

// --- Jobseeker Routes ---
router.get('/matching', verifyToken, authorizeRoles('jobseeker'), getMatchingJobs);
router.get('/:jobId/pre-match', verifyToken, authorizeRoles('jobseeker'), calculatePreMatch);

// --- Recruiter / Company Routes ---
router.post('/', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), createJob);
router.post('/import-pipeline', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), upload.single('file'), importPipeline);
router.get('/company-jobs', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), getCompanyJobs);
router.get('/company-jobs-stats', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), getCompanyJobsWithStats);
router.get('/analytics', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), getRecruiterAnalytics);
router.get('/quota', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), getJobQuota);
router.get('/candidates/search', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), searchCandidates);
router.get('/candidates/:candidateId/profile', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), viewCandidateProfile);
router.get('/:jobId/matched-candidates', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), getAICandidateMatches);
router.post('/:jobId/bulk-ai-match', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), bulkAiMatch);
router.post('/:id/clone', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), cloneJob);
router.put('/:id', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), updateJob);
router.delete('/:id', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), deleteJob);

// --- Public / General Routes ---
router.get('/', optionalVerifyToken, getAllJobs);
router.get('/:id', optionalVerifyToken, getJobById);

module.exports = router;

