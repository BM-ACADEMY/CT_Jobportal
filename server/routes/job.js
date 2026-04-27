const express = require('express');
const router = express.Router();
const { createJob, getCompanyJobs, updateJob, deleteJob } = require('../controllers/jobController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// All routes here are protected and for recruiters
router.use(verifyToken);
router.use(authorizeRoles('recruiter'));

router.post('/', createJob);
router.get('/company-jobs', getCompanyJobs);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

module.exports = router;
