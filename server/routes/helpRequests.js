const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { rateLimit } = require('../middlewares/rateLimit');
const { createHelpRequest } = require('../controllers/helpRequestController');

// Any signed-in person may ask for help. Rate-limited per IP here and per person in the controller.
router.post('/', verifyToken, rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: 'Too many help requests. Please try again later.' }), (req, res) => createHelpRequest(req, res));

module.exports = router;
