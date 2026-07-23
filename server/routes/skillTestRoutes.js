const express = require('express');
const router = express.Router();
const { getCategories, startTest, submitTest, claimCertificate } = require('../controllers/assessmentController');

router.get('/categories', getCategories);
router.get('/:category/start', startTest);
router.post('/:category/submit', submitTest);
router.post('/:category/claim-certificate', claimCertificate);

module.exports = router;
