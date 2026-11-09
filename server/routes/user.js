const express = require('express');
const router = express.Router();
const { 
  updateProfile, 
  uploadResume, 
  uploadImage, 
  toggleSaveJob, 
  getSavedJobs, 
  toggleHideJob, 
  getHiddenJobs, 
  getPublicProfile, 
  toggleBlockEntity, 
  trackProfileView, 
  getProfileViewers, 
  updateAutoRenew, 
  searchUser, 
  generateAIResume, 
  analyzeResume, 
  acceptCompanyInvite, 
  declineCompanyInvite,
  uploadDocuments,
  updateDocument,
  deleteDocument,
  deleteMyAccount
} = require('../controllers/userController');
const { setWhatsAppOptIn, getReferrals } = require('../controllers/whatsappReferralController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { aiDailyCap } = require('../middlewares/aiDailyCap');
const { freeAiMonthly } = require('../middlewares/freeAiMonthly');
const upload = require('../middleware/upload');

// All user routes require authentication
router.use(verifyToken);
router.delete('/me', deleteMyAccount);

router.post('/generate-resume', freeAiMonthly('resume_build'), aiDailyCap('other'), generateAIResume);
router.post('/analyze-resume', freeAiMonthly('resume_check'), aiDailyCap('other'), upload.single('resume'), analyzeResume);
router.put('/profile', updateProfile);
router.put('/whatsapp-optin', setWhatsAppOptIn);
router.get('/free-ai-status', require('../controllers/freeAiController').myStatus);
router.put('/brand-consent', require('../controllers/brandLeadController').setBrandConsent);
router.get('/brand-consent', require('../controllers/brandLeadController').getBrandConsent);
router.get('/referrals', getReferrals);
router.post('/resume', upload.single('resume'), uploadResume);
router.post('/documents', upload.array('documents', 20), upload.convertImagesToWebp, uploadDocuments);
router.put('/documents/:docId', updateDocument);
router.delete('/documents/:docId', deleteDocument);
router.post('/upload-image', upload.single('image'), upload.convertImagesToWebp, uploadImage);
router.post('/save-job/:jobId', toggleSaveJob);
router.get('/saved-jobs', getSavedJobs);
router.post('/hide-job/:jobId', toggleHideJob);
router.get('/hidden-jobs', getHiddenJobs);
router.get('/profile/:id', getPublicProfile);
router.post('/block/:id', toggleBlockEntity);
router.post('/profile/:id/view', trackProfileView);
router.get('/profile/viewers', getProfileViewers);
router.patch('/auto-renew', updateAutoRenew);
router.get('/search', searchUser);

router.post('/accept-company-invite', acceptCompanyInvite);
router.post('/decline-company-invite', declineCompanyInvite);

module.exports = router;
