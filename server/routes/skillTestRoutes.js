const express = require('express');
const router = express.Router();
const { getCategories, getMyResults } = require('../controllers/assessmentController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/categories', getCategories);
router.get('/my-results', verifyToken, authorizeRoles('jobseeker'), getMyResults);
router.post('/save', verifyToken, authorizeRoles('jobseeker'), require('../controllers/assessmentController').saveResult);
// Removed: /:category/start, /:category/submit and /:category/claim-certificate. They trusted client-side scores and
// the last one created accounts from a name and phone number. Free tests use /api/assessments/public (server-scored).

module.exports = router;
