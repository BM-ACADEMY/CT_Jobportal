// Search-engine pages for the website when it is served from our own server (nginx) and not from Vercel.
//   GET /seo/job/<slug>-<id>   the normal single-page app, with the job's title, description, Open Graph tags and
//                              JobPosting data already in the HTML (what Google, WhatsApp and Facebook read)
//   GET /seo/sitemap.xml       static pages + every active job and company
// nginx sends /job/* and /sitemap.xml here (see docs/SEO_ON_OWN_SERVER.md). Same rules as client/api/job.js.
const fs = require('fs');

const SITE_URL = () => (process.env.SITE_URL || 'https://velaivaaipu.in').replace(/\/$/, '');
const API_DOMAIN = () => (process.env.API_PUBLIC_URL || 'https://api.velaivaaipu.in').replace(/\/api\/?$/, '').replace(/\/$/, '');
const OG_IMAGE = () => `${SITE_URL()}/og-default.png`;

const escapeHtml = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripHtml = (v) => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text);
// Same rule as client/src/utils/jobUrl.js
const slugify = (text) => String(text ?? '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60);
const jobIdFromSlug = (slug) => (String(slug || '').match(/([a-f0-9]{24})$/i) || [])[1] || '';
const jobSlug = (job) => {
  const parts = [slugify(job.title), slugify(job.location)].filter(Boolean).join('-');
  return `${parts ? `${parts}-` : ''}${job._id || job.id}`;
};
const jobUrl = (job) => `${SITE_URL()}/job/${jobSlug(job)}`;
const absolute = (url) => (!url ? '' : /^https?:/i.test(url) ? url : `${API_DOMAIN()}${url}`);

// The built single-page app (index.html). Read from CLIENT_INDEX_PATH when set, otherwise fetched from the site itself.
let shellCache = { html: '', at: 0 };
const SHELL_TTL_MS = 5 * 60 * 1000;
const getShell = async ({ fetchImpl = fetch, now = Date.now() } = {}) => {
  if (shellCache.html && now - shellCache.at < SHELL_TTL_MS) return shellCache.html;
  let html;
  if (process.env.CLIENT_INDEX_PATH) html = fs.readFileSync(process.env.CLIENT_INDEX_PATH, 'utf8');
  else {
    const res = await fetchImpl(`${SITE_URL()}/`, { headers: { 'x-seo-shell': '1' } });
    if (!res.ok) throw new Error(`shell ${res.status}`);
    html = await res.text();
  }
  shellCache = { html, at: now };
  return html;
};
const resetShellCache = () => { shellCache = { html: '', at: 0 }; };

const injectHead = (html, { title, description, canonical, robots = 'index, follow', image = OG_IMAGE(), type = 'website', jsonLd }) => {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const out = html
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
  if (jsonLd) tags.push(`<script type="application/ld+json" data-velaivaaipu-schema="true">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`);
  return out.replace(/<\/head>/i, `${tags.join('\n    ')}\n  </head>`);
};

/**
 * Pure: decides the response for one job URL.
 * @param {{slug:string, job:object|null, shell:string}} input  job = plain object from the database, or null when missing
 * @returns {{status:number, headers:object, body:string, tag:string}}
 */
const buildJobResponse = ({ slug, job, shell, now = new Date() }) => {
  const html = { 'Content-Type': 'text/html; charset=utf-8' };
  if (!job) {
    return { status: 200, tag: 'unavailable', headers: { ...html, 'Cache-Control': 'public, s-maxage=60' }, body: injectHead(shell, {
      title: 'Job not available | Velaivaaipu',
      description: 'This job is no longer available. Browse the latest jobs in Tamil Nadu on Velaivaaipu.',
      canonical: `${SITE_URL()}/jobs`, robots: 'noindex, follow',
    }) };
  }
  const company = job.company?.name || 'Velaivaaipu';
  const city = job.location || 'Tamil Nadu';
  const canonical = jobUrl(job);

  // One address per job: an old /job/<id> link or a changed title redirects (301) to the keyword URL.
  if (slug !== jobSlug(job)) return { status: 301, tag: 'redirect', headers: { Location: canonical, 'Cache-Control': 'public, s-maxage=300' }, body: '' };

  const expired = job.validThrough && new Date(job.validThrough) <= now;
  if (job.status !== 'active' || expired) {
    return { status: 200, tag: 'closed', headers: { ...html, 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' }, body: injectHead(shell, {
      title: `${job.title || 'This job'} — position filled | Velaivaaipu`,
      description: `This ${job.title || ''} opening at ${company} has been filled. Find similar jobs in ${city} on Velaivaaipu.`,
      canonical, robots: 'noindex, follow',
    }) };
  }

  const image = job.company?.logo ? absolute(job.company.logo) : OG_IMAGE();
  const image2 = /\.(png|jpe?g)$/i.test(image) ? image : OG_IMAGE(); // WhatsApp ignores webp/svg previews
  const description = clip(`${company} is hiring ${job.title} in ${city}. ${job.vacancies || 1} opening${job.vacancies === 1 ? '' : 's'}. Apply free on Velaivaaipu. ${stripHtml(job.description)}`, 155);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || `${company} is hiring ${job.title} in ${city}.`,
    identifier: { '@type': 'PropertyValue', name: 'Velaivaaipu', value: job.display_id || String(job._id) },
    datePosted: job.createdAt,
    validThrough: job.validThrough,
    employmentType: String(job.jobType || 'FULL_TIME').toUpperCase().replace(/[ -]/g, '_'),
    hiringOrganization: { '@type': 'Organization', name: company, ...(job.company?.website ? { sameAs: job.company.website } : {}), ...(job.company?.logo ? { logo: absolute(job.company.logo) } : {}) },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: city, addressRegion: 'Tamil Nadu', addressCountry: 'IN' } },
    directApply: true,
    ...(job.workMode === 'Remote' ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'IN' } } : {}),
    // Salary is entered per year (lakhs x 100000 in the post-job form)
    ...(!job.salary?.isRangeHidden && job.salary?.min ? { baseSalary: { '@type': 'MonetaryAmount', currency: job.salary.currency || 'INR', value: { '@type': 'QuantitativeValue', minValue: job.salary.min, maxValue: job.salary.max || job.salary.min, unitText: 'YEAR' } } } : {}),
  };
  const full = `${job.title} Job in ${city} – ${company} | Velaivaaipu`;
  return { status: 200, tag: 'job', headers: { ...html, 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' }, body: injectHead(shell, {
    title: clip(full.length <= 60 ? full : `${job.title} Job in ${city} | Velaivaaipu`, 70),
    description, canonical, image: image2, type: 'article', jsonLd,
  }) };
};

