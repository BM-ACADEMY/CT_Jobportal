// Search-engine pages for the website when it is served from our own server (nginx) and not from Vercel.
//   GET /seo/job/<slug>-<id>   the normal single-page app, with the job's title, description, Open Graph tags and
//                              JobPosting data already in the HTML (what Google, WhatsApp and Facebook read)
//   GET /seo/sitemap.xml       static pages + every active job and company
// nginx sends /job/* and /sitemap.xml here (see docs/SEO_ON_OWN_SERVER.md). Same rules as client/api/job.js.
const fs = require('fs');
const { JOB_CATEGORIES } = require('../config/jobCategories');

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
  const { jobIsPublic } = require('./publicVisibility');
  const html = { 'Content-Type': 'text/html; charset=utf-8' };
  if (!job) {
    return { status: 200, tag: 'unavailable', headers: { ...html, 'Cache-Control': 'public, s-maxage=60' }, body: injectHead(shell, {
      title: 'Job not available | Velaivaaipu',
      description: 'This job is no longer available. Browse the latest jobs in Tamil Nadu on Velaivaaipu.',
      canonical: `${SITE_URL()}/jobs`, robots: 'noindex, follow',
    }) };
  }
  const company = job.externalApply?.employerName || job.company?.name || 'Velaivaaipu';
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
  const description = clip(`${company} is hiring ${job.title} in ${city}. ${job.vacancies || 1} opening${job.vacancies === 1 ? '' : 's'}. ${job.externalApply?.url ? 'Apply on the employer site.' : 'Apply free on Velaivaaipu.'} ${stripHtml(job.description)}`, 155);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || `${company} is hiring ${job.title} in ${city}.`,
    identifier: { '@type': 'PropertyValue', name: 'Velaivaaipu', value: job.display_id || String(job._id) },
    datePosted: job.createdAt,
    validThrough: job.validThrough,
    employmentType: String(job.jobType || 'FULL_TIME').toUpperCase().replace(/[ -]/g, '_'),
    hiringOrganization: { '@type': 'Organization', name: company, ...(!job.externalApply?.url && job.company?.website ? { sameAs: job.company.website } : {}), ...(!job.externalApply?.url && job.company?.logo ? { logo: absolute(job.company.logo) } : {}) },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: city, addressRegion: 'Tamil Nadu', addressCountry: 'IN' } },
    directApply: !job.externalApply?.url,
    ...(job.workMode === 'Remote' ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'IN' } } : {}),
    // Salary is entered per year (lakhs x 100000 in the post-job form)
    ...(!job.salary?.isRangeHidden && job.salary?.min ? { baseSalary: { '@type': 'MonetaryAmount', currency: job.salary.currency || 'INR', value: { '@type': 'QuantitativeValue', minValue: job.salary.min, maxValue: job.salary.max || job.salary.min, unitText: 'YEAR' } } } : {}),
  };
  const full = company === 'Velaivaaipu' ? `${job.title} Job in ${city} | Velaivaaipu` : `${job.title} Job in ${city} – ${company} | Velaivaaipu`;
  // A job the public list hides (unverified company, older than 45 days, admin-hidden): the link still works, search engines skip it.
  if (!jobIsPublic(job, now.getTime())) {
    return { status: 200, tag: 'hidden', headers: { ...html, 'Cache-Control': 'public, s-maxage=300' }, body: injectHead(shell, {
      title: clip(full.length <= 60 ? full : `${job.title} Job in ${city} | Velaivaaipu`, 70), description, canonical, robots: 'noindex, follow',
    }) };
  }
  return { status: 200, tag: 'job', headers: { ...html, 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' }, body: injectHead(shell, {
    title: clip(full.length <= 60 ? full : `${job.title} Job in ${city} | Velaivaaipu`, 70),
    description, canonical, image: image2, type: 'article', jsonLd,
  }) };
};

