// Mounted at /seo. nginx rewrites /job/* and /sitemap.xml to these (docs/SEO_ON_OWN_SERVER.md).
const express = require('express');
const Job = require('../models/Job');
const Company = require('../models/Company');
const BlogPost = require('../models/BlogPost');
const { buildJobResponse, buildSitemap, getShell, jobIdFromSlug } = require('../utils/seoPages');

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
    const job = await Job.findById(id).populate('company', 'name logo website').lean();
    return send(res, buildJobResponse({ slug: req.params.slug, job, shell }));
  } catch (err) {
    console.error('[SEO] job page failed, serving the plain app:', err.message);
    if (!shell) return res.status(502).send('Temporarily unavailable');
    res.set('X-Velaivaaipu-SEO', 'shell-error').set('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(shell);
  }
});

router.get('/sitemap.xml', async (req, res) => {
  try {
    const now = new Date();
    const [jobs, companies, posts] = await Promise.all([
      Job.find({ status: 'active', $or: [{ validThrough: { $gte: now } }, { validThrough: null }] }).select('title location updatedAt').sort({ updatedAt: -1 }).limit(5000).lean(),
      Company.find({}).select('updatedAt').sort({ updatedAt: -1 }).limit(2000).lean(),
      BlogPost.find({ status: 'published', publishedAt: { $lte: now } }).select('slug updatedAt').sort({ publishedAt: -1 }).limit(1000).lean().catch(() => []),
    ]);
    res.set('Content-Type', 'application/xml; charset=utf-8').set('Cache-Control', 'public, s-maxage=900');
    return res.send(buildSitemap({ jobs, companies, posts }));
  } catch (err) {
    console.error('[SEO] sitemap failed, serving the static pages:', err.message);
    res.set('Content-Type', 'application/xml; charset=utf-8');
    return res.send(buildSitemap({}));
  }
});

module.exports = router;
