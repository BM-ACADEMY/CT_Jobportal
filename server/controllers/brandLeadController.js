const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const SkillTestResult = require('../models/SkillTestResult');
const BrandLead = require('../models/BrandLead');
const { cleanLeadStatus, academyLead, coreLead, isFinalYear, wantsAcademyProgram, cleanFollowUp, toCsv } = require('../utils/brandLeads');

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
    .select('name email createdAt brandConsent.at profile.phone profile.location profile.qualification profile.headline profile.preferredRole profile.skills profile.interestedDomain').limit(2000).lean();
  const ids = users.map((u) => u._id);
  if (!ids.length) return [];
  const reasonOf = {}; const scoreOf = {};
  if (brand === 'academy') {
    const [apps, tests] = await Promise.all([
      Application.aggregate([{ $match: { applicant: { $in: ids } } }, { $group: { _id: '$applicant', applications: { $sum: 1 }, shortlisted: { $sum: { $cond: [{ $in: ['$status', ['shortlisted', 'accepted']] }, 1, 0] } } } }]),
      SkillTestResult.find({ user: { $in: ids } }).select('user score total').lean(),
    ]);
    // Every consenting job seeker is checked, including people with no applications or tests yet.
    const st = {};
    users.forEach((u) => {
      st[String(u._id)] = {
        applications: 0, shortlisted: 0, failedTests: 0,
        daysSinceSignup: Math.floor((Date.now() - new Date(u.createdAt).getTime()) / DAY),
        finalYear: isFinalYear(u.profile?.qualification), programInterest: wantsAcademyProgram(u.profile),
      };
    });
    apps.forEach((a) => { const v = st[String(a._id)]; if (v) { v.applications = a.applications; v.shortlisted = a.shortlisted; } });
    tests.forEach((t) => { const v = st[String(t.user)]; if (v && t.total > 0 && t.score / t.total < 0.5) v.failedTests += 1; });
    Object.entries(st).forEach(([k, v]) => { const l = academyLead(v); if (l) { reasonOf[k] = l.reason; scoreOf[k] = l.score; } });
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
    Object.entries(st).forEach(([k, v]) => { const l = coreLead(v); if (l) { reasonOf[k] = l.reason; scoreOf[k] = l.score; } });
  }
  const follow = await BrandLead.find({ brand, user: { $in: Object.keys(reasonOf) } }).lean();
  const fOf = Object.fromEntries(follow.map((f) => [String(f.user), f]));
  return users.filter((u) => reasonOf[String(u._id)]).map((u) => ({
    id: String(u._id), name: u.name, email: u.email, phone: u.profile?.phone || '', city: u.profile?.location || '',
    reason: reasonOf[String(u._id)], score: scoreOf[String(u._id)] || 0, consentAt: u.brandConsent?.at || null,
    status: fOf[String(u._id)]?.status || 'new', note: fOf[String(u._id)]?.note || '',
    followUpAt: fOf[String(u._id)]?.followUpAt || null, lastContactedAt: fOf[String(u._id)]?.lastContactedAt || null,
  })).sort((a, b) => b.score - a.score || String(b.consentAt || '').localeCompare(String(a.consentAt || '')));
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
    if (req.body.followUpAt !== undefined) { const d = cleanFollowUp(req.body.followUpAt); if (d === undefined) return res.status(400).json({ message: 'Bad follow-up date' }); set.followUpAt = d; }
    if (req.body.contacted === true) set.lastContactedAt = new Date();
    // Reaching out counts as "Called" unless the team already marked the person Interested or Not interested.
    const update = { $set: set };
    if (req.body.contacted === true && req.body.status === undefined) {
      const current = await BrandLead.findOne({ user: req.params.userId, brand }).select('status').lean();
      if (!current || current.status === 'new') set.status = 'called';
    }
    await BrandLead.updateOne({ user: req.params.userId, brand }, update, { upsert: true });
    res.json({ ok: true, status: set.status || null });
  } catch (e) { console.error('Brand lead update:', e.message); res.status(500).json({ message: 'Could not save' }); }
};

module.exports = { setBrandConsent, getBrandConsent, listBrandLeads, updateBrandLead, buildLeads };
