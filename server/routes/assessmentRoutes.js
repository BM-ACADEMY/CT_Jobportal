const express = require('express');
const router = express.Router();
const { getAssessment, submitPublicAssessment } = require('../controllers/assessmentController');
const { rateLimit } = require('../middlewares/rateLimit');

// Each start calls the AI, so limit it per network.
const startLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, message: 'Too many tests started from this network. Please wait a few minutes.' });
const submitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 120 });

router.get('/public', startLimiter, getAssessment);
router.post('/public/submit', submitLimiter, submitPublicAssessment);

module.exports = router;
