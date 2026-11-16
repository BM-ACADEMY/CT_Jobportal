const express = require('express');
const { rateLimit } = require('../middlewares/rateLimit');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { verifyCertificate, myCertificate } = require('../controllers/internshipCertificateController');

const router = express.Router();

// Public: anyone with the code can check a certificate.
router.get('/verify/:code', rateLimit({ windowMs: 15 * 60 * 1000, max: 60 }), verifyCertificate);
// The student opens their own certificate from My Applications.
router.get('/mine/:applicationId', verifyToken, authorizeRoles('jobseeker'), myCertificate);

module.exports = router;
