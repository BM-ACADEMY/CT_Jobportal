// "Did you get what you expected?" after a payment: signed one-click links, score mapping and the numbers for the Admin table.
// jwt is loaded only when a link is made or checked, so the summary numbers load anywhere.

const MET = ['yes', 'partly', 'no'];
const MET_RATING = { yes: 5, partly: 3, no: 1 }; // a one-click answer already gives a score; the form can refine it
const ASK_AFTER_DAYS = 7;
const ASK_WINDOW_DAYS = 21;

const signFeedbackToken = (userId, paymentId) =>
  require('jsonwebtoken').sign({ uid: String(userId), pid: String(paymentId), purpose: 'payment-feedback' }, require('../config/jwt').getJwtSecret(), { expiresIn: '60d' });
const verifyFeedbackToken = (token) => {
  try {
    const p = require('jsonwebtoken').verify(String(token || ''), require('../config/jwt').getJwtSecret());
    return p.purpose === 'payment-feedback' && p.uid && p.pid ? p : null;
  } catch { return null; }
};

// Pure: rows are Feedback docs with source 'payment' ({ rating, met, item, comment text, createdAt }).
const summarise = (rows) => {
  const n = rows.length;
  const avg = (xs) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  const byItem = new Map();
  rows.forEach((r) => {
    const k = r.item || 'Other';
    const o = byItem.get(k) || { item: k, count: 0, ratings: [], yes: 0, partly: 0, no: 0 };
    o.count += 1; o.ratings.push(r.rating);
    if (MET.includes(r.met)) o[r.met] += 1;
    byItem.set(k, o);
  });
  const items = [...byItem.values()]
    .map((o) => ({ item: o.item, count: o.count, average: avg(o.ratings), yes: o.yes, partly: o.partly, no: o.no }))
    .sort((a, b) => (a.average ?? 9) - (b.average ?? 9)); // weakest first: that is what to fix
  const answered = rows.filter((r) => MET.includes(r.met));
  return {
    total: n,
    average: avg(rows.map((r) => r.rating)),
    metPercent: answered.length ? Math.round((answered.filter((r) => r.met === 'yes').length / answered.length) * 100) : null,
    notMet: answered.filter((r) => r.met === 'no').length,
    items,
  };
};

module.exports = { MET, MET_RATING, ASK_AFTER_DAYS, ASK_WINDOW_DAYS, signFeedbackToken, verifyFeedbackToken, summarise };
