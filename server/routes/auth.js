const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  verifyOtp,
  forgotPassword,
  resetPassword,
  getUserProfile,
  resendOtp,
  socialAuthCallback,
  socialExchange,
  completeSocialProfile
} = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { rateLimit } = require('../middlewares/rateLimit');
const { startLinkedinLogin, linkedinCallback } = require('../controllers/linkedinAuth');
const { isSelfServeRole } = require('../utils/selfServeRoles');
const passport = require('passport');

// Brute-force / abuse protection on anything that checks or sends a credential or OTP.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many attempts. Please try again in a few minutes.' });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many OTP requests. Please try again in a few minutes.' });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: 'Too many sign-up attempts. Please try again later.' });

router.post('/register', registerLimiter, registerUser);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/login', loginLimiter, loginUser);
router.post('/logout', verifyToken, logoutUser);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpLimiter, resetPassword);
router.post('/resend-otp', otpLimiter, resendOtp);
router.post('/social-exchange', loginLimiter, socialExchange);
router.post('/complete-social-profile', verifyToken, completeSocialProfile);
router.get('/resend-otp', (req, res) => {
  res.status(405).json({ msg: 'This endpoint only accepts POST requests. If you reached this via a page refresh, please go back and try again.' });
});

// --- Social Auth Routes ---

// Google
router.get('/google', (req, res, next) => {
  const role = isSelfServeRole(req.query.role) ? req.query.role : 'jobseeker';
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: JSON.stringify({ role })
  })(req, res, next);
});
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), socialAuthCallback);

// LinkedIn (OpenID Connect)
router.get('/linkedin', startLinkedinLogin);
router.get('/linkedin/callback', linkedinCallback);


router.get('/me', verifyToken, getUserProfile);

module.exports = router;
