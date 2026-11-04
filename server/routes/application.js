const express = require('express');
const router = express.Router();
const { applyJob, getJobApplicants, updateApplicationStatus, trackDownload, getMyApplications, revokeApplication, exportApplicants, inviteToAssessment } = require('../controllers/applicationController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { requireTeamPermission } = require('../middlewares/teamPermission');
const { APPLICANT_LIST_KEYS } = require('../config/teamPermissions');

router.use(verifyToken);

// Job seeker: view their own applications
router.get('/my-applications', authorizeRoles('jobseeker'), getMyApplications);
router.patch('/:id/revoke', authorizeRoles('jobseeker'), revokeApplication);

// Apply for a job
router.post('/apply', applyJob);

// Recruiter routes
// Team-managed recruiters only reach what their company admin ticked (middlewares/teamPermission.js).
router.get('/job/:jobId', authorizeRoles('recruiter', 'company', 'admin', 'org_employee'), requireTeamPermission(...APPLICANT_LIST_KEYS), getJobApplicants);
router.put('/:id/status', authorizeRoles('recruiter', 'company', 'admin', 'org_employee'), requireTeamPermission('ats_pipeline', 'bulk_applicant_management'), updateApplicationStatus);
router.post('/:id/track-download', authorizeRoles('recruiter', 'company', 'admin', 'org_employee'), requireTeamPermission('ats_pipeline'), trackDownload);
router.get('/export/:jobId', authorizeRoles('recruiter', 'company', 'admin', 'org_employee'), requireTeamPermission('ats_pipeline'), exportApplicants);
router.post('/:id/calculate-match', authorizeRoles('recruiter', 'company', 'admin', 'org_employee'), requireTeamPermission('ats_pipeline', 'ai_candidate_matching'), require('../controllers/applicationController').calculateApplicationMatch);
router.post('/invite-assessment', authorizeRoles('recruiter', 'company', 'admin', 'org_employee'), requireTeamPermission('ats_pipeline'), inviteToAssessment);

module.exports = router;
