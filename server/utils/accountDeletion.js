// Self-service account deletion: what may be deleted by the person, and what the account becomes afterwards.
// The row stays (applications, payments and receipts refer to it) but holds no personal data.
const SELF_DELETE_BLOCKED_ROLES = ['admin', 'subadmin', 'company', 'college'];

// Returns { ok: true } or { ok: false, msg }.
const canSelfDelete = ({ role, ownsCompany = false, ownsCollege = false }) => {
  if (SELF_DELETE_BLOCKED_ROLES.includes(role) || ownsCompany || ownsCollege) {
    return { ok: false, msg: 'Organisation and admin accounts are closed by our team so that jobs, payments and people are handled properly. Please write to hello@velaivaaipu.in from your registered email.' };
  }
  return { ok: true };
};

// The MongoDB update that removes personal data. userId is used for a unique, unusable email.
const buildAnonymisePatch = (userId, now = new Date()) => ({
  $set: {
    name: 'Deleted user',
    email: `deleted-${String(userId)}@deleted.invalid`,
    avatar: '',
    coverPic: '',
    isVerified: false,
    isDeleted: true,
    deletedAt: now,
    'profile.headline': '',
    'profile.phone': '',
    'profile.location': '',
    'profile.bio': '',
    'profile.skills': [],
    'profile.qualification': [],
    'profile.experience': [],
    'profile.interestedDomain': [],
    'profile.shifts': [],
    'profile.preferredRole': '',
    'profile.resumeUrl': '',
    'profile.resumeName': '',
    'profile.portfolioUrl': '',
    'profile.documents': [],
    'emailPrefs.marketingOptOut': true,
    'emailPrefs.optOutAt': now,
  },
  $unset: { password: 1, otp: 1, otpExpiry: 1, googleId: 1, githubId: 1, linkedinId: 1 },
});

// Confirmation rules: the word DELETE must be typed; people who have a password must also give it.
const confirmationProblem = ({ confirm, hasPassword, passwordMatches }) => {
  if (String(confirm || '').trim() !== 'DELETE') return 'Type DELETE to confirm.';
  if (hasPassword && !passwordMatches) return 'The password is not correct.';
  return null;
};

module.exports = { canSelfDelete, buildAnonymisePatch, confirmationProblem, SELF_DELETE_BLOCKED_ROLES };
