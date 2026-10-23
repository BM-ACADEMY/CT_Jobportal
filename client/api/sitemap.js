// GET /sitemap.xml  — static pages + every active job and company, refreshed every few minutes.
import * as lib from './_lib.js';

const STATIC_PAGES = [
  '/', '/jobs', '/companies', '/how-it-works', '/contact', '/blog', '/for-colleges', '/privacy-policy', '/refund-policy', '/terms', '/job-post-templates',
  '/blog/it-jobs-in-pondicherry-for-freshers',
  '/blog/work-from-home-jobs-in-tamil-nadu',
  '/blog/private-jobs-in-pondicherry',
];

const urlEntry = (loc, lastmod, priority) =>
  `  <url><loc>${lib.escapeHtml(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}${priority ? `<priority>${priority}</priority>` : ''}</url>`;

export default async function handler(req, res) {
  const entries = STATIC_PAGES.map((p) => urlEntry(`${lib.SITE_URL}${p === '/' ? '' : p}`, null, p === '/' ? '1.0' : '0.8'));
  try {
    if (lib.API_URL) {
      const { data } = await lib.getJson('/public/sitemap-feed');
      (data?.jobs || []).forEach((j) => entries.push(urlEntry(lib.jobUrl(j), j.updatedAt, '0.7')));
      (data?.companies || []).forEach((c) => entries.push(urlEntry(`${lib.SITE_URL}/companies/${c.id}`, c.updatedAt, '0.5')));
    }
  } catch { /* serve the static pages if the API is down */ }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);
}
