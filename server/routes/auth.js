const express = require('express');
const { turnstile } = require('../middlewares/turnstile');
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
const { rateLimit, rateLimitBy } = require('../middlewares/rateLimit');
const { startLinkedinLogin, linkedinCallback } = require('../controllers/linkedinAuth');
const { isSelfServeRole } = require('../utils/selfServeRoles');
const passport = require('passport');

// Brute-force / abuse protection on anything that checks or sends a credential or OTP.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many attempts. Please try again in a few minutes.' });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many OTP requests. Please try again in a few minutes.' });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: 'Too many sign-up attempts. Please try again later.' });

// Per email as well as per IP: a rotating IP cannot flood one inbox or farm signups on one address
const perEmailOtp = rateLimitBy({ fields: ['email'], windowMs: 60 * 60 * 1000, max: 8, message: 'Too many requests for this email. Please try again in an hour.' });
const perEmailRegister = rateLimitBy({ fields: ['email'], windowMs: 60 * 60 * 1000, max: 5, message: 'Too many sign-up attempts for this email. Please try again later.' });

router.post('/register', registerLimiter, turnstile(), perEmailRegister, registerUser);
router.post('/verify-otp', otpLimiter, perEmailOtp, verifyOtp);
router.post('/login', loginLimiter, turnstile(), loginUser);
router.post('/logout', verifyToken, logoutUser);
router.post('/forgot-password', otpLimiter, perEmailOtp, forgotPassword);
router.post('/reset-password', otpLimiter, resetPassword);
router.post('/resend-otp', otpLimiter, perEmailOtp, resendOtp);
router.post('/social-exchange', loginLimiter, socialExchange);
router.post('/complete-social-profile', verifyToken, completeSocialProfile);
router.get('/resend-otp', (req, res) => {
  res.status(405).json({ msg: 'This endpoint only accepts POST requests. If you reached this via a page refresh, please go back and try again.' });
});

// --- Social Auth Routes ---

// Google and LinkedIn sign-in are switched off: email and OTP only. The handlers (controllers/linkedinAuth.js,
// config/passport.js, socialAuthCallback, social-exchange) are kept so the routes can be restored.


router.get('/me', verifyToken, getUserProfile);

module.exports = router;