const STATIC_PAGES = [
  '/', '/jobs', '/companies', '/how-it-works', '/plans', '/contact', '/blog', '/for-colleges', '/privacy-policy', '/refund-policy', '/terms', '/job-post-templates',
  '/blog/it-jobs-in-pondicherry-for-freshers', '/blog/work-from-home-jobs-in-tamil-nadu', '/blog/private-jobs-in-pondicherry', '/blog/how-to-spot-fake-job-offer-tamil-nadu',
];
const urlEntry = (loc, lastmod, priority) =>
  `  <url><loc>${escapeHtml(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}${priority ? `<priority>${priority}</priority>` : ''}</url>`;
const buildSitemap = ({ jobs = [], companies = [] }) => {
  const entries = STATIC_PAGES.map((p) => urlEntry(`${SITE_URL()}${p === '/' ? '' : p}`, null, p === '/' ? '1.0' : '0.8'));
  jobs.forEach((j) => entries.push(urlEntry(jobUrl(j), j.updatedAt, '0.7')));
  companies.forEach((c) => entries.push(urlEntry(`${SITE_URL()}/companies/${c._id}`, c.updatedAt, '0.5')));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
};

module.exports = { buildJobResponse, buildSitemap, getShell, resetShellCache, injectHead, jobIdFromSlug, jobSlug, jobUrl, slugify, STATIC_PAGES };
