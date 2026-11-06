// Admin: see and raise employers' active-job limits without a payment.
//   GET  /api/admin/job-limits          list recruiter and company accounts with their limit and active jobs
//   POST /api/admin/job-limits/grant    raise selected accounts (or every employer account) to at least `limit` active jobs
// Every raise writes a record (who asked, when, why) to the joblimitgrants collection.
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Job = require('../models/Job');
const Admin = require('../models/Admin');
const { planGrant, applyGrant } = require('../utils/jobLimitGrant');

const PAGE_SIZE = 25;
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const employerRoleIds = async () => (await Role.find({ name: { $in: ['recruiter', 'company'] } }).select('_id')).map((r) => r._id);

// @route GET /api/admin/job-limits?search=&page=
const listJobLimits = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const query = { role: { $in: await employerRoleIds() } };
    const search = String(req.query.search || '').trim().slice(0, 80);
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      query.$or = [{ name: rx }, { email: rx }];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE)
      .populate('role').populate('subscription');
    const rows = [];
    for (const user of users) {
      const g = await planGrant(user, 0);
      const activeJobs = await Job.countDocuments({ status: 'active', $or: [{ recruiter: user._id }, ...(user.company ? [{ company: user.company }] : [])] });
      rows.push({
        _id: user._id, name: user.name, email: user.email, role: user.role?.name,
        plan: user.subscription?.name || 'Free', planLimit: g.planLimit, extra: g.existingExtra,
        unlimited: !!g.unlimited, total: g.unlimited ? null : g.current, activeJobs,
      });
    }
    res.json({ users: rows, total, page, pageSize: PAGE_SIZE });
  } catch (err) {
    console.error('List Job Limits Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const actorLabel = async (id) => {
  const admin = await Admin.findById(id).select('email name');
  if (admin) return admin.email || admin.name;
  const user = await User.findById(id).select('email name');
  return user?.email || user?.name || String(id);
};

// @route POST /api/admin/job-limits/grant
// body: { userIds: [..] | allEmployers: true, confirm: 'ALL' (only with allEmployers), limit, days, note }
// `limit` is the TOTAL number of active jobs each account may have. Accounts that already allow that many are left alone.
const grantJobLimits = async (req, res) => {
  try {
    const { userIds, allEmployers, confirm } = req.body || {};
    const limit = Number(req.body?.limit);
    const days = req.body?.days === undefined ? 365 : Number(req.body.days);
    const note = String(req.body?.note || '').trim();

    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) return res.status(400).json({ msg: 'limit must be a whole number from 1 to 1000' });
    if (!Number.isInteger(days) || days < 1 || days > 730) return res.status(400).json({ msg: 'days must be a whole number from 1 to 730' });
    if (note.length < 3) return res.status(400).json({ msg: 'Please say why (a short note is required).' });
    if (allEmployers && confirm !== 'ALL') return res.status(400).json({ msg: 'To raise every employer account, send confirm: "ALL".' });
    if (!allEmployers && (!Array.isArray(userIds) || !userIds.length)) return res.status(400).json({ msg: 'Choose at least one account.' });
    if (!allEmployers && userIds.length > 500) return res.status(400).json({ msg: 'Choose at most 500 accounts at a time.' });
    if (!allEmployers && userIds.some((id) => !mongoose.isValidObjectId(id))) return res.status(400).json({ msg: 'One of the account ids is not valid.' });

    const filter = allEmployers ? { role: { $in: await employerRoleIds() } } : { _id: { $in: userIds } };
    const users = await User.find(filter).populate('role').populate('subscription');
    const by = await actorLabel(req.user.id);
    const now = new Date();
    const summary = { requested: allEmployers ? users.length : userIds.length, raised: 0, alreadyEnough: 0, unlimited: 0, skipped: 0 };
    const records = [];

    for (const user of users) {
      const g = await planGrant(user, limit, now);
      if (!g.eligible) { summary.skipped += 1; continue; }
      if (g.unlimited) { summary.unlimited += 1; continue; }
      if (g.extra <= 0) { summary.alreadyEnough += 1; continue; }
      const expiresAt = await applyGrant(user, g.extra, days, now);
      summary.raised += 1;
      records.push({ user: user._id, email: user.email, limit, extraAdded: g.extra, previousTotal: g.current, expiresAt, requestedBy: by, note, at: now, source: 'admin screen' });
    }
    if (records.length) await mongoose.connection.db.collection('joblimitgrants').insertMany(records);
    if (!allEmployers) summary.skipped += userIds.length - users.length; // ids that match no account

    res.json({ success: true, limit, days, ...summary });
  } catch (err) {
    console.error('Grant Job Limits Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { listJobLimits, grantJobLimits };
