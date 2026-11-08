const express = require('express');
const router = express.Router();
const c = require('../controllers/walkInDriveController');
const { verifyToken, authorizeRoles, optionalVerifyToken } = require('../middlewares/authMiddleware');
const { rateLimit } = require('../middlewares/rateLimit');

const org = [verifyToken, authorizeRoles('company', 'recruiter')];

// Organiser (fixed paths first so ':slug' does not swallow them)
router.post('/', ...org, rateLimit({ windowMs: 3600000, max: 20 }), c.createDrive);
router.get('/mine', ...org, c.myDrives);
router.get('/mine/:id', ...org, c.manageDrive);
router.post('/mine/:id/check-in', ...org, c.checkIn);
router.patch('/mine/:id/registrations/:regId', ...org, c.updateRegistration);
router.post('/mine/:id/addons', ...org, c.requestAddon);
router.post('/mine/:id/thanks', ...org, c.sendThanks);
router.get('/mine/:id/report', ...org, c.report);

// Public
router.get('/registration/:code', c.getRegistration);
router.get('/registration/:code/qr.png', c.registrationQr);
router.get('/', c.listDrives);
router.get('/:slug', c.getDrive);
router.get('/:slug/qr.png', c.driveQr);
router.post('/:slug/register', optionalVerifyToken, rateLimit({ windowMs: 3600000, max: 15 }), c.registerForDrive);

module.exports = router;
