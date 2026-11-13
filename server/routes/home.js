const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { getHomeSummary } = require('../controllers/homeSummaryController');
const router = express.Router();
router.get('/summary', verifyToken, getHomeSummary);
module.exports = router;
