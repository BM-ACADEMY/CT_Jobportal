const router = require('express').Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { listNotifications, markRead, markAllRead, deleteNotification, deleteReadNotifications } = require('../controllers/notificationController');

router.get('/', verifyToken, listNotifications);
router.patch('/read-all', verifyToken, markAllRead);
router.delete('/read', verifyToken, deleteReadNotifications);
router.patch('/:id/read', verifyToken, markRead);
router.delete('/:id', verifyToken, deleteNotification);

module.exports = router;
