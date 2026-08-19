const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const OAuth2Strategy = require('passport-oauth2').Strategy;
const User = require('../models/User');
const Role = require('../models/Role');

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
      let user = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
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
          if (stateObj.role) intendedRole = stateObj.role;
        } catch (e) {
          console.error("Failed to parse OAuth state:", e);
        }
      }

      const role = await Role.findOne({ name: intendedRole });
      const roleId = role ? role._id : await getDefaultRole();

      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        role: roleId,
        isVerified: true, // Social accounts are pre-verified
        isSocialIncomplete: true,
        avatar: profile.photos[0]?.value || ''
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

// GitHub Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: callbackUrl('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
      passReqToCallback: true
    },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      let email = profile.emails && profile.emails[0]?.value;

      // GitHub only includes an email in the profile response if the user made one public.
      // The `user:email` scope still grants read access to their real (verified) address via
      // this endpoint, so fetch it rather than fabricating a fake @github.com address.
      if (!email) {
        try {
          const emailRes = await fetch('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'Velaivaaipu' }
          });
          if (emailRes.ok) {
            const emails = await emailRes.json();
            const primary = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified) || emails[0];
            email = primary?.email;
          }
        } catch (fetchErr) {
          console.error('GitHub email fetch failed:', fetchErr.message);
        }
      }

      let user = await User.findOne({
        $or: [
          { githubId: profile.id },
          ...(email ? [{ email }] : [])
        ]
      });

      if (user) {
        if (!user.githubId) {
          user.githubId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      if (!email) {
        return done(null, false, { message: 'Your GitHub account has no accessible email address. Please make an email public on GitHub or use a different sign-in method.' });
      }

      // Create new user
      let intendedRole = 'jobseeker';
      if (req.query.state) {
        try {
          const stateObj = JSON.parse(req.query.state);
          if (stateObj.role) intendedRole = stateObj.role;
        } catch (e) {
          console.error("Failed to parse GitHub OAuth state:", e);
        }
      }

      const role = await Role.findOne({ name: intendedRole });
      const roleId = role ? role._id : await getDefaultRole();

      user = await User.create({
        name: profile.displayName || profile.username,
        email,
        githubId: profile.id,
        role: roleId,
        isVerified: true,
        isSocialIncomplete: true,
        avatar: profile.photos[0]?.value || ''
      });

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
  ));
} else {
  console.warn('GitHub OAuth strategy skipped: Missing credentials in .env');
}

// LinkedIn Strategy — built directly on the generic OAuth2Strategy rather than the
// `passport-linkedin-oauth2` package. That package targets LinkedIn's deprecated /v2/me API
// and only fetches an email under the legacy `r_emailaddress` scope; it never matches the
// modern "Sign In with LinkedIn using OpenID Connect" product (scope: openid/profile/email),
// so every login through it fails. This talks to LinkedIn's real OIDC endpoints instead.
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  const linkedinStrategy = new OAuth2Strategy({
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: callbackUrl('LINKEDIN_CALLBACK_URL'),
      scope: ['openid', 'profile', 'email'],
      passReqToCallback: true
    },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0]?.value;

      let user = await User.findOne({
        $or: [
          { linkedinId: profile.id },
          ...(email ? [{ email }] : [])
        ]
      });

      if (user) {
        if (!user.linkedinId) {
          user.linkedinId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      if (!email) {
        return done(null, false, { message: 'Your LinkedIn account has no verified email address.' });
      }

      // Create new user
      let intendedRole = 'jobseeker';
      if (req.query.state) {
        try {
          const stateObj = JSON.parse(req.query.state);
          if (stateObj.role) intendedRole = stateObj.role;
        } catch (e) {
          console.error("Failed to parse LinkedIn OAuth state:", e);
        }
      }

      const role = await Role.findOne({ name: intendedRole });
      const roleId = role ? role._id : await getDefaultRole();

      user = await User.create({
        name: profile.displayName,
        email,
        linkedinId: profile.id,
        role: roleId,
        isVerified: true,
        isSocialIncomplete: true,
        avatar: profile.photos[0]?.value || ''
      });

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  });

  // passport-oauth2's default userProfile() is a no-op — override it to hit LinkedIn's OIDC
  // userinfo endpoint, which returns { sub, name, given_name, family_name, email, picture, ... }.
  linkedinStrategy.userProfile = async function (accessToken, done) {
    try {
      const res = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error(`LinkedIn userinfo request failed: ${res.status}`);
      const data = await res.json();
      done(null, {
        provider: 'linkedin',
        id: data.sub,
        displayName: data.name || [data.given_name, data.family_name].filter(Boolean).join(' '),
        emails: data.email ? [{ value: data.email }] : [],
        photos: data.picture ? [{ value: data.picture }] : []
      });
    } catch (err) {
      done(err);
    }
  };

  passport.use('linkedin', linkedinStrategy);
} else {
  console.warn('LinkedIn OAuth strategy skipped: Missing credentials in .env');
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
