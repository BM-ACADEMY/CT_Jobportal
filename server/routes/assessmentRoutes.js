const express = require('express');
const { rateLimit } = require('../middlewares/rateLimit');
const router = express.Router();
const { getAssessment, getFreeSkills, getFreeBankTest, submitFreeBankTest } = require('../controllers/assessmentController');

const freeTestLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: 'Too many requests from this network. Please wait a few minutes.' });

router.get('/skills', freeTestLimiter, getFreeSkills);
router.get('/bank', freeTestLimiter, getFreeBankTest);
router.post('/bank/submit', freeTestLimiter, submitFreeBankTest);
router.get('/public', getAssessment);

module.exports = router;
