// Daily scan of the watched government pages. On unless GOVT_WATCH_ENABLED=false. With no sources added it does nothing.
const GovtSource = require('../models/GovtSource');
const GovtNotice = require('../models/GovtNotice');
const { scanSource } = require('../utils/govtNotices');

const scanOne = async (source, opts) => {
  const known = (await GovtNotice.find({ source: source._id }).select('fingerprint').lean()).map((n) => n.fingerprint);
  const r = await scanSource(source, known, opts);
  source.lastScanAt = r.error ? source.lastScanAt : new Date();
  source.lastError = r.error || '';
  await source.save();
  if (r.error) return { source: source.name, error: r.error, added: 0 };
  const status = r.baseline ? 'baseline' : 'new';
  let added = 0;
  for (const n of r.fresh) {
    try { await GovtNotice.create({ source: source._id, title: n.title, url: n.url, fingerprint: n.fingerprint, status }); if (!r.baseline) added += 1; }
    catch (e) { if (e.code !== 11000) console.error('Govt notice save:', e.message); }
  }
  return { source: source.name, added, baseline: !!r.baseline };
};

const runGovtWatch = async (opts) => {
  if (process.env.GOVT_WATCH_ENABLED === 'false') return [];
  const sources = await GovtSource.find({ active: true });
  const results = [];
  for (const s of sources) {
    try { results.push(await scanOne(s, opts)); } catch (e) { console.error('Govt watch:', s.name, e.message); }
  }
  return results;
};

module.exports = { runGovtWatch, scanOne };
