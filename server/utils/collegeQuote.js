// The numbers and words on a college's price quote. The PDF only draws what this returns.
const { priceWithGst } = require('../config/driveConfig');

const dateText = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
const ymd = (d) => new Date(d.getTime() + 5.5 * 3600000).toISOString().slice(0, 10).replace(/-/g, '');

const featureLines = (plan) => (plan.features || [])
  .filter((f) => f.isActive && f.value !== false && f.name !== 'Student Capacity')
  .map((f) => (f.value === true || f.value === undefined || f.value === null ? f.name : `${f.name}: ${f.value}`));

const capacityText = (plan) => {
  const f = (plan.features || []).find((x) => x.name === 'Student Capacity' && x.isActive);
  if (!f) return '';
  return typeof f.value === 'number' && f.value > 0 ? `${f.value.toLocaleString('en-IN')} students` : 'Unlimited students';
};

const buildQuote = ({ college, plan, env = process.env, now = new Date() }) => {
  const money = priceWithGst(Number(plan.price) || 0);
  const bank = String(env.QUOTE_BANK_DETAILS || '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 8);
  return {
    number: `Q-${String(college.display_id || String(college._id).slice(-6)).toUpperCase()}-${ymd(now)}`,
    date: dateText(now),
    validUntil: dateText(new Date(now.getTime() + 30 * 86400000)),
    issuer: String(env.QUOTE_ISSUER_NAME || 'Velaivaaipu').slice(0, 120),
    issuerLine: String(env.QUOTE_ISSUER_LINE || '').slice(0, 200),
    to: { name: college.name || '', principal: college.principalName || '', location: college.location || '' },
    plan: { name: plan.name, duration: plan.duration || 'Yearly', capacity: capacityText(plan), seats: plan.userSeats || 0, features: featureLines(plan) },
    base: money.base, gst: money.gst, total: money.total,
    bank,
  };
};

module.exports = { buildQuote, featureLines, capacityText };
