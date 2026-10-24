const router = require('express').Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { rateLimit } = require('../middlewares/rateLimit');
const { postEvents } = require('../controllers/recommendationController');

router.post('/events', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }), verifyToken, postEvents);

module.exports = router;
