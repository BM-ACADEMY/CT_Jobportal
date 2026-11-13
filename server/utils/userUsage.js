// What one person has, what they used and how long is left. Read only. Used by the admin user page.
const DAY = 86400000;
const daysLeft = (expiry, now = new Date()) => (expiry ? Math.max(0, Math.ceil((new Date(expiry).getTime() - now.getTime()) / DAY)) : null);

// details is the person's plan copy (user.subscriptionDetails or the plan document); expiry is user.subscriptionExpiry.
const planSummary = ({ details, expiry, autoRenew, now = new Date() }) => {
  if (!details) return { name: 'No plan', price: 0, paid: false, expiry: null, daysLeft: null, autoRenew: !!autoRenew, state: 'none' };
  const lifetime = details.duration === 'Lifetime';
  const expired = !!expiry && new Date(expiry) <= now && Number(details.price) > 0;
  return {
    name: details.name || 'Plan', price: Number(details.price) || 0, duration: details.duration || '',
    paid: Number(details.price) > 0 && !expired, expiry: lifetime ? null : (expiry || null),
    daysLeft: lifetime ? null : daysLeft(expiry, now), autoRenew: !!autoRenew,
    state: expired ? 'expired' : (Number(details.price) > 0 ? 'active' : 'free')
  };
};

const featureRows = (purchased = [], now = new Date()) => purchased.map((f) => ({
  key: f.featureKey, active: !!f.isActive && (!f.expiresAt || new Date(f.expiresAt) > now),
  usageLeft: Number(f.usageLeft) || 0, expiresAt: f.expiresAt || null, daysLeft: daysLeft(f.expiresAt, now), boughtAt: f.purchasedAt || null
}));

// One plain hint on who is worth a call and why. A hint only: nothing is sent to anyone.
// t = { role, plan (planSummary), freeAi30 (free AI uses, last 30 days), latestTest {skill, percentage, passed} | null, jobsPosted }
const suggestFor = ({ role = 'jobseeker', plan = {}, freeAi30 = 0, latestTest = null, jobsPosted = 0 } = {}) => {
  if (plan.state === 'expired') return 'Plan has ended: ask if they want to renew';
  if (plan.paid) return '';
  if (role === 'recruiter' || role === 'company') return jobsPosted > 0 ? 'Posting jobs on the free plan: offer a paid plan' : '';
  if (role !== 'jobseeker') return '';
  if (latestTest && latestTest.passed === false) return `Did not pass ${latestTest.skill}: offer a BM Academy course`;
  if (latestTest && Number(latestTest.percentage) >= 70) return `Scored ${latestTest.percentage}% in ${latestTest.skill}: offer a premium plan`;
  if (freeAi30 >= 5) return 'Uses the free AI tools a lot: offer a premium plan';
  return '';
};

module.exports = { daysLeft, planSummary, featureRows, suggestFor };
