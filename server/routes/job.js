const express = require('express');
const router = express.Router();
const { createJob, getCompanyJobs, updateJob, deleteJob, getAllJobs } = require('../controllers/jobController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Public route to get all jobs
router.get('/', getAllJobs);

// All routes below this are protected and for recruiters
router.use(verifyToken);
router.use(authorizeRoles('recruiter'));

router.post('/', createJob);
router.get('/company-jobs', getCompanyJobs);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

module.exports = router;

