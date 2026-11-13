// Daily money in and out, and the marketing budget, from plain records. Pure: no database, no clock except `now`.
const LINES = {
  ads: 'Ads', marketing_other: 'Other marketing', ai: 'AI usage', messaging: 'Email, WhatsApp, SMS',
  hosting_tools: 'Hosting and tools', hiring: 'Hiring', other: 'Other'
};
const CAP_LINES = ['ads', 'marketing_other']; // these count against the marketing cap
const BUDGET = { cap: 35000, start: '2026-11-05', days: 90 };
const RAZORPAY_FEE_RATE = 0.0236; // 2% plus 18% GST on the fee, estimated

const istDate = (d) => new Date(new Date(d).getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
const addDays = (ymd, n) => new Date(new Date(`${ymd}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
const round = (n) => Math.round(n * 100) / 100;

// Money in before GST: the base amount when it was recorded, otherwise the paid amount less 18% GST.
const moneyIn = (p) => (Number(p.baseAmount) > 0 ? Number(p.baseAmount) : Number(p.amount || 0) / 1.18);

const buildSpendSummary = ({ entries = [], payments = [], now = new Date(), days = 14, budget = BUDGET } = {}) => {
  const today = istDate(now);
  const live = entries.filter((e) => !e.voided);
  const rows = new Map();
  const row = (date) => { if (!rows.has(date)) rows.set(date, { date, moneyIn: 0, gst: 0, razorpayFee: 0, spent: 0, byLine: {} }); return rows.get(date); };

  for (let i = 0; i < days; i++) row(addDays(today, -i));
  payments.filter((p) => p.status === 'completed').forEach((p) => {
    const r = row(istDate(p.createdAt));
    r.moneyIn += moneyIn(p);
    r.gst += Math.max(0, Number(p.amount || 0) - moneyIn(p)); // the GST part of what was paid: collected for the government, not ours
    if (!p.manual) r.razorpayFee += Number(p.amount || 0) * RAZORPAY_FEE_RATE; // money paid by hand has no gateway fee
  });
  live.forEach((e) => {
    const r = row(e.date);
    r.spent += e.amount;
    r.byLine[e.line] = (r.byLine[e.line] || 0) + e.amount;
  });

  const daily = [...rows.values()].filter((r) => r.date >= addDays(today, -(days - 1))).sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((r) => ({ ...r, moneyIn: round(r.moneyIn), gst: round(r.gst), razorpayFee: round(r.razorpayFee), net: round(r.moneyIn - r.razorpayFee - r.spent) }));

  const sum = (k) => round(daily.reduce((t, r) => t + r[k], 0));
  const end = addDays(budget.start, budget.days - 1);
  const capSpent = live.filter((e) => CAP_LINES.includes(e.line) && e.date >= budget.start && e.date <= end).reduce((t, e) => t + e.amount, 0);
  const elapsed = Math.max(1, Math.min(budget.days, Math.round((new Date(`${today}T00:00:00Z`) - new Date(`${budget.start}T00:00:00Z`)) / 86400000) + 1));
  const burnPerDay = round(capSpent / elapsed);
  const remaining = Math.max(0, budget.cap - capSpent);
  const daysLeftAtThisRate = burnPerDay > 0 ? Math.floor(remaining / burnPerDay) : null;

  return {
    daily,
    totals: { moneyIn: sum('moneyIn'), gst: sum('gst'), received: round(daily.reduce((t, r) => t + r.moneyIn + r.gst, 0)), razorpayFee: sum('razorpayFee'), spent: sum('spent'), net: sum('net'), days },
    budget: {
      cap: budget.cap, spent: capSpent, remaining, pct: Math.min(100, Math.round((capSpent / budget.cap) * 100)),
      burnPerDay, daysLeftAtThisRate, runsOutOn: daysLeftAtThisRate === null ? null : addDays(today, daysLeftAtThisRate),
      start: budget.start, end, alert: capSpent / budget.cap >= 0.8
    }
  };
};

module.exports = { buildSpendSummary, LINES, CAP_LINES, BUDGET, istDate };
