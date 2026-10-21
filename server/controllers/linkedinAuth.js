// "Sign In with LinkedIn using OpenID Connect" (scopes: openid profile email).
// Written against LinkedIn's OIDC endpoints directly (axios is already a dependency) because the
// older passport-linkedin-oauth2 package targets LinkedIn's retired v1/v2 profile scopes.
//
// Setup (LinkedIn Developer Portal):
//   1. Create an app and add the product "Sign In with LinkedIn using OpenID Connect".
//   2. Add the redirect URL: https://<api-domain>/api/auth/linkedin/callback
//   3. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_CALLBACK_URL
//      (optionally LINKEDIN_CALLBACK_URL_LOCAL for local development).
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const { getJwtSecret } = require('../config/jwt');
const { isSelfServeRole } = require('../utils/selfServeRoles');
const { socialAuthCallback } = require('./authController');

const AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const NONCE_COOKIE = 'li_oauth_nonce';

const isConfigured = () => Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);

const callbackUrl = () => (
  process.env.NODE_ENV === 'production'
    ? process.env.LINKEDIN_CALLBACK_URL
    : (process.env.LINKEDIN_CALLBACK_URL_LOCAL || process.env.LINKEDIN_CALLBACK_URL)
);

const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const failRedirect = (res, reason) => res.redirect(`${frontendUrl()}/login?error=${encodeURIComponent(reason)}`);

const readCookie = (req, name) => {
  const header = req.headers.cookie || '';
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

// GET /api/auth/linkedin?role=jobseeker
const startLinkedinLogin = (req, res) => {
  if (!isConfigured()) return failRedirect(res, 'LinkedIn sign-in is not available right now');

  const role = isSelfServeRole(req.query.role) ? req.query.role : 'jobseeker';
  const nonce = crypto.randomBytes(16).toString('hex');
  // The state is signed (cannot be tampered with) and tied to this browser through the nonce cookie.
  const state = jwt.sign({ role, nonce }, getJwtSecret(), { expiresIn: '10m' });

  res.cookie(NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: callbackUrl(),
    state,
    scope: 'openid profile email',
  });
  return res.redirect(`${AUTH_URL}?${params.toString()}`);
};

// GET /api/auth/linkedin/callback
const linkedinCallback = async (req, res) => {
  if (!isConfigured()) return failRedirect(res, 'LinkedIn sign-in is not available right now');
  try {
    const { code, state, error } = req.query;
    if (error || typeof code !== 'string' || typeof state !== 'string') {
      return failRedirect(res, 'LinkedIn sign-in was cancelled');
    }

    let stateData;
    try {
      stateData = jwt.verify(state, getJwtSecret());
    } catch {
      return failRedirect(res, 'Sign-in session expired. Please try again');
    }
    const cookieNonce = readCookie(req, NONCE_COOKIE);
    res.clearCookie(NONCE_COOKIE);
    if (!cookieNonce || cookieNonce !== stateData.nonce) {
      return failRedirect(res, 'Sign-in session could not be verified. Please try again');
    }

    const tokenRes = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: callbackUrl(),
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
    );

    const profileRes = await axios.get(USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      timeout: 10000,
    });
    const profile = profileRes.data || {};
    const email = typeof profile.email === 'string' ? profile.email.trim().toLowerCase() : '';
    if (!profile.sub || !email || profile.email_verified === false) {
      return failRedirect(res, 'Your LinkedIn account has no verified email address');
    }

    let user = await User.findOne({ $or: [{ linkedinId: profile.sub }, { email }] });

    if (user) {
      if (user.isAdminBlocked) return failRedirect(res, 'Account blocked');
      if (!user.linkedinId) {
        user.linkedinId = profile.sub;
        if (!user.avatar && profile.picture) user.avatar = profile.picture;
        await user.save();
      }
    } else {
      const intendedRole = isSelfServeRole(stateData.role) ? stateData.role : 'jobseeker';
      const role = await Role.findOne({ name: intendedRole }) || await Role.findOne({ name: 'jobseeker' });
      user = await User.create({
        name: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' ') || email.split('@')[0],
        email,
        linkedinId: profile.sub,
        role: role._id,
        isVerified: true, // LinkedIn has verified the email
        isSocialIncomplete: true,
        avatar: profile.picture || '',
      });
    }

    await user.populate('role');
    req.user = user;
    return socialAuthCallback(req, res);
  } catch (err) {
    console.error('LinkedIn login error:', err.response?.data || err.message);
    return failRedirect(res, 'LinkedIn sign-in failed. Please try again');
  }
};

module.exports = { startLinkedinLogin, linkedinCallback };
