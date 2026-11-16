const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const SkillTestResult = require('../models/SkillTestResult');
const BrandLead = require('../models/BrandLead');
const { cleanLeadStatus, academyReason, coreReason, toCsv } = require('../utils/brandLeads');

const HEX = /^[0-9a-fA-F]{24}$/;
const DAY = 86400000;

// PUT /api/user/brand-consent {contact: boolean}
const setBrandConsent = async (req, res) => {
  try {
    if (typeof req.body?.contact !== 'boolean') return res.status(400).json({ msg: 'Send contact as true or false' });
    const set = req.body.contact ? { 'brandConsent.contact': true, 'brandConsent.at': new Date(), 'brandConsent.withdrawnAt': null, 'brandConsent.source': 'settings' }
      : { 'brandConsent.contact': false, 'brandConsent.withdrawnAt': new Date() };
    await User.updateOne({ _id: req.user.id }, { $set: set });
    res.json({ contact: req.body.contact });
  } catch (e) { console.error('Brand consent:', e.message); res.status(500).json({ msg: 'Server error' }); }
};
const getBrandConsent = async (req, res) => {
  const u = await User.findById(req.user.id).select('brandConsent').lean().catch(() => null);
  res.json({ contact: !!u?.brandConsent?.contact });
};

const Role = require('../models/Role');

// Builds the lead rows for one brand. Only people who agreed to be contacted are ever included.
const buildLeads = async (brand) => {
  const roles = await Role.find({ name: { $in: brand === 'academy' ? ['jobseeker'] : ['recruiter', 'company'] } }).select('_id').lean();
  const users = await User.find({ role: { $in: roles.map((r) => r._id) }, 'brandConsent.contact': true })
    .select('name email profile.phone profile.location').limit(2000).lean();
  const ids = users.map((u) => u._id);
  if (!ids.length) return [];
  const reasonOf = {};
  if (brand === 'academy') {
    const [apps, tests] = await Promise.all([
      Application.aggregate([{ $match: { applicant: { $in: ids } } }, { $group: { _id: '$applicant', applications: { $sum: 1 }, shortlisted: { $sum: { $cond: [{ $in: ['$status', ['shortlisted', 'accepted']] }, 1, 0] } } } }]),
      SkillTestResult.find({ user: { $in: ids } }).select('user score total').lean(),
    ]);
    const st = {};
    apps.forEach((a) => { st[String(a._id)] = { applications: a.applications, shortlisted: a.shortlisted, failedTests: 0 }; });
    tests.forEach((t) => { const k = String(t.user); st[k] = st[k] || { applications: 0, shortlisted: 0, failedTests: 0 }; if (t.total > 0 && t.score / t.total < 0.5) st[k].failedTests += 1; });
    Object.entries(st).forEach(([k, v]) => { const r = academyReason(v); if (r) reasonOf[k] = r; });
  } else {
    const jobs = await Job.find({ recruiter: { $in: ids } }).select('recruiter status vacancies createdAt').lean();
    const counts = await Application.aggregate([{ $match: { job: { $in: jobs.map((j) => j._id) } } }, { $group: { _id: '$job', n: { $sum: 1 } } }]);
    const nOf = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    const st = {};
    jobs.forEach((j) => {
      const k = String(j.recruiter); st[k] = st[k] || { jobs: 0, staleJobs: 0, vacancies: 0 };
      st[k].jobs += 1;
      if (j.status === 'active') {
        st[k].vacancies += j.vacancies || 0;
        if (Date.now() - new Date(j.createdAt).getTime() > 21 * DAY && (nOf[String(j._id)] || 0) < 3) st[k].staleJobs += 1;
      }
    });
    Object.entries(st).forEach(([k, v]) => { const r = coreReason(v); if (r) reasonOf[k] = r; });
  }
  const follow = await BrandLead.find({ brand, user: { $in: Object.keys(reasonOf) } }).lean();
  const fOf = Object.fromEntries(follow.map((f) => [String(f.user), f]));
  return users.filter((u) => reasonOf[String(u._id)]).map((u) => ({
    id: String(u._id), name: u.name, email: u.email, phone: u.profile?.phone || '', city: u.profile?.location || '',
    reason: reasonOf[String(u._id)], status: fOf[String(u._id)]?.status || 'new', note: fOf[String(u._id)]?.note || '',
  }));
};

// GET /api/admin/brand-leads?brand=academy|coretalents[&format=csv]   (Super Admin only)
const listBrandLeads = async (req, res) => {
  try {
    const brand = req.query.brand === 'coretalents' ? 'coretalents' : 'academy';
    const rows = await buildLeads(brand);
    if (req.query.format === 'csv') { res.set('Content-Type', 'text/csv'); res.set('Content-Disposition', `attachment; filename="${brand}-leads.csv"`); return res.send(toCsv(rows)); }
    res.json({ brand, leads: rows });
  } catch (e) { console.error('Brand leads:', e.message); res.status(500).json({ message: 'Could not load leads' }); }
};

// PATCH /api/admin/brand-leads/:userId {brand, status?, note?}
const updateBrandLead = async (req, res) => {
  try {
    if (!HEX.test(req.params.userId)) return res.status(400).json({ message: 'Bad id' });
    const brand = req.body.brand === 'coretalents' ? 'coretalents' : req.body.brand === 'academy' ? 'academy' : null;
    if (!brand) return res.status(400).json({ message: 'Choose a brand' });
    const target = await User.findOne({ _id: req.params.userId, 'brandConsent.contact': true }).select('_id').lean();
    if (!target) return res.status(404).json({ message: 'This person has not agreed to be contacted' });
    const set = { updatedBy: req.user.id };
    if (req.body.status !== undefined) { const st = cleanLeadStatus(req.body.status); if (!st) return res.status(400).json({ message: 'Bad status' }); set.status = st; }
    if (typeof req.body.note === 'string') set.note = req.body.note.slice(0, 300);
    await BrandLead.updateOne({ user: req.params.userId, brand }, { $set: set }, { upsert: true });
    res.json({ ok: true });
  } catch (e) { console.error('Brand lead update:', e.message); res.status(500).json({ message: 'Could not save' }); }
};

module.exports = { setBrandConsent, getBrandConsent, listBrandLeads, updateBrandLead, buildLeads };
