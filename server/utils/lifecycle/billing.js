// When to remind about a plan that is ending, and which failed payments deserve a retry mail. Pure, so it can be tested.
const DAY = 86400000;

// Returns { stage, key } for a plan that ends on `expiry`, or null. Each stage is mailed once per expiry date.
const expiryStage = (expiry, now = Date.now()) => {
  if (!expiry) return null;
  const end = new Date(expiry).getTime();
  if (!Number.isFinite(end)) return null;
  const day = new Date(end).toISOString().slice(0, 10);
  const left = (end - now) / DAY;
  if (left > 0 && left <= 1.5) return { stage: 'd1', key: `plan_exp_d1-${day}` };
  if (left > 1.5 && left <= 7.5) return { stage: 'd7', key: `plan_exp_d7-${day}` };
  if (left <= 0 && left > -3) return { stage: 'expired', key: `plan_expired-${day}` };
  return null;
};

// payments: [{ status, createdAt }] for one user. Retry mail when the newest payment failed 1 to 48 hours ago and nothing completed after it.
const failedPaymentDue = (payments = [], now = Date.now()) => {
  const sorted = [...payments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const last = sorted[0];
  if (!last || last.status !== 'failed') return null;
  const hours = (now - new Date(last.createdAt).getTime()) / 3600000;
  return hours >= 1 && hours <= 48 ? { key: `pay_retry-${new Date(last.createdAt).toISOString().slice(0, 10)}` } : null;
};

module.exports = { expiryStage, failedPaymentDue };
