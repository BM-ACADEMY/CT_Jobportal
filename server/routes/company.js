const express = require('express');
const router = express.Router();
const { getRecruiterProfile, updateRecruiterProfile, getTeamMembers, addTeamMember, removeTeamMember, updateTeamMemberPermissions, toggleTeamMemberSeat, getTeamActivity, getOrgEmployees, removeOrgEmployee, getJoinRequests, acceptJoinRequest, rejectJoinRequest, toggleCompanyAutoRenew } = require('../controllers/recruiterController');
const { getIncomingDriveRequests, respondToDriveRequest } = require('../controllers/companyDriveController');
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
router.post('/team/invite', addTeamMember);
router.put('/team/:memberId/permissions', updateTeamMemberPermissions);
router.put('/team/:memberId/seat', toggleTeamMemberSeat);
router.get('/team-activity', getTeamActivity);
router.delete('/team/:memberId', removeTeamMember);

// Org employee management routes (add-employee entry point removed — superseded by /team/invite)
router.get('/employees', getOrgEmployees);
router.delete('/employees/:employeeId', removeOrgEmployee);

// Join requests routes
router.get('/join-requests', getJoinRequests);
router.post('/join-requests/:userId/accept', acceptJoinRequest);
router.post('/join-requests/:userId/reject', rejectJoinRequest);

// Subscription auto-renew (spec 9.4)
router.put('/subscription/auto-renew', toggleCompanyAutoRenew);

// Campus drive participation requests (from colleges)
router.get('/drive-requests', getIncomingDriveRequests);
router.post('/drive-requests/:driveId/:companyEntryId/respond', respondToDriveRequest);

module.exports = router;
