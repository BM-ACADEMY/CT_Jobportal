// Walk-in Drives. Payment is NOT through Razorpay: an admin marks a paid plan or add-on as paid by hand.
const QRCode = require('qrcode');
const WalkInDrive = require('../models/WalkInDrive');
const DriveRegistration = require('../models/DriveRegistration');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');
const cfg = require('../config/driveConfig');
const R = require('../utils/driveRules');
const { unsubscribeLink } = require('../utils/lifecycleEmails');

const HEX = /^[0-9a-fA-F]{24}$/;
const siteUrl = () => (process.env.FRONTEND_URL || 'https://velaivaaipu.in').replace(/\/$/, '');
const driveUrl = (d) => `${siteUrl()}/drives/${d.slug}`;
const fail = (res, err, where) => { console.error(`Drive ${where}:`, err.message); return res.status(500).json({ msg: 'Server error' }); };
const mine = async (req) => { const d = HEX.test(req.params.id || '') ? await WalkInDrive.findById(req.params.id) : null; return d && String(d.organiser) === String(req.user.id) ? d : null; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mail = (to, subject, title, body) => to ? sendEmail({ email: to, subject, html: emailWrapper(title, body) }).catch((e) => console.error('Drive mail:', e.message)) : null;

const slotCountsFor = async (driveId) => {
  const regs = await DriveRegistration.find({ drive: driveId }).select('slot');
  const counts = {}; regs.forEach((r) => { counts[r.slot] = (counts[r.slot] || 0) + 1; });
  return { registered: regs.length, counts };
};

// ---------- Public ----------
const listDrives = async (req, res) => {
  try {
    const drives = await WalkInDrive.find({ status: 'published', date: { $gte: R.istDayStart() } }).sort({ date: 1 }).limit(60);
    const now = Date.now();
    const out = drives.map((d) => {
      const l = cfg.effectiveLimits(d);
      // A home page spot shows in the last N days before the drive, labelled Sponsored.
      const sponsored = l.homeSpotDays > 0 && new Date(d.date).getTime() - now <= l.homeSpotDays * 86400000;
      return { ...R.publicDrive(d, { limits: l }), sponsored, registered: undefined, spotsLeft: undefined };
    });
    res.json([...out.filter((d) => d.sponsored), ...out.filter((d) => !d.sponsored)]);
  } catch (err) { return fail(res, err, 'list'); }
};

const getDrive = async (req, res) => {
  try {
    const d = await WalkInDrive.findOne({ slug: String(req.params.slug) });
    if (!d || !['published', 'closed'].includes(d.status)) return res.status(404).json({ msg: 'Drive not found' });
    const { registered, counts } = await slotCountsFor(d._id);
    const limits = cfg.effectiveLimits(d);
    res.json({ ...R.publicDrive(d, { registered, slotCounts: counts, limits }), shareText: R.shareText(d, driveUrl(d)), url: driveUrl(d) });
  } catch (err) { return fail(res, err, 'get'); }
};

const pngOf = async (res, text) => { res.set('Content-Type', 'image/png').set('Cache-Control', 'public, max-age=3600'); res.send(await QRCode.toBuffer(text, { width: 360, margin: 1 })); };
const driveQr = async (req, res) => {
  try { const d = await WalkInDrive.findOne({ slug: String(req.params.slug), status: 'published' }).select('slug'); if (!d) return res.status(404).json({ msg: 'Drive not found' }); await pngOf(res, driveUrl(d)); }
  catch (err) { return fail(res, err, 'qr'); }
};

const registerForDrive = async (req, res) => {
  try {
    const d = await WalkInDrive.findOne({ slug: String(req.params.slug) });
    if (!d || d.status !== 'published') return res.status(404).json({ msg: 'Drive not found' });
    if (new Date(d.date) < R.istDayStart()) return res.status(400).json({ msg: 'This drive has already happened' });

    const name = R.str(req.body?.name, 100);
    const phone = R.cleanPhone(req.body?.phone);
    const email = R.cleanEmail(req.body?.email);
    if (name.length < 2) return res.status(400).json({ msg: 'Please enter your name' });
    if (!phone) return res.status(400).json({ msg: 'Please enter a valid 10-digit mobile number' });
    const slot = R.str(req.body?.slot, 40);
    if (!d.slots.some((s) => s.label === slot)) return res.status(400).json({ msg: 'Please choose a time slot' });

    const existing = await DriveRegistration.findOne({ drive: d._id, phone });
    if (existing) return res.status(200).json({ code: existing.code, already: true, msg: 'You are already registered' });

    const limits = cfg.effectiveLimits(d);
    const { registered, counts } = await slotCountsFor(d._id);
    if (registered >= limits.maxRegistrations) return res.status(409).json({ msg: 'Registrations for this drive are full' });
    const cap = d.slots.find((s) => s.label === slot).capacity;
    if ((counts[slot] || 0) >= cap) return res.status(409).json({ msg: 'That slot is full, please choose another' });

    const answers = d.screeningQuestions.slice(0, limits.screeningMax).map((question, i) => ({ question, answer: R.str(req.body?.answers?.[i], 300) }));
    let reg;
    for (let tries = 0; tries < 5 && !reg; tries++) {
      try { reg = await DriveRegistration.create({ drive: d._id, user: req.user?.id, name, phone, email, slot, answers, code: R.makeCode() }); }
      catch (e) {
        if (e.code === 11000 && /phone/.test(String(e.message))) { const again = await DriveRegistration.findOne({ drive: d._id, phone }); return res.json({ code: again?.code, already: true, msg: 'You are already registered' }); }
        if (e.code !== 11000) throw e;
      }
    }
    if (!reg) return res.status(500).json({ msg: 'Server error' });
    mail(email, `You are registered: ${d.title}`, 'You are registered', `<p>Hi ${esc(name)}, you are registered for <b>${esc(d.title)}</b>.</p><p>Slot: ${esc(slot)}<br>Venue: ${esc(d.venue.address)}</p><p>Your check-in code: <b style="font-size:20px">${reg.code}</b><br>Show it at the desk: <a href="${siteUrl()}/drives/registration/${reg.code}">open your pass</a></p>`);
    res.status(201).json({ code: reg.code, msg: 'Registered' });
  } catch (err) { return fail(res, err, 'register'); }
};

const getRegistration = async (req, res) => {
  try {
    const reg = await DriveRegistration.findOne({ code: String(req.params.code).toUpperCase() });
    const d = reg && await WalkInDrive.findById(reg.drive);
    if (!d) return res.status(404).json({ msg: 'Pass not found' });
    res.json({ code: reg.code, name: reg.name, slot: reg.slot, status: reg.status, tokenNumber: reg.tokenNumber, drive: { title: d.title, date: d.date, venue: d.venue, documents: d.documents, slug: d.slug } });
  } catch (err) { return fail(res, err, 'pass'); }
};
const registrationQr = async (req, res) => {
  try { const reg = await DriveRegistration.findOne({ code: String(req.params.code).toUpperCase() }).select('code'); if (!reg) return res.status(404).json({ msg: 'Pass not found' }); await pngOf(res, reg.code); }
  catch (err) { return fail(res, err, 'pass qr'); }
};

// ---------- Organiser ----------
const createDrive = async (req, res) => {
  try {
    const { error, data } = R.cleanDriveInput(req.body);
    if (error) return res.status(400).json({ msg: error });
    if (data.plan === 'free') {
      const used = await WalkInDrive.countDocuments({ organiser: req.user.id, plan: 'free', status: { $ne: 'rejected' }, createdAt: { $gte: cfg.istMonthStart() } });
      if (used >= cfg.FREE_DRIVES_PER_MONTH) return res.status(403).json({ msg: 'Your free drive for this month is used. Choose Drive Plus or Drive Pro for another one.' });
    }
    const plan = cfg.PLANS[data.plan];
    data.screeningQuestions = data.screeningQuestions.slice(0, Math.max(plan.screeningMax, data.plan === 'free' ? 0 : plan.screeningMax));
    const addons = (Array.isArray(req.body.addons) ? req.body.addons : []).filter((a) => cfg.ADDONS[a?.key]).slice(0, 7)
      .map((a) => ({ key: a.key, qty: Math.min(50, Math.max(1, Math.floor(Number(a.qty)) || 1)) }));
    const u = await User.findById(req.user.id).select('name');
    const drive = await WalkInDrive.create({ ...data, addons, organiser: req.user.id, organiserName: u?.name || '', slug: R.slugify(data.title) });
    res.status(201).json({ id: drive._id, status: drive.status, quote: cfg.quote(drive), msg: drive.plan === 'free' && !addons.length ? 'Sent for approval. We usually reply within a day.' : 'Sent for approval. We will contact you for payment, then publish it.' });
  } catch (err) { return fail(res, err, 'create'); }
};

const myDrives = async (req, res) => {
  try {
    const drives = await WalkInDrive.find({ organiser: req.user.id }).sort({ date: -1 }).limit(100);
    const counts = await Promise.all(drives.map((d) => DriveRegistration.countDocuments({ drive: d._id })));
    res.json(drives.map((d, i) => ({ id: d._id, slug: d.slug, title: d.title, date: d.date, status: d.status, plan: d.plan, adminNote: d.adminNote, registered: counts[i], quote: cfg.quote(d) })));
  } catch (err) { return fail(res, err, 'mine'); }
};

const manageDrive = async (req, res) => {
  try {
    const d = await mine(req); if (!d) return res.status(404).json({ msg: 'Drive not found' });
    const regs = await DriveRegistration.find({ drive: d._id }).sort({ createdAt: 1 });
    res.json({ drive: d, limits: cfg.effectiveLimits(d), quote: cfg.quote(d), url: driveUrl(d), shareText: R.shareText(d, driveUrl(d)), registrations: regs, summary: R.summarise(regs), invitesLeft: Math.max(0, cfg.effectiveLimits(d).inviteLimit - d.invitedUsers.length) });
  } catch (err) { return fail(res, err, 'manage'); }
};

// Desk check-in by code. Gives the next token number. Needs the QR check-in feature (Plus, Pro); the free plan checks in by phone number.
const checkIn = async (req, res) => {
  try {
    const d = await mine(req); if (!d) return res.status(404).json({ msg: 'Drive not found' });
    if (d.status !== 'published') return res.status(400).json({ msg: 'Only a published drive can check people in' });
    const code = String(req.body?.code || '').trim().toUpperCase();
    const phone = R.cleanPhone(req.body?.phone);
    const limits = cfg.effectiveLimits(d);
    if (code && !cfg.PLANS[d.plan].qrCheckIn) return res.status(403).json({ msg: 'Code check-in is part of Drive Plus. Use the phone number instead.' });
    if (!code && !phone) return res.status(400).json({ msg: 'Enter the code or the phone number' });
    const reg = await DriveRegistration.findOne(code ? { drive: d._id, code } : { drive: d._id, phone });
    if (!reg) return res.status(404).json({ msg: 'No registration found' });
    if (reg.status !== 'registered') return res.json({ already: true, name: reg.name, tokenNumber: reg.tokenNumber, status: reg.status });
    // Claim the check-in first, in one step. If two desks scan the same person together, only one wins and only one token is used.
    const claimed = await DriveRegistration.findOneAndUpdate({ _id: reg._id, status: 'registered' }, { $set: { status: 'checked_in', checkedInAt: new Date() } }, { new: true });
    if (!claimed) {
      const now = await DriveRegistration.findById(reg._id).lean();
      return res.json({ already: true, name: reg.name, tokenNumber: now?.tokenNumber, status: now?.status });
    }
    const upd = await WalkInDrive.findByIdAndUpdate(d._id, { $inc: { nextToken: 1 } }, { new: false });
    claimed.tokenNumber = upd.nextToken;
    await claimed.save();
    res.json({ name: claimed.name, tokenNumber: claimed.tokenNumber, slot: claimed.slot, status: claimed.status, limits: undefined });
  } catch (err) { return fail(res, err, 'check-in'); }
};

const RESULT_STATUSES = ['shortlisted', 'selected', 'on_hold', 'not_selected'];
const updateRegistration = async (req, res) => {
  try {
    const d = await mine(req); if (!d) return res.status(404).json({ msg: 'Drive not found' });
    if (!HEX.test(req.params.regId || '')) return res.status(404).json({ msg: 'Not found' });
    const reg = await DriveRegistration.findOne({ _id: req.params.regId, drive: d._id });
    if (!reg) return res.status(404).json({ msg: 'Not found' });
    if (reg.status === 'registered') return res.status(400).json({ msg: 'Check the person in first' });
    const status = req.body?.status;
    if (!RESULT_STATUSES.includes(status)) return res.status(400).json({ msg: 'Choose shortlisted, selected, on hold or not selected' });
    reg.status = status; reg.note = R.str(req.body?.note, 300);
    if (status === 'selected' && req.body?.joiningDate) { const j = new Date(req.body.joiningDate); if (!Number.isNaN(j.getTime())) reg.joiningDate = j; }
    await reg.save();
    res.json({ id: reg._id, status: reg.status, joiningDate: reg.joiningDate });
  } catch (err) { return fail(res, err, 'update'); }
};

// Ask for extra features on a drive. Allowed on every plan, free included. Nothing is active until an admin marks it paid.
const requestAddon = async (req, res) => {
  try {
    const d = await mine(req); if (!d) return res.status(404).json({ msg: 'Drive not found' });
    if (['rejected', 'closed'].includes(d.status)) return res.status(400).json({ msg: 'This drive can no longer be changed' });
    const key = req.body?.key; if (!cfg.ADDONS[key]) return res.status(400).json({ msg: 'Unknown add-on' });
    const qty = Math.min(50, Math.max(1, Math.floor(Number(req.body?.qty)) || 1));
    const open = d.addons.find((a) => a.key === key && !a.paid);
    if (open) open.qty = qty; else d.addons.push({ key, qty });
    await d.save();
    res.status(201).json({ quote: cfg.quote(d), msg: 'Added. It starts working once we confirm your payment.' });
  } catch (err) { return fail(res, err, 'addon'); }
};

// Emails job seekers living in the drive's city, up to the plan's invite limit (plus paid add-ons). Never to people who unsubscribed.
const inviteSeekers = async (req, res) => {
  try {
    const d = await mine(req); if (!d) return res.status(404).json({ msg: 'Drive not found' });
    if (d.status !== 'published') return res.status(400).json({ msg: 'Only a live drive can send invites' });
    const left = cfg.effectiveLimits(d).inviteLimit - d.invitedUsers.length;
    if (left <= 0) return res.status(403).json({ msg: 'No invites left. Add the invites add-on to send more.' });
    const city = R.str(d.venue?.city, 60);
    if (!city) return res.status(400).json({ msg: 'Add the city of the venue to invite nearby job seekers' });
    const people = await User.find({
      role: 'jobseeker', isVerified: true, isAdminBlocked: { $ne: true }, 'emailPrefs.marketingOptOut': { $ne: true },
      email: { $not: /\.portal$/i }, 'profile.location': new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), _id: { $nin: d.invitedUsers },
    }).select('name email').limit(left);
    for (const u of people) {
      const unsub = unsubscribeLink(u._id);
      await mail(u.email, `Walk-in drive near you: ${d.title}`, 'A walk-in drive near you',
        `<p>Hi ${esc(u.name)},</p><p><b>${esc(d.title)}</b> by ${esc(d.organiserName)} on ${new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })} in ${esc(city)}.</p><p><a href="${driveUrl(d)}">See details and register free</a></p>${unsub ? `<p style="font-size:11px"><a href="${unsub}">Unsubscribe from these mails</a></p>` : ''}`);
      d.invitedUsers.push(u._id);
    }
    await d.save();
    res.json({ sent: people.length, left: left - people.length });
  } catch (err) { return fail(res, err, 'invite'); }
};

