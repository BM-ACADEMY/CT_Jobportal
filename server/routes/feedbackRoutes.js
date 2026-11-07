const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { rateLimit } = require('../middlewares/rateLimit');
const { submitFeedback, listFeedback, setFeedbackStatus } = require('../controllers/feedbackController');

router.post('/', verifyToken, rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'You have sent a lot of feedback. Please try again later.' }), submitFeedback);
router.get('/admin', verifyToken, authorizeRoles('admin'), listFeedback);
router.patch('/admin/:id', verifyToken, authorizeRoles('admin'), setFeedbackStatus);

module.exports = router;
