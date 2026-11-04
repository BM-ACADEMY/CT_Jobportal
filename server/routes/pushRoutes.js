const router = require('express').Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getConfig, subscribe, unsubscribe, getPrefs, updatePrefs, sendTest } = require('../controllers/pushController');

// Public: tells the browser whether push is on and which VAPID public key to subscribe with.
router.get('/config', getConfig);

router.use(verifyToken);
router.post('/subscribe', subscribe);
router.delete('/subscribe', unsubscribe);
router.get('/prefs', getPrefs);
router.put('/prefs', updatePrefs);
router.post('/test', sendTest);

module.exports = router;
