const express = require('express');
const router = express.Router();
const c = require('../controllers/jobFairController');
const { verifyToken, authorizeRoles, optionalVerifyToken } = require('../middlewares/authMiddleware');
const { rateLimit } = require('../middlewares/rateLimit');

// Admin (fixed paths first so ':slug' does not swallow them)
router.get('/admin/all', verifyToken, authorizeRoles('admin'), c.adminList);
router.post('/admin', verifyToken, authorizeRoles('admin'), c.adminCreate);
router.patch('/admin/:id', verifyToken, authorizeRoles('admin'), c.adminUpdate);

// Public
router.get('/', c.listFairs);
router.get('/:slug', optionalVerifyToken, c.getFair);
router.get('/:slug/card.svg', c.fairCard);
router.post('/:slug/going', verifyToken, rateLimit({ windowMs: 3600000, max: 60 }), c.toggleGoing);

module.exports = router;
