// Daily scan of the watched government pages. On unless GOVT_WATCH_ENABLED=false. With no sources added it does nothing.
// Models are loaded when used, so the rules here can be tested without a database.
const GovtSource = { get m() { return require('../models/GovtSource'); } };
const GovtNotice = { get m() { return require('../models/GovtNotice'); } };
const { scanSource } = require('../utils/govtNotices');

const scanOne = async (source, opts) => {
  const known = (await GovtNotice.m.find({ source: source._id }).select('fingerprint').lean()).map((n) => n.fingerprint);
  const r = await scanSource(source, known, opts);
  source.lastScanAt = r.error ? source.lastScanAt : new Date();
  source.lastError = r.error || '';
  await source.save();
  if (r.error) return { source: source.name, error: r.error, added: 0 };
  const status = r.baseline ? 'baseline' : 'new';
  let added = 0;
  for (const n of r.fresh) {
    try { await GovtNotice.m.create({ source: source._id, title: n.title, url: n.url, fingerprint: n.fingerprint, status }); if (!r.baseline) added += 1; }
    catch (e) { if (e.code !== 11000) console.error('Govt notice save:', e.message); }
  }
  return { source: source.name, added, baseline: !!r.baseline };
};

// Built-in list (config/govtSources.js): every page in it that is not yet watched is added on server start.
// A page you paused in Admin stays paused (it still exists), and the Admin page can still add more of its own.
const seedDefaultSources = async (defaults = require('../config/govtSources'), Model = GovtSource.m) => {
  const have = new Set((await Model.find({}).select('url').lean()).map((x) => x.url));
  let n = 0;
  for (const d of defaults) {
    if (have.has(d.url)) continue;
    try { await Model.create(d); n += 1; } catch (e) { if (e.code !== 11000) console.error('Govt seed:', e.message); }
  }
  return n;
};

// staleHours: skip pages already scanned that recently (used when the server starts, so restarts do not re-scan everything).
const runGovtWatch = async (opts = {}) => {
  if (process.env.GOVT_WATCH_ENABLED === 'false') return [];
  await seedDefaultSources();
  const sources = (await GovtSource.m.find({ active: true }))
    .filter((s) => !opts.staleHours || !s.lastScanAt || Date.now() - new Date(s.lastScanAt).getTime() > opts.staleHours * 3600000);
  const results = [];
  for (const s of sources) {
    try { results.push(await scanOne(s, opts)); } catch (e) { console.error('Govt watch:', s.name, e.message); }
  }
  return results;
};

module.exports = { runGovtWatch, scanOne, seedDefaultSources };
