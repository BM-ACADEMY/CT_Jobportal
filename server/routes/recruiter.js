const express = require('express');
const router = express.Router();
const { getRecruiterProfile, updateRecruiterProfile } = require('../controllers/recruiterController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middleware/upload');

// All recruiter routes require authentication and recruiter role
router.use(verifyToken);
router.use(authorizeRoles('recruiter'));

// @route   GET /api/recruiter/profile
router.get('/profile', getRecruiterProfile);

// @route   PUT /api/recruiter/profile
// Supports both avatar and company logo upload
router.put('/profile', upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'logo', maxCount: 1 }
]), updateRecruiterProfile);

module.exports = router;
