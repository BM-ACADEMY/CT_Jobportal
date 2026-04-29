const express = require('express');
const router = express.Router();
const { updateProfile, uploadResume, toggleSaveJob, getSavedJobs, getPublicProfile } = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middleware/upload');

// All user routes require authentication
router.use(verifyToken);

router.put('/profile', updateProfile);
router.post('/resume', upload.single('resume'), uploadResume);
router.post('/save-job/:jobId', toggleSaveJob);
router.get('/saved-jobs', getSavedJobs);
router.get('/profile/:id', getPublicProfile);

module.exports = router;