// Tags for the main public pages. The app sets these only after JavaScript runs; search engines and WhatsApp
// read this raw HTML first, so each page must say what it is (and not claim to be the homepage).
const CITY_PAGES = {
  '/jobs/pondicherry': { city: 'Pondicherry', match: /pondicherry|puducherry|pondy|kosapalayam|lawspet|villianur|ariyankuppam|kottakuppam/i },
  '/jobs/chennai': { city: 'Chennai', match: /chennai/i },
  '/jobs/villupuram': { city: 'Villupuram', match: /villupuram|viluppuram|tindivanam|tindivanam/i },
  '/jobs/cuddalore': { city: 'Cuddalore', match: /cuddalore|neyveli|chidambaram|panruti/i },
};
const PAGE_TAGS = {
  '/': ['Jobs in Tamil Nadu & Pondicherry – Apply Free | Velaivaaipu', 'Find the latest job vacancies in Tamil Nadu and Pondicherry. Take a free AI skill test, get resume feedback and apply to jobs for free.'],
  '/jobs': ['Latest Jobs in Tamil Nadu & Pondicherry – Apply Free | Velaivaaipu', 'Browse current private job openings in Tamil Nadu and Pondicherry by city, role and experience. Apply free on Velaivaaipu.'],
  '/internships': ['Internships in Tamil Nadu, Free to Apply | Velaivaaipu', 'Paid and unpaid internships in Tamil Nadu and Pondicherry for students and freshers. Apply free on Velaivaaipu.'],
  '/drives': ['Walk-in Drives and Campus Drives in Tamil Nadu | Velaivaaipu', 'See upcoming walk-in interviews and campus placement drives in Tamil Nadu and Pondicherry, with date, venue and how to register.'],
  '/companies': ['Companies Hiring in Tamil Nadu & Pondicherry | Velaivaaipu', 'Browse companies hiring in Tamil Nadu and Pondicherry. See company profiles and open vacancies, and apply directly for free.'],
  '/how-it-works': ['How It Works – Find Jobs or Hire in Tamil Nadu | Velaivaaipu', 'Learn how job seekers apply free, employers find candidates and colleges run campus drives on Velaivaaipu.'],
  '/plans': ['Plans and Pricing for Job Seekers, Companies and Colleges | Velaivaaipu', 'Start free. See what each Velaivaaipu plan includes for students, job seekers, recruiters, companies and colleges. Prices in rupees, GST shown before you pay.'],
  '/contact': ['Contact Us – Job Search & Hiring Support | Velaivaaipu', 'Need help with your job search, account or hiring on Velaivaaipu? Reach our support team by WhatsApp or email.'],
  '/blog': ['Job Search Tips & Career Guides for Tamil Nadu | Velaivaaipu', 'Practical guides on fresher jobs, private jobs, walk-in interviews and resumes for Tamil Nadu and Pondicherry.'],
  '/for-colleges': ['Campus Placement Software for Colleges in TN | Velaivaaipu', 'Run campus drives, track students and share placement reports with your principal. Students join by QR code with just a WhatsApp number. Start free.'],
  '/for-companies': ['Hire in Tamil Nadu & Pondicherry – Post Jobs Free | Velaivaaipu', 'Post jobs free, reach local candidates and manage applications in one place. Companies are checked before their jobs go public.'],
  '/for-recruiters': ['Recruiter Tools for Hiring in Tamil Nadu | Velaivaaipu', 'Find and shortlist candidates in Tamil Nadu and Pondicherry, run walk-ins and track applications on Velaivaaipu.'],
  '/free-assessment': ['Free Online Skill Test for Job Seekers | Velaivaaipu', 'Take a free online skill test, see your score and find out which jobs in Tamil Nadu and Pondicherry suit your skills.'],
  '/job-post-templates': ['Free Job Post Templates for Employers | Velaivaaipu', 'Ready-to-use job post templates for common roles. Copy, edit and post your opening on Velaivaaipu for free.'],
  '/terms': ['Terms and Conditions | Velaivaaipu', 'The terms for using Velaivaaipu as a job seeker, employer or college, including accounts, payments and refunds.'],
  '/privacy-policy': ['Privacy Policy | Velaivaaipu', 'How Velaivaaipu collects, uses and protects your data.'],
  '/refund-policy': ['Refund Policy | Velaivaaipu', 'When and how refunds work for Velaivaaipu plans and services.'],
};
Object.entries(CITY_PAGES).forEach(([path, { city }]) => {
  PAGE_TAGS[path] = [`Jobs in ${city} – Fresher & Walk-in Jobs | Velaivaaipu`, `Current job openings in ${city}, including fresher jobs and walk-in interviews. Apply free on Velaivaaipu.`];
});

const ORG_JSON_LD = () => ({
  '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE_URL()}/#organization`,
  name: 'Velaivaaipu', alternateName: ['வேலைவாய்ப்பு', 'Velai Vaaippu'], url: SITE_URL(), logo: `${SITE_URL()}/velaivaaipu-logo.png`,
  description: 'A private job portal for Tamil Nadu and Puducherry. Not a government website.',
  areaServed: [{ '@type': 'State', name: 'Tamil Nadu' }, { '@type': 'State', name: 'Puducherry' }],
});

