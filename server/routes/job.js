const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Trigger nodemon restart
const { createJob, getCompanyJobs, getCompanyJobsWithStats, updateJob, deleteJob, getAllJobs, getJobById, getMatchingJobs, calculatePreMatch, getRecruiterAnalytics, searchCandidates, viewCandidateProfile, getTopCandidates, getAICandidateMatches, getJobQuota, cloneJob, importPipeline, bulkAiMatch, markJobApplicantsViewed } = require('../controllers/jobController');
const { scoreJobPost } = require('../utils/jobQuality');
const { verifyToken, authorizeRoles, optionalVerifyToken } = require('../middlewares/authMiddleware');
const { rateLimit } = require('../middlewares/rateLimit');
const { requireTeamPermission } = require('../middlewares/teamPermission');
const { JOB_LIST_KEYS } = require('../config/teamPermissions');
const { aiDailyCap } = require('../middlewares/aiDailyCap');

// --- Jobseeker Routes ---
router.get('/matching', verifyToken, authorizeRoles('jobseeker'), getMatchingJobs);
router.get('/:jobId/pre-match', verifyToken, authorizeRoles('jobseeker'), aiDailyCap('match'), calculatePreMatch);

// --- Recruiter / Company Routes ---
router.post('/', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('post_job'), createJob);
router.post('/:id/sponsor-addon', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('post_job'), require('../controllers/jobPromotionController').sponsorMyJob);
// Quality score and tips for a draft job, so the poster can fix it before publishing. Stateless; nothing is saved.
router.post('/quality-check', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('post_job', 'my_jobs'), (req, res) => res.json(scoreJobPost(req.body && typeof req.body === 'object' ? req.body : {})));
router.post('/import-pipeline', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('ats_pipeline'), upload.single('file'), importPipeline);
// Team-managed recruiters (added by a company admin) only reach what their admin ticked
// (middlewares/teamPermission.js). Everyone else in the role list passes straight through.
// Sponsored buyers report: the company's own sponsored jobs with views, clicks and applies.
router.get('/sponsored-report', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission(...JOB_LIST_KEYS), require('../controllers/sponsorStatsController').getSponsoredReport);
router.get('/company-jobs', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission(...JOB_LIST_KEYS), getCompanyJobs);
router.get('/company-jobs-stats', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission(...JOB_LIST_KEYS), getCompanyJobsWithStats);
router.get('/analytics', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('analytics'), getRecruiterAnalytics);
router.get('/quota', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission(...JOB_LIST_KEYS), getJobQuota);
router.get('/candidates/search', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('candidate_search'), searchCandidates);
router.get('/:jobId/top-candidates', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('candidate_search', 'ats_pipeline'), getTopCandidates);
router.get('/candidates/:candidateId/profile', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('candidate_search', 'ats_pipeline'), viewCandidateProfile);
router.get('/:jobId/matched-candidates', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('ai_candidate_matching'), getAICandidateMatches);
router.post('/:jobId/bulk-ai-match', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('ai_candidate_matching', 'ats_pipeline'), bulkAiMatch);
router.post('/:id/clone', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('post_job'), cloneJob);
// A sponsored job card was shown or clicked. Public, fire-and-forget, never fails the page.
router.post('/:id/sponsor-event', rateLimit({ windowMs: 60 * 1000, max: 120 }), require('../controllers/sponsorStatsController').recordSponsorEvent);
router.post('/:id/apply-click', require('../controllers/externalJobController').countExternalClick);
router.post('/:id/renew', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('my_jobs'), require('../controllers/visibilityController').renewJob);
router.put('/:id', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('my_jobs'), updateJob);
router.patch('/:id/mark-viewed', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('my_jobs', 'ats_pipeline'), markJobApplicantsViewed);
router.delete('/:id', verifyToken, authorizeRoles('recruiter', 'company', 'org_employee'), requireTeamPermission('my_jobs'), deleteJob);

// --- Public / General Routes ---
router.get('/', optionalVerifyToken, getAllJobs);
router.post('/:id/report', verifyToken, rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'You have sent several reports. Please try again later.' }), require('../controllers/jobReportController').reportJob);
router.get('/:id', optionalVerifyToken, getJobById);

module.exports = router;

