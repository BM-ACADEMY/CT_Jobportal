const router = require('express').Router();
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { rateLimit } = require('../middlewares/rateLimit');
const { chat, status } = require('../controllers/assistantController');

// Job seekers only. On top of the daily cap per person, a short burst limit per network.
router.post('/chat', rateLimit({ windowMs: 60 * 1000, max: 20, message: 'Too many messages. Please slow down.' }), verifyToken, authorizeRoles('jobseeker'), chat);

router.get('/status', verifyToken, authorizeRoles('jobseeker'), status);

module.exports = router;