const normalizePath = (p) => {
  const clean = String(p || '/').split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase();
  return clean || '/';
};
// openJobs: how many public jobs the city page would list (null = unknown). City pages below the minimum are noindex.
const cityMinJobs = () => { const n = parseInt(process.env.CITY_PAGE_MIN_JOBS, 10); return Number.isFinite(n) && n >= 0 ? n : 10; };
const buildPageResponse = ({ path, shell, openJobs = null }) => {
  const key = normalizePath(path);
  const tags = PAGE_TAGS[key];
  const html = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' };
  if (!tags) return { status: 200, tag: 'shell-unknown-page', headers: html, body: shell };
  const thin = CITY_PAGES[key] && openJobs !== null && openJobs < cityMinJobs();
  return { status: 200, tag: thin ? 'page-thin' : 'page', headers: html, body: injectHead(shell, {
    title: tags[0], description: tags[1], canonical: `${SITE_URL()}${key === "/" ? "/" : key}`,
    robots: thin ? 'noindex, follow' : 'index, follow', ...(key === '/' ? { jsonLd: ORG_JSON_LD() } : {}),
  }) };
};

// Blog posts come from the same data file the site renders, so new posts are listed automatically.
// If the client source is not on this machine, the fixed list below is used.
const FALLBACK_BLOGS = ['it-jobs-in-pondicherry-for-freshers', 'work-from-home-jobs-in-tamil-nadu', 'private-jobs-in-pondicherry', 'how-to-spot-fake-job-offer-tamil-nadu'];
const blogSlugs = () => {
  try {
    const file = process.env.BLOG_DATA_PATH || require('path').join(__dirname, '../../client/src/data/importedBlogs.js');
    const slugs = [...fs.readFileSync(file, 'utf8').matchAll(/"slug":\s*"([^"]+)"/g)].map((m) => m[1]);
    return slugs.length ? [...new Set(slugs)] : FALLBACK_BLOGS;
  } catch { return FALLBACK_BLOGS; }
};
const STATIC_PAGES = [
  '/', '/jobs', '/internships', '/drives', '/job-fairs', '/companies', '/how-it-works', '/plans', '/contact', '/blog', '/for-colleges', '/for-companies', '/for-recruiters', '/free-assessment', '/privacy-policy', '/refund-policy', '/terms', '/job-post-templates',
  '/jobs/pondicherry', '/jobs/chennai', '/jobs/villupuram', '/jobs/cuddalore',
  ...JOB_CATEGORIES.map((c) => `/jobs/category/${c.key}`), // field-of-work pages (client route /jobs/category/:slug)
];
const urlEntry = (loc, lastmod, priority) =>
  `  <url><loc>${escapeHtml(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}${priority ? `<priority>${priority}</priority>` : ''}</url>`;
const buildSitemap = ({ jobs = [], companies = [], posts = [], fairs = [], builtAt = null, skipPaths = [] }) => {
  // Static pages carry the newest job/post date so crawlers see a real lastmod; no date when there is nothing to base it on.
  const newest = [...jobs, ...posts].map((x) => new Date(x.updatedAt || 0).getTime()).filter(Boolean).sort((a, b) => b - a)[0] || builtAt;
  const entries = [...STATIC_PAGES.filter((p) => !skipPaths.includes(p)), ...blogSlugs().map((s) => `/blog/${s}`)].map((p) => urlEntry(`${SITE_URL()}${p === '/' ? '' : p}`, ['/jobs', '/', '/internships'].includes(p) || p.startsWith('/jobs/') ? newest : null, p === '/' ? '1.0' : '0.8'));
  posts.forEach((p) => entries.push(urlEntry(`${SITE_URL()}/blog/${p.slug}`, p.updatedAt, '0.8')));
  fairs.forEach((f) => f?.slug && entries.push(urlEntry(`${SITE_URL()}/job-fairs/${f.slug}`, f.updatedAt, '0.6')));
  jobs.forEach((j) => entries.push(urlEntry(jobUrl(j), j.updatedAt, '0.7')));
  companies.forEach((c) => entries.push(urlEntry(`${SITE_URL()}/companies/${c._id}`, c.updatedAt, '0.5')));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
};

module.exports = { CITY_PAGES, PAGE_TAGS, buildPageResponse, normalizePath, cityMinJobs, blogSlugs, buildJobResponse, buildSitemap, getShell, resetShellCache, injectHead, jobIdFromSlug, jobSlug, jobUrl, slugify, STATIC_PAGES };
