// GET /job/<slug>-<id>  (rewritten here by vercel.json)
// Returns the normal single-page app, but with the job's title, description, Open Graph tags and
// JobPosting JSON-LD already in the HTML — what Google, WhatsApp and Facebook read.
import * as lib from './_lib.js';

export default async function handler(req, res) {
  try {
    const id = lib.jobIdFromSlug(req.query.slug);
    const shell = await lib.getShell(req);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    if (!id || !lib.API_URL) {
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(200).send(shell);
    }

    const { status, data: job } = await lib.getJson(`/jobs/${id}`);

    // Job missing or API unreachable: serve the app untouched and keep it out of the index.
    if (status !== 200 || !job) {
      const html = lib.injectHead(shell, {
        title: 'Job not available | Velaivaaipu',
        description: 'This job is no longer available. Browse the latest jobs in Tamil Nadu on Velaivaaipu.',
        canonical: `${lib.SITE_URL}/jobs`,
        robots: 'noindex, follow',
      });
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(200).send(html);
    }

    const company = job.company?.name || 'Velaivaaipu';
    const city = job.location || 'Tamil Nadu';
    const canonical = lib.jobUrl(job);
    const image = job.company?.logo ? lib.absolute(job.company.logo) : lib.OG_IMAGE;
    const image2 = /\.(png|jpe?g)$/i.test(image) ? image : lib.OG_IMAGE; // WhatsApp ignores webp/svg previews

    // Closed / filled job: keep the URL alive with a clear message, but drop the JobPosting markup.
    if (job.closed) {
      const html = lib.injectHead(shell, {
        title: `${job.title || 'This job'} — position filled | Velaivaaipu`,
        description: `This ${job.title || ''} opening at ${company} has been filled. Find similar jobs in ${city} on Velaivaaipu.`,
        canonical,
        robots: 'noindex, follow',
      });
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
      return res.status(200).send(html);
    }

    const description = lib.clip(
      `${company} is hiring ${job.title} in ${city}. ${job.vacancies || 1} opening${job.vacancies === 1 ? '' : 's'}. Apply free on Velaivaaipu. ${lib.stripHtml(job.description)}`,
      155
    );

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description || `${company} is hiring ${job.title} in ${city}.`,
      identifier: { '@type': 'PropertyValue', name: 'Velaivaaipu', value: job.display_id || job._id },
      datePosted: job.createdAt,
      validThrough: job.validThrough,
      employmentType: String(job.jobType || 'FULL_TIME').toUpperCase().replace(/[ -]/g, '_'),
      hiringOrganization: { '@type': 'Organization', name: company, ...(job.company?.website ? { sameAs: job.company.website } : {}), ...(job.company?.logo ? { logo: lib.absolute(job.company.logo) } : {}) },
      jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: city, addressRegion: 'Tamil Nadu', addressCountry: 'IN' } },
      directApply: true,
      ...(job.workMode === 'Remote' ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'IN' } } : {}),
      ...(!job.salary?.isRangeHidden && job.salary?.min ? { baseSalary: { '@type': 'MonetaryAmount', currency: job.salary.currency || 'INR', value: { '@type': 'QuantitativeValue', minValue: job.salary.min, maxValue: job.salary.max || job.salary.min, unitText: 'YEAR' } } } : {}),
    };

    const html = lib.injectHead(shell, {
      title: lib.clip(`${job.title} Job in ${city} — ${company} | Velaivaaipu`, 70),
      description,
      canonical,
      image: image2,
      type: 'article',
      jsonLd,
    });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).send(html);
  } catch (err) {
    // Never break the page: fall back to the plain app.
    try {
      const shell = await lib.getShell(req);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(shell);
    } catch {
      return res.status(502).send('Temporarily unavailable');
    }
  }
}
