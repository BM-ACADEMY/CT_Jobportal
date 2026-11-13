// Walk-in Drives: cleaning input, codes, slugs, public shapes and the report file. No database here, so it is easy to test.
const crypto = require('crypto');
const { PLANS } = require('../config/driveConfig');

const str = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const HOUR = 3600000;
const istDayStart = (d = new Date()) => { const ist = new Date(d.getTime() + 5.5 * HOUR); return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - 5.5 * HOUR); };

const slugify = (title, rng = () => crypto.randomBytes(3).toString('hex')) => {
  const base = String(title || 'drive').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'drive';
  return `${base}-${rng()}`;
};

// Codes use letters and digits that cannot be mixed up on a phone screen (no 0, O, 1, I).
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = (rng = (n) => crypto.randomInt(0, n)) => Array.from({ length: 8 }, () => CODE_CHARS[rng(CODE_CHARS.length)]).join('');

// Indian mobile numbers: 10 digits starting 6-9, with or without +91 / 0.
const cleanPhone = (raw) => {
  const d = String(raw ?? '').replace(/\D/g, '');
  const ten = d.length === 12 && d.startsWith('91') ? d.slice(2) : d.length === 11 && d.startsWith('0') ? d.slice(1) : d;
  return /^[6-9]\d{9}$/.test(ten) ? ten : '';
};
const cleanEmail = (raw) => { const e = str(raw, 120).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : ''; };

// Validates what an organiser sends to create a drive. Returns { error } or { data }.
const cleanDriveInput = (body = {}, now = new Date()) => {
  const title = str(body.title, 120);
  if (title.length < 5) return { error: 'Please give the drive a title (at least 5 letters).' };

  const date = new Date(body.date);
  if (Number.isNaN(date.getTime())) return { error: 'Please choose the date of the drive.' };
  if (date < istDayStart(now)) return { error: 'The drive date cannot be in the past.' };
  if (date.getTime() - now.getTime() > 120 * 24 * HOUR) return { error: 'Please choose a date within the next 120 days.' };

  const roles = (Array.isArray(body.roles) ? body.roles : []).slice(0, 10).map((r) => ({
    title: str(r?.title, 80), vacancies: Math.min(10000, Math.max(1, Math.floor(Number(r?.vacancies)) || 1)), pay: str(r?.pay, 60),
  })).filter((r) => r.title);
  if (!roles.length) return { error: 'Add at least one role you are hiring for.' };

  const slots = (Array.isArray(body.slots) ? body.slots : []).slice(0, 12).map((s) => ({
    label: str(s?.label, 40), capacity: Math.min(1000, Math.max(1, Math.floor(Number(s?.capacity)) || 50)),
  })).filter((s) => s.label);
  if (new Set(slots.map((s) => s.label.toLowerCase())).size !== slots.length) return { error: 'Each time slot needs a different name.' };
  if (!slots.length) return { error: 'Add at least one time slot, for example 10:00 AM to 12:00 PM.' };

  const venue = { name: str(body.venue?.name, 120), address: str(body.venue?.address, 300), city: str(body.venue?.city, 60), mapUrl: str(body.venue?.mapUrl, 500) };
  if (!venue.address) return { error: 'Please enter the venue address.' };
  if (venue.mapUrl && !/^https?:\/\//i.test(venue.mapUrl)) venue.mapUrl = '';

  const plan = PLANS[body.plan] ? body.plan : 'free';
  const template = ['walk_in', 'campus', 'bulk'].includes(body.template) ? body.template : 'walk_in';
  const documents = (Array.isArray(body.documents) ? body.documents : []).slice(0, 10).map((d) => str(d, 80)).filter(Boolean);
  const screeningQuestions = (Array.isArray(body.screeningQuestions) ? body.screeningQuestions : []).slice(0, 10).map((q) => str(q, 200)).filter(Boolean);

  return { data: { title, template, description: str(body.description, 3000), roles, venue, date, slots, documents, screeningQuestions, plan } };
};

// What anyone may see about a drive. Never the organiser's account details.
const publicDrive = (d, { registered = 0, slotCounts = {}, limits } = {}) => ({
  slug: d.slug, title: d.title, template: d.template, description: d.description, organiserName: d.organiserName,
  roles: d.roles, venue: d.venue, date: d.date, documents: d.documents, screeningQuestions: d.screeningQuestions, status: d.status,
  slots: (d.slots || []).map((s) => ({ label: s.label, capacity: s.capacity, left: Math.max(0, s.capacity - (slotCounts[s.label] || 0)) })),
  registered, spotsLeft: limits ? Math.max(0, limits.maxRegistrations - registered) : undefined,
  sponsored: !!limits && limits.homeSpotDays > 0,
});

// WhatsApp-ready share text for the drive page.
const shareText = (d, url) => {
  const when = new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const roles = (d.roles || []).map((r) => r.title).slice(0, 3).join(', ');
  return `Walk-in drive: ${d.title}\nHiring: ${roles}\nDate: ${when}\nVenue: ${[d.venue?.name, d.venue?.city].filter(Boolean).join(', ')}\nRegister free in one minute: ${url}`;
};

const csvCell = (v) => { let s = String(v ?? ''); if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n');

const STATUS_WORDS = { registered: 'Registered', checked_in: 'Attended', shortlisted: 'Shortlisted', selected: 'Selected', on_hold: 'On hold', not_selected: 'Not selected' };

// Counts for the after-drive report. Attended = anyone checked in or moved on after check-in.
const summarise = (regs) => {
  const by = (s) => regs.filter((r) => r.status === s).length;
  const attended = regs.filter((r) => r.status !== 'registered').length;
  return { registered: regs.length, attended, noShow: regs.length - attended, shortlisted: by('shortlisted'), selected: by('selected'), onHold: by('on_hold'), notSelected: by('not_selected') };
};

module.exports = { str, istDayStart, slugify, makeCode, cleanPhone, cleanEmail, cleanDriveInput, publicDrive, shareText, toCsv, summarise, STATUS_WORDS };