const sendThanks = async (req, res) => {
  try {
    const d = await mine(req); if (!d) return res.status(404).json({ msg: 'Drive not found' });
    if (d.thankYouSentAt) return res.status(400).json({ msg: 'Thank-you messages were already sent' });
    if (new Date(d.date) > new Date()) return res.status(400).json({ msg: 'You can send these after the drive' });
    const regs = await DriveRegistration.find({ drive: d._id, status: { $ne: 'registered' }, email: { $ne: '' } });
    for (const r of regs) {
      const line = r.status === 'selected' ? `Good news: you were selected${r.joiningDate ? `. Joining date: ${new Date(r.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })}` : ''}.` : r.status === 'not_selected' ? 'We could not select you this time. Keep applying, there are new jobs on Velaivaaipu every day.' : 'Thank you for coming. The team will contact you about the next step.';
      mail(r.email, `Thank you for attending ${d.title}`, 'Thank you for attending', `<p>Hi ${esc(r.name)},</p><p>${esc(line)}</p><p><a href="${siteUrl()}/jobs">See more jobs</a></p>`);
    }
    d.thankYouSentAt = new Date(); await d.save();
    res.json({ sent: regs.length });
  } catch (err) { return fail(res, err, 'thanks'); }
};

const report = async (req, res) => {
  try {
    const d = await mine(req); if (!d) return res.status(404).json({ msg: 'Drive not found' });
    const limits = cfg.effectiveLimits(d);
    const regs = await DriveRegistration.find({ drive: d._id }).sort({ createdAt: 1 });
    const summary = R.summarise(regs);
    const out = { summary };
    if (limits.fullReport) {
      const bySlot = {}; regs.forEach((r) => { const s = (bySlot[r.slot] ||= { registered: 0, attended: 0 }); s.registered++; if (r.status !== 'registered') s.attended++; });
      out.bySlot = bySlot;
    }
    if (limits.costPerHire) out.costPerHire = cfg.costPerHire(d, summary.selected);
    if (req.query.format === 'csv') {
      if (!limits.fullReport) return res.status(403).json({ msg: 'The full report is part of Drive Plus, or add it for Rs 99.' });
      const rows = [['Name', 'Phone', 'Email', 'Slot', 'Status', 'Token', 'Joining date', 'Note'], ...regs.map((r) => [r.name, r.phone, r.email, r.slot, R.STATUS_WORDS[r.status], r.tokenNumber || '', r.joiningDate ? new Date(r.joiningDate).toISOString().slice(0, 10) : '', r.note])];
      res.set('Content-Type', 'text/csv; charset=utf-8').set('Content-Disposition', 'attachment; filename="drive-report.csv"');
      return res.send(R.toCsv(rows));
    }
    res.json(out);
  } catch (err) { return fail(res, err, 'report'); }
};

