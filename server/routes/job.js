const express = require('express');
const router = express.Router();
const { createJob, getCompanyJobs, getCompanyJobsWithStats, updateJob, deleteJob, getAllJobs, getMatchingJobs, getRecruiterAnalytics } = require('../controllers/jobController');
const { verifyToken, authorizeRoles, optionalVerifyToken } = require('../middlewares/authMiddleware');

// Public route to get all jobs
router.get('/', optionalVerifyToken, getAllJobs);

// Route for jobseekers to get matching jobs
router.get('/matching', verifyToken, authorizeRoles('jobseeker'), getMatchingJobs);

// All routes below this are protected and for recruiters/companies
router.use(verifyToken);
router.use(authorizeRoles('recruiter', 'company'));

router.post('/', createJob);
router.get('/company-jobs', getCompanyJobs);
router.get('/company-jobs-stats', getCompanyJobsWithStats);
router.get('/analytics', getRecruiterAnalytics);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

module.exports = router;

