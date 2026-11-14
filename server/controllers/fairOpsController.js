// Job fairs, steps 2 to 4: fair mails, stalls and check-in for our own fairs, and the draft-from-notice helper.
// Models are required inside the handlers so this file loads without a database driver (tests).
const fail = (res, err, msg = 'Server error') => { console.error('Fair ops error:', err.message); res.status(500).json({ msg }); };
const validId = (id) => /^[a-f0-9]{24}$/i.test(String(id || ''));
const models = () => ({
  JobFair: require('../models/JobFair'), FairInterest: require('../models/FairInterest'), FairStall: require('../models/FairStall'),
  FairCheckIn: require('../models/FairCheckIn'), User: require('../models/User'), Settings: require('../models/Settings'),
});

// ---- Step 2: fair mails (admin button per audience; OFF unless FAIR_MAILS_ENABLED=true)
// POST /api/job-fairs/admin/:id/send-mail   { audience: 'seeker'|'company'|'college', preview?: true }
const sendMail = async (req, res) => {
  try {
    const fm = require('../utils/fairMails');
    if (!validId(req.params.id)) return res.status(400).json({ msg: 'Invalid id' });
    const audience = String(req.body?.audience || '');
    if (!fm.AUDIENCES.includes(audience)) return res.status(400).json({ msg: 'Choose job seekers, companies or colleges.' });
    if (!fm.enabled()) return res.json({ enabled: false, msg: 'Fair mails are switched off on this server.' });
    const fair = await models().JobFair.findById(req.params.id).lean();
    if (!fair) return res.status(404).json({ msg: 'Fair not found' });
    if (!fm.mailable(fair)) return res.status(400).json({ msg: 'Only a published fair that has not ended can be mailed.' });
    const preview = await fm.sendFairMails({ fair, audience, preview: true });
    if (preview.error) return res.status(400).json({ msg: preview.error });
    if (req.body?.preview === true) return res.json({ enabled: true, ...preview });
    const queued = Math.min(preview.eligible, fm.maxPerClick());
    // Sent in the background (about 0.3 seconds a mail); the button can be pressed again later for the rest. Nobody gets it twice.
    fm.sendFairMails({ fair, audience }).then((r) => console.log('Fair mails done:', JSON.stringify(r))).catch((e) => console.error('Fair mails failed:', e.message));
    res.status(202).json({ enabled: true, queued, eligible: preview.eligible });
  } catch (err) { fail(res, err); }
};

// ---- Step 3: stalls (own fairs only)
const loadOwnFair = (slug) => models().JobFair.findOne({ slug: String(slug), kind: 'own', status: 'published' }).lean();

// GET /api/job-fairs/:slug/stall   Company: whether stalls are open, the price (only if set) and my request.
const myStall = async (req, res) => {
  try {
    const st = require('../utils/fairStalls');
    const m = models();
    const fair = await loadOwnFair(req.params.slug);
    if (!fair) return res.status(404).json({ msg: 'Fair not found' });
    const [mine, settings] = await Promise.all([m.FairStall.findOne({ fair: fair._id, user: req.user.id }).lean(), m.Settings.findOne({ key: 'global' }).select('fairStallPrice').lean()]);
    res.json({ open: st.stallsOpen(fair), price: st.stallPriceLabel(settings?.fairStallPrice), mine: mine ? { name: mine.name, status: mine.status, need: mine.need } : null });
  } catch (err) { fail(res, err); }
};

// POST /api/job-fairs/:slug/stall   Company or recruiter asks for a stall. One request per account per fair.
const requestStall = async (req, res) => {
  try {
    const st = require('../utils/fairStalls');
    const m = models();
    const fair = await loadOwnFair(req.params.slug);
    if (!fair) return res.status(404).json({ msg: 'Fair not found' });
    if (!st.stallsOpen(fair)) return res.status(400).json({ msg: 'Stalls are closed for this fair.' });
    const { error, data } = st.cleanStallInput(req.body);
    if (error) return res.status(400).json({ msg: error });
    const u = await m.User.findById(req.user.id).select('company employerCompany').lean();
    const stall = await m.FairStall.create({ ...data, fair: fair._id, user: req.user.id, company: u?.company || u?.employerCompany || null });
    res.status(201).json({ status: stall.status });
  } catch (err) { if (err.code === 11000) return res.status(409).json({ msg: 'You have already asked for a stall at this fair.' }); fail(res, err); }
};

// GET /api/job-fairs/admin/:id/stalls
const adminStalls = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ msg: 'Invalid id' });
    res.json(await models().FairStall.find({ fair: req.params.id }).sort({ createdAt: -1 }).limit(300).lean());
  } catch (err) { fail(res, err); }
};

// PATCH /api/job-fairs/admin/stalls/:stallId   { status: 'approved' | 'declined' | 'requested' }
const adminStallStatus = async (req, res) => {
  try {
    if (!validId(req.params.stallId)) return res.status(400).json({ msg: 'Invalid id' });
    if (!['approved', 'declined', 'requested'].includes(req.body?.status)) return res.status(400).json({ msg: 'Invalid status' });
    const set = { status: req.body.status };
    if (req.body.status !== 'approved') set.checkedInAt = null;
    const stall = await models().FairStall.findByIdAndUpdate(req.params.stallId, { $set: set }, { new: true });
    if (!stall) return res.status(404).json({ msg: 'Stall request not found' });
    res.json(stall);
  } catch (err) { fail(res, err); }
};

