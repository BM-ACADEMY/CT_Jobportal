const router = require('express').Router();
const { rateLimit } = require('../middlewares/rateLimit');
const { listGovernmentJobsPublic } = require('../controllers/governmentJobController');

// Public list of open government jobs (last date not passed). Posting is on /api/admin/government-jobs.
router.get('/', rateLimit({ windowMs: 60 * 1000, max: 60 }), listGovernmentJobsPublic);

module.exports = router;
