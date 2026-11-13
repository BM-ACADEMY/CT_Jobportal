// Checks and cleans a blog post sent from the admin editor. Pure, so it can be tested.
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const slugify = (text) => String(text ?? '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/, '');
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const readMinutesFor = (body) => Math.max(1, Math.ceil(String(body || '').trim().split(/\s+/).filter(Boolean).length / 200));

// Covers must come from our own upload folder or an https link.
const okImage = (v) => v === '' || /^\/uploads\/blog\/[\w.-]+\.(webp|png|jpe?g)$/i.test(v) || /^https:\/\/[^\s"'<>]+$/i.test(v);

// Returns { error } or { fields }. `reserved` = slugs the older posts already use.
const cleanPost = (input = {}, { reserved = [] } = {}) => {
  const title = str(input.title, 120);
  if (title.length < 5) return { error: 'Give the post a title (at least 5 characters).' };

  const slug = str(input.slug, 80).toLowerCase() || slugify(title) || '';
  if (!slug || !SLUG_RE.test(slug)) return { error: 'The web address (slug) can only have small letters, numbers and dashes. Type one, for example "walk-in-drive-tips".' };
  if (reserved.includes(slug)) return { error: 'An older post already uses that web address. Pick another.' };

  const body = typeof input.body === 'string' ? input.body.replace(/\r\n/g, '\n').slice(0, 50000) : '';
  const status = input.status === 'published' ? 'published' : 'draft';
  if (status === 'published' && body.trim().length < 200) return { error: 'Write at least a few paragraphs (200 characters) before publishing.' };

  const coverImage = str(input.coverImage, 500);
  if (!okImage(coverImage)) return { error: 'The cover picture must be uploaded here or be an https link.' };

  const tags = (Array.isArray(input.tags) ? input.tags : String(input.tags || '').split(','))
    .map((t) => str(t, 30)).filter(Boolean).slice(0, 8);

  return { fields: {
    slug, title, body, status, coverImage, tags,
    excerpt: str(input.excerpt, 300),
    coverAlt: str(input.coverAlt, 160),
    category: str(input.category, 40) || 'Career advice',
    authorName: str(input.authorName, 60) || 'Velai Vaaipu',
    seoTitle: str(input.seoTitle, 70),
    seoDescription: str(input.seoDescription, 170),
    readMinutes: readMinutesFor(body)
  } };
};

module.exports = { slugify, cleanPost, readMinutesFor, okImage, SLUG_RE };