// GET/PATCH /api/job-fairs/admin/stall-price   The price is a Setting, blank until Kamar decides. Send null or '' to clear it.
const getStallPrice = async (req, res) => {
  try {
    const s = await models().Settings.findOne({ key: 'global' }).select('fairStallPrice').lean();
    res.json({ fairStallPrice: s?.fairStallPrice ?? null });
  } catch (err) { fail(res, err); }
};
const setStallPrice = async (req, res) => {
  try {
    const raw = req.body?.fairStallPrice;
    const blank = raw === null || raw === '' || raw === undefined;
    const n = blank ? null : Number(raw);
    if (!blank && (!Number.isFinite(n) || n < 0 || n > 10000000)) return res.status(400).json({ msg: 'Enter a price in rupees, or leave it blank.' });
    const s = await models().Settings.findOneAndUpdate({ key: 'global' }, { $set: { fairStallPrice: n } }, { new: true, upsert: true, setDefaultsOnInsert: true }).select('fairStallPrice').lean();
    res.json({ fairStallPrice: s.fairStallPrice ?? null });
  } catch (err) { fail(res, err); }
};

// ---- Step 3: check-in screen
const checkInCounts = async (m, fairId) => {
  const [going, seekerIn, stallsApproved, stallsIn] = await Promise.all([
    m.FairInterest.countDocuments({ fair: fairId }), m.FairCheckIn.countDocuments({ fair: fairId }),
    m.FairStall.countDocuments({ fair: fairId, status: 'approved' }), m.FairStall.countDocuments({ fair: fairId, status: 'approved', checkedInAt: { $ne: null } }),
  ]);
  return { going, seekerIn, stallsApproved, stallsIn };
};

// GET /api/job-fairs/admin/:id/checkin?q=   Registered job seekers (tapped "I am going") matching a name or phone, approved stalls, and live counts.
const checkInList = async (req, res) => {
  try {
    const st = require('../utils/fairStalls');
    const m = models();
    if (!validId(req.params.id)) return res.status(400).json({ msg: 'Invalid id' });
    const fair = await m.JobFair.findById(req.params.id).select('_id kind title').lean();
    if (!fair) return res.status(404).json({ msg: 'Fair not found' });
    const s = st.parseSearch(req.query.q);
    const interest = await m.FairInterest.find({ fair: fair._id }).select('user').limit(3000).lean();
    const users = await m.User.find({ _id: { $in: interest.map((i) => i.user) } }).select('name email profile.phone').lean();
    const here = new Set((await m.FairCheckIn.find({ fair: fair._id }).select('user').lean()).map((c) => String(c.user)));
    const digitsOf = (u) => String(u.profile?.phone || '').replace(/\D/g, '');
    let seekers = users.filter((u) => (s.phoneDigits ? digitsOf(u).endsWith(s.phoneDigits) : s.name ? new RegExp(st.escRe(s.name), 'i').test(u.name || '') : true));
    seekers = seekers.slice(0, 30).map((u) => ({ id: u._id, name: u.name || '', phone: u.profile?.phone || '', checkedIn: here.has(String(u._id)) }));
    const stalls = (await m.FairStall.find({ fair: fair._id, status: 'approved' }).sort({ name: 1 }).limit(100).lean())
      .filter((x) => !s.name || new RegExp(st.escRe(s.name), 'i').test(`${x.name} ${x.contactName}`))
      .map((x) => ({ id: x._id, name: x.name, contactName: x.contactName, phone: x.phone, checkedIn: !!x.checkedInAt }));
    res.json({ title: fair.title, counts: await checkInCounts(m, fair._id), seekers, stalls });
  } catch (err) { fail(res, err); }
};

// POST /api/job-fairs/admin/:id/checkin   { kind: 'seeker' | 'stall', id, undo?: true }
const checkIn = async (req, res) => {
  try {
    const m = models();
    if (!validId(req.params.id) || !validId(req.body?.id)) return res.status(400).json({ msg: 'Invalid id' });
    const { kind, id } = req.body;
    const undo = req.body.undo === true;
    const fair = await m.JobFair.findById(req.params.id).select('_id').lean();
    if (!fair) return res.status(404).json({ msg: 'Fair not found' });
    if (kind === 'seeker') {
      if (!(await m.FairInterest.exists({ fair: fair._id, user: id }))) return res.status(404).json({ msg: 'This person is not registered for the fair.' });
      if (undo) await m.FairCheckIn.deleteOne({ fair: fair._id, user: id });
      else await m.FairCheckIn.updateOne({ fair: fair._id, user: id }, { $setOnInsert: { by: req.user.id } }, { upsert: true });
    } else if (kind === 'stall') {
      const r = await m.FairStall.updateOne({ _id: id, fair: fair._id, status: 'approved' }, { $set: { checkedInAt: undo ? null : new Date() } });
      if (!r.matchedCount && !r.n) return res.status(404).json({ msg: 'Approved stall not found.' });
    } else return res.status(400).json({ msg: 'Invalid kind' });
    res.json({ ok: true, counts: await checkInCounts(m, fair._id) });
  } catch (err) { fail(res, err); }
};

// ---- Step 4: draft from an official notice link
// POST /api/job-fairs/admin/from-notice   { url }   Always a DRAFT; the admin checks and publishes by hand.
const fromNotice = async (req, res) => {
  try {
    const n = require('../utils/fairNotice');
    const u = require('../utils/jobFairs');
    const out = await n.draftFromNotice(req.body?.url);
    if (out.error) return res.status(422).json({ msg: out.error, partial: out.partial ? { title: out.partial.title, venue: out.partial.venue, organiserName: out.partial.organiserName, officialUrl: out.partial.officialUrl } : undefined });
    const fair = await models().JobFair.create({ ...out.draft, status: 'draft', slug: u.makeFairSlug(out.draft.title), createdBy: req.user.id });
    res.status(201).json(fair);
  } catch (err) { fail(res, err); }
};

module.exports = { sendMail, myStall, requestStall, adminStalls, adminStallStatus, getStallPrice, setStallPrice, checkInList, checkIn, fromNotice };
