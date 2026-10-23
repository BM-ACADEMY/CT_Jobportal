const router = require('express').Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getOnboarding, markTourSeen } = require('../controllers/onboardingController');

router.get('/', verifyToken, getOnboarding);
router.post('/tour-seen', verifyToken, markTourSeen);

module.exports = router;
