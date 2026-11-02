const express = require('express');
const router = express.Router();
const { getAssessment, submitPublicAssessment, getFreeSkills, getFreeBankTest, submitFreeBankTest } = require('../controllers/assessmentController');
const { rateLimit } = require('../middlewares/rateLimit');

// Each start calls the AI, so limit it per network.
const startLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, message: 'Too many tests started from this network. Please wait a few minutes.' });
const submitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 120 });

const freeTestLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: 'Too many requests from this network. Please wait a few minutes.' });

router.get('/skills', freeTestLimiter, getFreeSkills);
router.get('/bank', freeTestLimiter, getFreeBankTest);
router.post('/bank/submit', freeTestLimiter, submitFreeBankTest);
router.get('/public', startLimiter, getAssessment);
router.post('/public/submit', submitLimiter, submitPublicAssessment);

module.exports = router;
