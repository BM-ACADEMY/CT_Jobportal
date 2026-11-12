// Mounted at /seo. nginx rewrites /job/* and /sitemap.xml to these (docs/SEO_ON_OWN_SERVER.md).
const express = require('express');
const Job = require('../models/Job');
const Company = require('../models/Company');
const BlogPost = require('../models/BlogPost');
const { publicJobConditions, publicCompanyConditions, hideUnverified } = require('../utils/publicVisibility');
const { CITY_PAGES, buildPageResponse, normalizePath, cityMinJobs, buildJobResponse, buildSitemap, getShell, jobIdFromSlug } = require('../utils/seoPages');

const router = express.Router();
const send = (res, out, tag) => {
  res.set('X-Velaivaaipu-SEO', tag || out.tag);
  Object.entries(out.headers).forEach(([k, v]) => res.set(k, v));
  return res.status(out.status).send(out.body);
};

router.get('/job/:slug', async (req, res) => {
  let shell = '';
  try {
    shell = await getShell();
    const id = jobIdFromSlug(req.params.slug);
    if (!id) return send(res, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=60' }, body: shell }, 'shell-no-id');
    const job = await Job.findById(id).populate('company', 'name logo website is_verified hiddenFromPublic').lean();
    return send(res, buildJobResponse({ slug: req.params.slug, job, shell }));
  } catch (err) {
    console.error('[SEO] job page failed, serving the plain app:', err.message);
    if (!shell) return res.status(502).send('Temporarily unavailable');
    res.set('X-Velaivaaipu-SEO', 'shell-error').set('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(shell);
  }
});

// How many public jobs a city page would show (same rules as the public list). Cached for a few minutes.
let cityCache = { at: 0, counts: null };
const cityCounts = async () => {
  if (cityCache.counts && Date.now() - cityCache.at < 300000) return cityCache.counts;
  const strict = hideUnverified();
  const companyDocs = await Company.find(strict ? publicCompanyConditions() : { hiddenFromPublic: true }).select('_id').lean();
  const ids = companyDocs.map((c) => c._id);
  const now = new Date();
  const counts = {};
  for (const [path, { match }] of Object.entries(CITY_PAGES)) {
    counts[path] = await Job.countDocuments({ status: 'active', location: match, $and: [{ $or: [{ validThrough: { $gte: now } }, { validThrough: null }] }, ...publicJobConditions(strict ? { verifiedCompanyIds: ids } : { hiddenCompanyIds: ids })] });
  }
  cityCache = { at: Date.now(), counts };
  return counts;
};

// nginx sends the main public pages here: GET /seo/page/for-colleges, /seo/page/jobs/chennai, /seo/page (home)
router.get(['/page', '/page/*splat'], async (req, res) => {
  let shell = '';
  try {
    shell = await getShell();
    const path = normalizePath(`/${[].concat(req.params.splat || []).join('/')}`);
    let openJobs = null;
    if (CITY_PAGES[path]) { try { openJobs = (await cityCounts())[path]; } catch (e) { console.error('[SEO] city count failed:', e.message); } }
    return send(res, buildPageResponse({ path, shell, openJobs }));
  } catch (err) {
    console.error('[SEO] page failed, serving the plain app:', err.message);
    if (!shell) return res.status(502).send('Temporarily unavailable');
    res.set('X-Velaivaaipu-SEO', 'shell-error').set('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(shell);
  }
});

router.get('/sitemap.xml', async (req, res) => {
  try {
    const now = new Date();
    // Same rules as the public lists: verified companies, jobs under 45 days (or renewed), nothing admin-hidden.
    const strict = hideUnverified();
    const companyDocs = await Company.find(strict ? publicCompanyConditions() : { hiddenFromPublic: true }).select('_id updatedAt').sort({ updatedAt: -1 }).limit(2000).lean();
    const ids = companyDocs.map((c) => c._id);
    const companyList = strict ? companyDocs : [];
    const fairs = await require('../models/JobFair').find({ status: 'published' }).select('slug updatedAt').sort({ date: -1 }).limit(200).lean().catch(() => []);
    const [jobs, companies, posts] = await Promise.all([
      Job.find({ status: 'active', $and: [{ $or: [{ validThrough: { $gte: now } }, { validThrough: null }] }, ...publicJobConditions(strict ? { verifiedCompanyIds: ids } : { hiddenCompanyIds: ids })] }).select('title location updatedAt').sort({ updatedAt: -1 }).limit(5000).lean(),
      strict ? companyList : Company.find(publicCompanyConditions()).select('updatedAt').sort({ updatedAt: -1 }).limit(2000).lean(),
      BlogPost.find({ status: 'published', publishedAt: { $lte: now } }).select('slug updatedAt').sort({ publishedAt: -1 }).limit(1000).lean().catch(() => []),
    ]);
    res.set('Content-Type', 'application/xml; charset=utf-8').set('Cache-Control', 'public, s-maxage=900');
    let skipPaths = [];
    try { const c = await cityCounts(); skipPaths = Object.keys(c).filter((p) => c[p] < cityMinJobs()); } catch { /* keep all city pages if counting fails */ }
    return res.send(buildSitemap({ jobs, companies, posts, fairs, skipPaths }));
  } catch (err) {
    console.error('[SEO] sitemap failed, serving the static pages:', err.message);
    res.set('Content-Type', 'application/xml; charset=utf-8');
    return res.send(buildSitemap({}));
  }
});

module.exports = router;
