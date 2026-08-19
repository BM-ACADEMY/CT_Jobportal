const router = require('express').Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { listNotifications, markRead, markAllRead } = require('../controllers/notificationController');

router.get('/', verifyToken, listNotifications);
router.patch('/read-all', verifyToken, markAllRead);
router.patch('/:id/read', verifyToken, markRead);

module.exports = router;
