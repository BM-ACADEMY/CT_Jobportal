// Shared helpers for the SEO serverless functions (Vercel, ES modules). Files starting with "_" are not routes.
const SITE_URL = (process.env.SITE_URL || 'https://velaivaaipu.in').replace(/\/$/, '');
const API_URL = (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const API_DOMAIN = (process.env.VITE_API_DOMAIN || API_URL.replace(/\/api$/, '')).replace(/\/$/, '');
const OG_IMAGE = `${SITE_URL}/og-default.png`;

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stripHtml = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text);

const slugify = (text) => String(text ?? '')
  .toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60);

const OBJECT_ID = /([a-f0-9]{24})$/i;
const jobIdFromSlug = (slug) => (String(slug || '').match(OBJECT_ID) || [])[1] || '';
const jobUrl = (job) => {
  const parts = [slugify(job.title), slugify(job.location)].filter(Boolean).join('-');
  return `${SITE_URL}/job/${parts ? `${parts}-` : ''}${job._id || job.id}`;
};

const absolute = (url) => (!url ? '' : /^https?:/i.test(url) ? url : `${API_DOMAIN}${url}`);

const getJson = async (path) => {
  const response = await fetch(`${API_URL}${path}`, { headers: { Accept: 'application/json' } });
  return { status: response.status, data: response.ok ? await response.json() : null };
};

// The built single-page app shell, fetched from this same deployment's home page.
const getShell = async (req) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const response = await fetch(`https://${host}/`, { headers: { 'x-seo-shell': '1' } });
  return response.text();
};

// Replaces / adds head tags in the SPA shell so crawlers and link previews see them without running JS.
const injectHead = (html, { title, description, canonical, robots = 'index, follow', image = OG_IMAGE, type = 'website', jsonLd }) => {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`)
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/i, '')
    .replace(/<meta\s+name="robots"[^>]*>\s*/i, '')
    .replace(/<meta\s+property="og:[^>]*>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[^>]*>\s*/gi, '');
  const tags = [
    `<meta name="description" content="${d}" />`,
    `<meta name="robots" content="${escapeHtml(robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:site_name" content="Velaivaaipu" />`,
    `<meta property="og:type" content="${escapeHtml(type)}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ];
  if (jsonLd) {
    const json = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
    tags.push(`<script type="application/ld+json" data-velaivaaipu-schema="true">${json}</script>`);
  }
  return out.replace(/<\/head>/i, `${tags.join('\n    ')}\n  </head>`);
};

export { SITE_URL, API_URL, OG_IMAGE, escapeHtml, stripHtml, clip, slugify, jobIdFromSlug, jobUrl, absolute, getJson, getShell, injectHead };
