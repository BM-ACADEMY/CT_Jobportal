const router = require('express').Router();
const { rateLimit } = require('../middlewares/rateLimit');
const { getActiveBanner } = require('../controllers/bannerController');

// Public: the one active banner for a placement, or { banner: null }. Management is on /api/admin/banners (admin only).
router.get('/active', rateLimit({ windowMs: 60 * 1000, max: 120 }), getActiveBanner);

module.exports = router;