// ---------- Admin (super admin only; routes sit behind the admin gate) ----------
const adminListDrives = async (req, res) => {
  try {
    const filter = ['pending_approval', 'published', 'rejected', 'closed'].includes(req.query.status) ? { status: req.query.status } : {};
    const drives = await WalkInDrive.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(drives.map((d) => ({ id: d._id, title: d.title, organiserName: d.organiserName, date: d.date, status: d.status, plan: d.plan, paid: d.paid, adminNote: d.adminNote, venue: d.venue, roles: d.roles, quote: cfg.quote(d), createdAt: d.createdAt })));
  } catch (err) { return fail(res, err, 'admin list'); }
};

// Approve or reject. A paid plan or paid add-on must be marked paid before approval.
const reviewDrive = async (req, res) => {
  try {
    const d = HEX.test(req.params.id || '') ? await WalkInDrive.findById(req.params.id) : null;
    if (!d) return res.status(404).json({ msg: 'Drive not found' });
    const decision = req.body?.decision; const note = R.str(req.body?.note, 300);
    if (!['approve', 'reject'].includes(decision)) return res.status(400).json({ msg: 'Choose approve or reject' });
    if (decision === 'reject' && !note) return res.status(400).json({ msg: 'Please write a reason for the organiser' });
    if (decision === 'approve') {
      if (cfg.PLANS[d.plan].price > 0 && !d.paid) return res.status(400).json({ msg: 'Mark the plan as paid before approving' });
      if (d.addons.some((a) => !a.paid) && req.body?.ignoreUnpaidAddons !== true) return res.status(400).json({ msg: 'Some add-ons are not paid yet. Mark them paid, or approve again choosing to continue without them.' });
    }
    d.status = decision === 'approve' ? 'published' : 'rejected'; d.adminNote = note; d.reviewedAt = new Date();
    await d.save();
    const org = await User.findById(d.organiser).select('email');
    mail(org?.email, decision === 'approve' ? `Your drive is live: ${d.title}` : `About your drive: ${d.title}`, decision === 'approve' ? 'Your drive is live' : 'Your drive was not approved',
      decision === 'approve' ? `<p>Your drive <b>${esc(d.title)}</b> is now live.</p><p>Share this link: <a href="${driveUrl(d)}">${driveUrl(d)}</a></p>` : `<p>We could not approve <b>${esc(d.title)}</b>.</p><p>Reason: ${esc(note)}</p>`);
    res.json({ id: d._id, status: d.status });
  } catch (err) { return fail(res, err, 'review'); }
};

// Mark the plan (key 'plan') or one add-on as paid, by hand, with a note such as a UPI reference.
const markPaid = async (req, res) => {
  try {
    const d = HEX.test(req.params.id || '') ? await WalkInDrive.findById(req.params.id) : null;
    if (!d) return res.status(404).json({ msg: 'Drive not found' });
    const key = req.body?.key; const note = R.str(req.body?.note, 200);
    if (!note) return res.status(400).json({ msg: 'Please note how it was paid, for example the UPI reference' });
    if (key === 'plan') { d.paid = true; d.paidAt = new Date(); d.paymentNote = note; }
    else { const a = d.addons.find((x) => x.key === key); if (!a) return res.status(404).json({ msg: 'Add-on not found on this drive' }); a.paid = true; a.paidAt = new Date(); a.paymentNote = note; }
    await d.save();
    res.json({ quote: cfg.quote(d) });
  } catch (err) { return fail(res, err, 'mark paid'); }
};

module.exports = { listDrives, getDrive, driveQr, registerForDrive, getRegistration, registrationQr, createDrive, myDrives, manageDrive, inviteSeekers, checkIn, updateRegistration, requestAddon, sendThanks, report, adminListDrives, reviewDrive, markPaid };
