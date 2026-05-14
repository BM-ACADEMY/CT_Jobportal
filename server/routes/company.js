const express = require('express');
const router = express.Router();
const { getRecruiterProfile, updateRecruiterProfile, getTeamMembers, inviteTeamMember, removeTeamMember, getOrgEmployees, addOrgEmployee, removeOrgEmployee } = require('../controllers/recruiterController');
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

// Team management routes (company/org only)
router.get('/team', getTeamMembers);
router.post('/team/invite', inviteTeamMember);
router.delete('/team/:memberId', removeTeamMember);

// Org employee management routes
router.get('/employees', getOrgEmployees);
router.post('/employees', addOrgEmployee);
router.delete('/employees/:employeeId', removeOrgEmployee);

module.exports = router;
