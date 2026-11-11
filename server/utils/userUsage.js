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

module.exports = { daysLeft, planSummary, featureRows };
