const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  verifyOtp,
  forgotPassword,
  resetPassword,
  getUserProfile,
  resendOtp,
  socialAuthCallback,
  completeSocialProfile
} = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const passport = require('passport');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendOtp);
router.post('/complete-social-profile', completeSocialProfile);
router.get('/resend-otp', (req, res) => {
  res.status(405).json({ msg: 'This endpoint only accepts POST requests. If you reached this via a page refresh, please go back and try again.' });
});

// --- Social Auth Routes ---

// Google
router.get('/google', (req, res, next) => {
  const role = req.query.role || 'jobseeker';
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: JSON.stringify({ role })
  })(req, res, next);
});
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), socialAuthCallback);

// GitHub
router.get('/github', (req, res, next) => {
  const role = req.query.role || 'jobseeker';
  passport.authenticate('github', { 
    scope: ['user:email'],
    state: JSON.stringify({ role })
  })(req, res, next);
});
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), socialAuthCallback);

// LinkedIn
router.get('/linkedin', (req, res, next) => {
  const role = req.query.role || 'jobseeker';
  passport.authenticate('linkedin', { 
    state: JSON.stringify({ role })
  })(req, res, next);
});
router.get('/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), socialAuthCallback);

router.get('/me', verifyToken, getUserProfile);

module.exports = router;
