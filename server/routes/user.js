const express = require('express');
const router = express.Router();
const { updateProfile, uploadResume, uploadImage, toggleSaveJob, getSavedJobs, getPublicProfile, toggleBlockEntity, trackProfileView, getProfileViewers, updateAutoRenew, searchUser, generateAIResume, analyzeResume, acceptCompanyInvite, declineCompanyInvite } = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middleware/upload');

// All user routes require authentication
router.use(verifyToken);

router.post('/generate-resume', generateAIResume);
router.post('/analyze-resume', upload.single('resume'), analyzeResume);
router.put('/profile', updateProfile);
router.post('/resume', upload.single('resume'), uploadResume);
router.post('/upload-image', upload.single('image'), uploadImage);
router.post('/save-job/:jobId', toggleSaveJob);
router.get('/saved-jobs', getSavedJobs);
router.get('/profile/:id', getPublicProfile);
router.post('/block/:id', toggleBlockEntity);
router.post('/profile/:id/view', trackProfileView);
router.get('/profile/viewers', getProfileViewers);
router.patch('/auto-renew', updateAutoRenew);
router.get('/search', searchUser);

router.post('/accept-company-invite', acceptCompanyInvite);
router.post('/decline-company-invite', declineCompanyInvite);

module.exports = router;
