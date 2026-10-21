const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Role = require('../models/Role');
const { isSelfServeRole } = require('../utils/selfServeRoles');

// Get default role for social logins (Job Seeker)
const getDefaultRole = async () => {
  const role = await Role.findOne({ name: 'jobseeker' });
  return role ? role._id : null;
};

// Picks the production callback URL when actually running in production (NODE_ENV=production,
// as set by the process manager on the deployed server), and the local one otherwise — so
// switching between local dev and production never requires hand-editing .env, and a stray
// local test can't accidentally register a redirect_uri Google doesn't have on file.
const callbackUrl = (envVar) =>
  process.env.NODE_ENV === 'production' ? process.env[envVar] : (process.env[`${envVar}_LOCAL`] || process.env[envVar]);

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackUrl('GOOGLE_CALLBACK_URL'),
      passReqToCallback: true,
      proxy: true
    },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const googleEmail = (profile.emails && profile.emails[0]?.value || '').toLowerCase();
      if (!googleEmail || profile._json?.email_verified === false) {
        return done(null, false, { message: 'Your Google account has no verified email address.' });
      }
      let user = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: googleEmail }
        ]
      });

      if (user) {
        if (!user.googleId) {
          user.googleId = profile.id;
          user.name = profile.displayName || user.name;
          await user.save();
        }
        return done(null, user);
      }

      // Create new user
      let intendedRole = 'jobseeker';
      if (req.query.state) {
        try {
          const stateObj = JSON.parse(req.query.state);
          // Never trust the role from the URL beyond the public sign-up roles.
          if (isSelfServeRole(stateObj.role)) intendedRole = stateObj.role;
        } catch (e) {
          console.error("Failed to parse OAuth state:", e);
        }
      }

      const role = await Role.findOne({ name: intendedRole });
      const roleId = role ? role._id : await getDefaultRole();

      user = await User.create({
        name: profile.displayName,
        email: googleEmail,
        googleId: profile.id,
        role: roleId,
        isVerified: true, // Social accounts are pre-verified
        isSocialIncomplete: true,
        avatar: profile.photos?.[0]?.value || ''
      });

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
  ));
} else {
  console.warn('Google OAuth strategy skipped: Missing credentials in .env');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate('role');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
