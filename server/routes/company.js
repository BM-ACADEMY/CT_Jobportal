const express = require('express');
const router = express.Router();
const { getRecruiterProfile, updateRecruiterProfile } = require('../controllers/recruiterController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middleware/upload');

// All company routes require authentication and 'company' role
router.use(verifyToken);
router.use(authorizeRoles('company'));

// @route   GET /api/company/profile
// Reusing the same logic as recruiter as they share the same structure
router.get('/profile', getRecruiterProfile);

// @route   PUT /api/company/profile
router.put('/profile', upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'logo', maxCount: 1 }
]), updateRecruiterProfile);

module.exports = router;
