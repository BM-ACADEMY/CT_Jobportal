// Anti-spam rules and conversion counting for the automatic mails. Pure, so they are easy to test.
const DAY = 86400000;

// Most marketing-style mails one person can get in 7 days. Job seekers get the most, because jobs are what they came for.
const WEEKLY_CAP = { seeker: 3, company: 2, college: 2 };
const capFor = (audience) => WEEKLY_CAP[audience] ?? 2;

// Mails about money or a plan are never counted against the cap and never held back by it.
const TRANSACTIONAL = /^(plan_|pay_|paid_)/;
const isTransactional = (key) => TRANSACTIONAL.test(String(key || ''));

// Mail may go out when fewer than the cap (non-transactional) mails were sent in the last 7 days.
const underWeeklyCap = (audience, sentLastWeek) => sentLastWeek < capFor(audience);

// The weekly jobs mail goes out Tuesday to Thursday (IST), so everyone gets it in the same calm part of the week.
const isDigestDay = (now = new Date()) => {
  const ist = new Date(now.getTime() + 5.5 * 3600000);
  const d = ist.getUTCDay();
  return d >= 2 && d <= 4;
};

// Applied in the last 2 days = already busy, do not push more jobs at them.
const recentlyApplied = (lastAppliedAt, now = Date.now()) => !!lastAppliedAt && now - new Date(lastAppliedAt).getTime() < 2 * DAY;

// Which mail "caused" a payment: the newest mail the person was sent in the 7 days before paying.
const ATTRIBUTION_DAYS = 7;
const attribute = (payment, logs) => {
  const paidAt = new Date(payment.createdAt).getTime();
  const hit = logs
    .filter((l) => String(l.user) === String(payment.user) && !isTransactional(l.key)
      && new Date(l.sentAt).getTime() <= paidAt && paidAt - new Date(l.sentAt).getTime() <= ATTRIBUTION_DAYS * DAY)
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0];
  return hit ? hit.key : null;
};

// "js_profile_incomplete_d7" and "weekly-2915" -> the mail type, without the date or job id part.
const kindOf = (key) => String(key || '').replace(/-[0-9a-f]{8,}$/i, '').replace(/-\d[\w-]*$/, '');

// Report: per mail type, how many were sent and how many payments followed within 7 days. Honest wording: "followed", not "caused".
const conversionReport = (logs, payments, since = null) => {
  const rows = new Map();
  const row = (k) => { if (!rows.has(k)) rows.set(k, { kind: k, sent: 0, paymentsFollowed: 0, amount: 0 }); return rows.get(k); };
  logs.filter((l) => !isTransactional(l.key) && (!since || new Date(l.sentAt) >= since)).forEach((l) => { row(kindOf(l.key)).sent += 1; });
  payments.forEach((p) => {
    const key = attribute(p, logs);
    if (!key) return;
    const r = row(kindOf(key));
    r.paymentsFollowed += 1;
    r.amount += Number(p.baseAmount || p.amount || 0);
  });
  return [...rows.values()].sort((a, b) => b.amount - a.amount || b.sent - a.sent);
};

module.exports = { WEEKLY_CAP, capFor, isTransactional, underWeeklyCap, isDigestDay, recentlyApplied, attribute, kindOf, conversionReport, ATTRIBUTION_DAYS };
