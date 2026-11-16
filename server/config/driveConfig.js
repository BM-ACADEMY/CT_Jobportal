// Walk-in Drives: plans, add-ons and the rules around them. Pure and easy to test.
// Prices are per drive, in rupees, before GST. Plan prices are locked (9 Nov 2026). Add-on prices are PROPOSED and can be
// changed here in one place. Payment is confirmed by an admin ("mark paid"); nothing here touches Razorpay.
const GST_RATE = 0.18;
const FREE_DRIVES_PER_MONTH = 1;

const PLANS = {
  free: { key: 'free', label: 'Free', price: 0, maxRegistrations: 50, screeningMax: 0, inviteLimit: 0, homeSpotDays: 0, qrCheckIn: false, reminders: ['email'], fullReport: false, costPerHire: false },
  plus: { key: 'plus', label: 'Drive Plus', price: 999, maxRegistrations: 300, screeningMax: 3, inviteLimit: 100, homeSpotDays: 3, qrCheckIn: true, reminders: ['email', 'whatsapp'], fullReport: true, costPerHire: false },
  pro: { key: 'pro', label: 'Drive Pro', price: 2999, maxRegistrations: 1000, screeningMax: 10, inviteLimit: 500, homeSpotDays: 7, qrCheckIn: true, reminders: ['email', 'whatsapp'], fullReport: true, costPerHire: true },
};

// Extras any plan can add to one drive. `adds` is merged into that drive's limits once paid.
const ADDONS = {
  extra_registrations: { key: 'extra_registrations', label: '100 more registrations', price: 199, unit: 100, adds: { maxRegistrations: 100 } },
  extra_invites: { key: 'extra_invites', label: '100 more invites to matching job seekers', price: 199, unit: 100, adds: { inviteLimit: 100 } },
  screening_pack: { key: 'screening_pack', label: 'Screening questions (up to 3)', price: 99, unit: 1, adds: { screeningMax: 3 } },
  home_spot: { key: 'home_spot', label: 'Home page spot for 3 days (labelled Sponsored)', price: 499, unit: 1, adds: { homeSpotDays: 3 } },
  full_report: { key: 'full_report', label: 'Full after-drive report', price: 99, unit: 1, adds: { fullReport: true } },
  whatsapp_reminders: { key: 'whatsapp_reminders', label: 'WhatsApp reminders', price: 149, unit: 1, adds: { whatsapp: true } },
  team_check: { key: 'team_check', label: 'Our team checks the drive a day before', price: 499, unit: 1, adds: { teamCheck: true } },
};

const round2 = (n) => Math.round(n * 100) / 100;
const priceWithGst = (base) => { const gst = round2(base * GST_RATE); return { base, gst, total: round2(base + gst) }; };

// Limits for one drive: its plan plus every PAID add-on (an unpaid add-on adds nothing).
const effectiveLimits = (drive) => {
  const plan = PLANS[drive?.plan] || PLANS.free;
  const limits = {
    maxRegistrations: plan.maxRegistrations, screeningMax: plan.screeningMax, inviteLimit: plan.inviteLimit,
    homeSpotDays: plan.homeSpotDays, fullReport: plan.fullReport, costPerHire: plan.costPerHire,
    whatsapp: plan.reminders.includes('whatsapp'), teamCheck: false,
  };
  for (const a of drive?.addons || []) {
    const def = ADDONS[a.key];
    if (!def || !a.paid) continue;
    const qty = Math.max(1, Number(a.qty) || 1);
    for (const [k, v] of Object.entries(def.adds)) {
      limits[k] = typeof v === 'number' ? (limits[k] || 0) + v * qty : v;
    }
  }
  return limits;
};

// What the organiser owes for one drive: the plan plus every add-on, with GST. `paidOnly` is what has been paid so far.
const quote = (drive) => {
  const plan = PLANS[drive?.plan] || PLANS.free;
  const lines = [{ key: plan.key, label: plan.label, qty: 1, base: plan.price, paid: plan.price === 0 || !!drive?.paid }];
  for (const a of drive?.addons || []) {
    const def = ADDONS[a.key];
    if (!def) continue;
    const qty = Math.max(1, Number(a.qty) || 1);
    lines.push({ key: def.key, label: def.label, qty, base: def.price * qty, paid: !!a.paid });
  }
  const base = lines.reduce((s, l) => s + l.base, 0);
  const paidBase = lines.filter((l) => l.paid).reduce((s, l) => s + l.base, 0);
  return { lines, ...priceWithGst(base), paidBase, due: priceWithGst(base - paidBase) };
};

// Start of the India-time month for a date, as a Date (UTC instant).
const istMonthStart = (d = new Date()) => {
  const ist = new Date(d.getTime() + 5.5 * 3600 * 1000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - 5.5 * 3600 * 1000);
};

// Rough cost per hire for Pro: what has been paid divided by the people selected. null when nobody is selected.
const costPerHire = (drive, selected) => {
  if (!selected) return null;
  const q = quote(drive);
  return round2(q.paidBase / selected);
};

module.exports = { GST_RATE, FREE_DRIVES_PER_MONTH, PLANS, ADDONS, priceWithGst, effectiveLimits, quote, istMonthStart, costPerHire };
