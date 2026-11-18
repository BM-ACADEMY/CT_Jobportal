// Companies and recruiters on a free email address (Gmail, Yahoo...) are the limited free tier: one job at a time, and each
// job stays public for 14 days. A company email, or any paid plan, lifts the limit. Pure helpers so the rules are easy to test.
const { isPersonalEmail } = require('./emailKind');
const { planSummary } = require('./userUsage');

const SHORT_LIFE_DAYS = 14;
const LIMITED_MAX_ACTIVE = 1;
const DAY = 86400000;

const isLimitedTier = (user, now = new Date()) => {
  if (!user || !isPersonalEmail(user.email)) return false;
  return !planSummary({ details: user.subscriptionDetails, expiry: user.subscriptionExpiry, now }).paid;
};
const shortLifeCutoff = (now = Date.now()) => new Date(now - SHORT_LIFE_DAYS * DAY);
const LIMITED_MSG = 'Free email accounts can have one live job at a time, and it stays on the site for 14 days. Sign up with your company email or choose a paid plan to post more.';

module.exports = { SHORT_LIFE_DAYS, LIMITED_MAX_ACTIVE, isLimitedTier, shortLifeCutoff, LIMITED_MSG };
