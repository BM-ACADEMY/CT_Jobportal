const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/User');
const Role = require('../models/Role');

// Get default role for social logins (Job Seeker)
const getDefaultRole = async () => {
  const role = await Role.findOne({ name: 'jobseeker' });
  return role ? role._id : null;
};

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      proxy: true
    },
  async (accessToken, refreshToken, profile, done) => {
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
      const roleId = await getDefaultRole();
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
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email']
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0]?.value; 
      // Note: GitHub might not return email if it's private.
      
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

      const roleId = await getDefaultRole();
      user = await User.create({
        name: profile.displayName || profile.username,
        email: email || `${profile.username}@github.com`, // Fallback email
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

// LinkedIn Strategy
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(new LinkedInStrategy({
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: ['openid', 'profile', 'email'],
      proxy: true
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ 
        $or: [
          { linkedinId: profile.id },
          { email: profile.emails[0].value }
        ]
      });

      if (user) {
        if (!user.linkedinId) {
          user.linkedinId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      const roleId = await getDefaultRole();
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
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
  }
  ));
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
