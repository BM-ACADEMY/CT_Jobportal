const express = require('express');
const router = express.Router();
const c = require('../controllers/jobFairController');
const ops = require('../controllers/fairOpsController');
const { verifyToken, authorizeRoles, optionalVerifyToken } = require('../middlewares/authMiddleware');
const { rateLimit } = require('../middlewares/rateLimit');

// Admin (fixed paths first so ':slug' does not swallow them)
router.get('/admin/all', verifyToken, authorizeRoles('admin'), c.adminList);
router.post('/admin', verifyToken, authorizeRoles('admin'), c.adminCreate);
// Steps 2 to 4 (Super Admin only). Fixed paths stay above '/admin/:id'.
router.post('/admin/from-notice', verifyToken, authorizeRoles('admin'), rateLimit({ windowMs: 3600000, max: 30 }), ops.fromNotice);
router.get('/admin/stall-price', verifyToken, authorizeRoles('admin'), ops.getStallPrice);
router.patch('/admin/stall-price', verifyToken, authorizeRoles('admin'), ops.setStallPrice);
router.patch('/admin/stalls/:stallId', verifyToken, authorizeRoles('admin'), ops.adminStallStatus);
router.get('/admin/:id/stalls', verifyToken, authorizeRoles('admin'), ops.adminStalls);
router.get('/admin/:id/checkin', verifyToken, authorizeRoles('admin'), ops.checkInList);
router.post('/admin/:id/checkin', verifyToken, authorizeRoles('admin'), ops.checkIn);
router.post('/admin/:id/send-mail', verifyToken, authorizeRoles('admin'), rateLimit({ windowMs: 3600000, max: 30 }), ops.sendMail);
router.patch('/admin/:id', verifyToken, authorizeRoles('admin'), c.adminUpdate);

// Public
router.get('/', c.listFairs);
router.get('/:slug', optionalVerifyToken, c.getFair);
router.get('/:slug/card.svg', c.fairCard);
router.get('/:slug/stall', verifyToken, authorizeRoles('company', 'recruiter'), ops.myStall);
router.post('/:slug/stall', verifyToken, authorizeRoles('company', 'recruiter'), rateLimit({ windowMs: 3600000, max: 20 }), ops.requestStall);
router.post('/:slug/going', verifyToken, rateLimit({ windowMs: 3600000, max: 60 }), c.toggleGoing);

module.exports = router;
