const express = require('express');
const router = express.Router();
const { getCategories, startTest, submitTest, getMyResults, claimCertificate } = require('../controllers/assessmentController');
const { verifyToken, optionalVerifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/categories', getCategories);
router.get('/my-results', verifyToken, authorizeRoles('jobseeker'), getMyResults);
router.get('/:category/start', startTest);
router.post('/:category/submit', optionalVerifyToken, submitTest);
router.post('/save', verifyToken, authorizeRoles('jobseeker'), require('../controllers/assessmentController').saveResult);
router.post('/:category/claim-certificate', claimCertificate);

module.exports = router;
