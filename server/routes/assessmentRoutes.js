const express = require('express');
const router = express.Router();
const { getAssessment } = require('../controllers/assessmentController');

router.get('/public', getAssessment);

module.exports = router;
