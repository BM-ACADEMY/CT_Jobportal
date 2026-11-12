// Stall requests and check-in for our own fairs: cleaning input and shaping the check-in screen. No database here.
const phoneRule = require('./phoneRule');
const { istDayStart } = require('./driveRules');

const str = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A stall can only be asked for on a published, upcoming fair of ours.
const stallsOpen = (fair, now = new Date()) => !!fair && fair.kind === 'own' && fair.status === 'published' && new Date(fair.endDate || fair.date) >= istDayStart(now);

const cleanStallInput = (b = {}) => {
  const name = str(b.name, 140);
  if (name.length < 2) return { error: 'Enter your company name.' };
  const contactName = str(b.contactName, 100);
  if (!contactName) return { error: 'Enter a contact person.' };
  const phone = phoneRule.clean(b.phone);
  if (!phone) return { error: 'Enter a valid mobile number.' };
  const email = str(b.email, 120);
  if (email && !EMAIL.test(email)) return { error: 'That email does not look right.' };
  const need = str(b.need, 500);
  if (!need) return { error: 'Tell us what you need (for example one table and how many roles you are hiring for).' };
  return { data: { name, contactName, phone, email, need } };
};

// Price shown to companies: only when the owner has set one in Settings. Never a default.
const stallPriceLabel = (price) => {
  if (price === null || price === undefined || price === '') return null;
  const n = Number(price);
  return Number.isFinite(n) && n >= 0 ? `Rs ${n.toLocaleString('en-IN')}` : null;
};

// Search box on the check-in screen: a phone (digits) or part of a name.
const parseSearch = (q) => {
  const s = str(q, 60);
  const digits = s.replace(/\D/g, '');
  if (digits.length >= 4 && digits.length >= s.replace(/\s/g, '').length - 1) return { phoneDigits: digits.slice(-10) };
  return s.length >= 2 ? { name: s } : {};
};
const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { stallsOpen, cleanStallInput, stallPriceLabel, parseSearch, escRe };
