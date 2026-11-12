// Banner slots. One placement for now ('home-top'). Admin creates them; the Home page shows the active one.
// No pricing here. Pure functions so the rules are easy to test.
const PLACEMENTS = ['home-top'];

const clip = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

// An image is an https link or a file we already host (/uploads/...). Returns the cleaned value or ''.
const cleanImageUrl = (raw) => {
  const s = String(raw ?? '').trim();
  if (!s || s.length > 500) return '';
  if (/^\/uploads\/[\w\-./%]+$/.test(s) && !s.includes('..')) return s;
  try { const u = new URL(s); return u.protocol === 'https:' && !u.username && !u.password ? u.toString() : ''; } catch { return ''; }
};

// A link is https, or a path inside the site (/jobs, /plans). Never javascript: or protocol-relative.
const cleanLinkUrl = (raw) => {
  const s = String(raw ?? '').trim();
  if (!s || s.length > 500) return '';
  if (/^\/(?![/\\])[\w\-./?=&%#]*$/.test(s)) return s;
  try { const u = new URL(s); return u.protocol === 'https:' && !u.username && !u.password ? u.toString() : ''; } catch { return ''; }
};

const toDate = (v) => { const d = new Date(v); return v && !Number.isNaN(d.getTime()) ? d : null; };

// body: { imageUrl, linkUrl, startsAt, endsAt, placement?, altText?, active? } -> { data } or { error }
const cleanBanner = (body = {}) => {
  const imageUrl = cleanImageUrl(body.imageUrl);
  if (!imageUrl) return { error: 'Add a banner image (upload one, or an https link).' };
  const linkUrl = cleanLinkUrl(body.linkUrl);
  if (!linkUrl) return { error: 'Add a link (https, or a page of this site such as /jobs).' };
  const startsAt = toDate(body.startsAt); const endsAt = toDate(body.endsAt);
  if (!startsAt || !endsAt) return { error: 'Start and end dates are required.' };
  if (endsAt <= startsAt) return { error: 'The end date must be after the start date.' };
  const placement = body.placement === undefined || body.placement === '' ? 'home-top' : String(body.placement);
  if (!PLACEMENTS.includes(placement)) return { error: `Placement must be one of: ${PLACEMENTS.join(', ')}.` };
  return { data: { imageUrl, linkUrl, startsAt, endsAt, placement, altText: clip(body.altText, 150), active: body.active === undefined ? true : body.active === true } };
};

const isBannerActive = (b, now = new Date()) =>
  !!b && b.active !== false && new Date(b.startsAt) <= now && new Date(b.endsAt) >= now;

// Mongo filter for the one the public page may show.
const activeBannerFilter = (placement, now = new Date()) => ({ placement, active: { $ne: false }, startsAt: { $lte: now }, endsAt: { $gte: now } });

const publicBanner = (b) => (b ? { _id: b._id, imageUrl: b.imageUrl, linkUrl: b.linkUrl, altText: b.altText || '', placement: b.placement } : null);

module.exports = { PLACEMENTS, cleanImageUrl, cleanLinkUrl, cleanBanner, isBannerActive, activeBannerFilter, publicBanner };
