const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const sendEmail = require('../utils/sendEmail');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (userId, roleName) => {
  return jwt.sign(
    { id: userId, role: roleName },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user (sends OTP)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Password Validation: 6 chars, 1 capital, 1 number, 1 symbol
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|~`\-]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        msg: 'Password must be at least 6 characters long and include an uppercase letter, a number, and a special character.' 
      });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ msg: 'User already exists and is verified' });
      }
      // If user exists but NOT verified, we will overwrite their details (allow them to resend OTP)
      await User.deleteOne({ email: normalizedEmail });
    }

    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      return res.status(400).json({ msg: 'Invalid role specified' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const otp = generateOTP();
    console.log(`\n\n=== [AUTH DEBUG] REGISTRATION OTP FOR ${normalizedEmail}: ${otp} ===\n\n`);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: roleDoc._id,
      isVerified: false,
      otp,
      otpExpiry,
    });

    await user.save();

    // Send OTP Email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; color: #333;">
        <h2 style="color: #1d4ed8;">Welcome to Naukri Clone!</h2>
        <p style="font-size: 16px;">Hi ${name},</p>
        <p style="font-size: 16px;">Thank you for registering. Please use the following OTP to verify your email address. It is valid for 10 minutes.</p>
        <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #6b7280;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    const emailSent = await sendEmail({
      email,
      subject: 'Verify Your Email - Naukri Clone',
      html: htmlContent
    });

    if (!emailSent) {
      return res.status(201).json({ 
        requireOtp: true, 
        email: user.email, 
        msg: 'Registration successful but failed to send OTP email. Please use the resend OTP option.' 
      });
    }

    res.status(201).json({ requireOtp: true, email: user.email, msg: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ msg: err.message, stack: err.stack });
  }
};

// @desc    Verify OTP for Registration or Login
// @route   POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email ? email.toLowerCase() : '';

    const user = await User.findOne({ email: normalizedEmail }).populate('role');
    if (!user) {
        return res.status(404).json({ msg: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // Mark verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const roleName = user.role.name;
    const token = generateToken(user._id, roleName);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: roleName,
        avatar: user.avatar,
      }
    });

  } catch (err) {
    console.error('Verify OTP Error:', err.message);
    res.status(500).json({ msg: err.message, stack: err.stack });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('role');
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    if (!user.isVerified) {
      // Setup new OTP and resend
      const otp = generateOTP();
      console.log(`\n\n=== [AUTH DEBUG] RESEND OTP FOR ${email}: ${otp} ===\n\n`);
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; color: #333;">
          <h2 style="color: #1d4ed8;">Verify Your Account</h2>
          <p style="font-size: 16px;">Hi ${user.name}, you tried to log in but your account isn't verified.</p>
          <p style="font-size: 16px;">Your new OTP is:</p>
          <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">
            ${otp}
          </div>
        </div>
      `;
      const emailSent = await sendEmail({ email, subject: 'Verify Your Email - Naukri Clone', html: htmlContent });
      
      const msg = emailSent 
        ? 'Account not verified. New OTP sent.' 
        : 'Account not verified. Failed to send OTP email. Please try resending OTP.';

      return res.status(200).json({ requireOtp: true, email: user.email, msg });
    }

    const roleName = user.role.name;
    const token = generateToken(user._id, roleName);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: roleName,
        avatar: user.avatar,
      }
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ msg: err.message, stack: err.stack });
  }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: 'No user found with this email' });
    }

    const otp = generateOTP();
    console.log(`\n\n=== [AUTH DEBUG] FORGOT PASSWORD OTP FOR ${email}: ${otp} ===\n\n`);
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; color: #333;">
        <h2 style="color: #1d4ed8;">Password Reset Request</h2>
        <p style="font-size: 16px;">Hi ${user.name},</p>
        <p style="font-size: 16px;">You requested to reset your password. Use the following OTP to securely verify your identity.</p>
        <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #6b7280;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `;

    const emailSent = await sendEmail({ email, subject: 'Password Reset OTP - Naukri Clone', html: htmlContent });

    if (!emailSent) {
      return res.status(500).json({ msg: 'Failed to send password reset email. Please try again later.' });
    }

    res.json({ msg: 'Password reset OTP sent to email' });
  } catch (err) {
    console.error('Forgot Password Error:', err.message);
    res.status(500).json({ msg: err.message, stack: err.stack });
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ msg: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('Reset Password Error:', err.message);
    res.status(500).json({ msg: err.message, stack: err.stack });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('role');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      avatar: user.avatar,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'Account is already verified. Please login.' });
    }

    const otp = generateOTP();
    console.log(`\n\n=== [AUTH DEBUG] RESEND OTP FOR ${normalizedEmail}: ${otp} ===\n\n`);
    
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; color: #333;">
        <h2 style="color: #1d4ed8;">Your New OTP Code</h2>
        <p style="font-size: 16px;">Hi ${user.name},</p>
        <p style="font-size: 16px;">You requested a new verification code. It is valid for 10 minutes.</p>
        <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #6b7280;">If you didn't request this, please ignore this email.</p>
      </div>
    `;

    const emailSent = await sendEmail({
      email: normalizedEmail,
      subject: 'New Verification Code - Naukri Clone',
      html: htmlContent
    });

    if (!emailSent) {
      return res.status(500).json({ msg: 'Failed to send new OTP. Please try again.' });
    }

    res.json({ msg: 'New OTP has been sent to your email.' });

  } catch (err) {
    console.error('Resend OTP Error:', err.message);
    res.status(500).json({ msg: 'Server error while resending OTP' });
  }
};

// @desc    Social Auth Callback (handle redirect)
const socialAuthCallback = (req, res) => {
  const user = req.user;
  const roleName = user.role.name || 'jobseeker'; // Use populated role or default
  const token = generateToken(user._id, roleName);
  
  // Create user object to send as JSON in query (simplified for demo)
  const userData = encodeURIComponent(JSON.stringify({
    id: user._id,
    name: user.name,
    email: user.email,
    role: roleName,
    avatar: user.avatar
  }));

  // Redirect to frontend with token and user data
  // Using a query param is common for simple SPA social auth
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/social-auth-success?token=${token}&user=${userData}`);
};

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  forgotPassword,
  resetPassword,
  getUserProfile,
  resendOtp,
  socialAuthCallback,
};
