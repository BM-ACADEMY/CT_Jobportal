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
const { verifyToken } = require('../middlewares/authMiddleware');
const { aiDailyCap } = require('../middlewares/aiDailyCap');
const upload = require('../middleware/upload');

// All user routes require authentication
router.use(verifyToken);
router.delete('/me', deleteMyAccount);

router.post('/generate-resume', aiDailyCap('other'), generateAIResume);
router.post('/analyze-resume', aiDailyCap('other'), upload.single('resume'), analyzeResume);
router.put('/profile', updateProfile);
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
