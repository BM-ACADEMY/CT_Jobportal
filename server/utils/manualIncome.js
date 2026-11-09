// Money received BY HAND (UPI or bank, marked paid by an admin) for walk-in drives: the plan and every paid add-on.
// These never create a Razorpay Payment record, so the dashboard and the money page add them from here.
// Pure functions: no database. Sponsored jobs are added by sponsorRows when the admin typed the amount received.
const { PLANS, ADDONS, GST_RATE } = require('../config/driveConfig');

const round2 = (n) => Math.round(n * 100) / 100;
const asDate = (d) => { const t = d ? new Date(d) : null; return t && Number.isFinite(t.getTime()) ? t : null; };

// One row per paid plan or add-on: { at, base (before GST), total (with GST), label, drive }.
// `from` (inclusive) and `to` (exclusive) keep only money received in that window. A paid item with no paid date is skipped when a window is given.
const manualPaymentRows = (drives = [], { from = null, to = null } = {}) => {
  const rows = [];
  const keep = (at) => ((from || to) ? !!at : true) && (!from || at >= from) && (!to || at < to);
  for (const d of drives) {
    const plan = PLANS[d?.plan];
    const planAt = asDate(d?.paidAt);
    if (d?.paid && plan && plan.price > 0 && keep(planAt)) {
      rows.push({ at: planAt, base: plan.price, total: round2(plan.price * (1 + GST_RATE)), label: plan.label, drive: d._id });
    }
    for (const a of d?.addons || []) {
      const def = ADDONS[a?.key];
      const at = asDate(a?.paidAt);
      if (!def || !a.paid || !keep(at)) continue;
      const qty = Math.max(1, Number(a.qty) || 1);
      const base = def.price * qty;
      rows.push({ at, base, total: round2(base * (1 + GST_RATE)), label: def.label, drive: d._id });
    }
  }
  return rows;
};

// Sponsored-job payments (amount is what the company paid, GST included). Same row shape as above.
const sponsorRows = (entries = [], { from = null, to = null } = {}) => {
  const rows = [];
  for (const e of entries || []) {
    const at = asDate(e?.receivedAt);
    const total = Number(e?.amount);
    if (!at || !Number.isFinite(total) || total <= 0) continue;
    if ((from && at < from) || (to && at >= to)) continue;
    rows.push({ at, base: round2(total / (1 + GST_RATE)), total: round2(total), label: 'Sponsored job', drive: null });
  }
  return rows;
};

const sumRows = (rows) => ({ count: rows.length, base: round2(rows.reduce((s, r) => s + r.base, 0)), total: round2(rows.reduce((s, r) => s + r.total, 0)) });

// Shaped like completed payments, for the money page. manual: true means there is no payment-gateway fee.
const asPayments = (rows) => rows.map((r) => ({ status: 'completed', amount: r.total, baseAmount: r.base, createdAt: r.at || new Date(0), manual: true }));

module.exports = { manualPaymentRows, sponsorRows, sumRows, asPayments };
