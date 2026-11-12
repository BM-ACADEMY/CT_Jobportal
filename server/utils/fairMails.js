// Fair mails (Step 2): one mail per person per fair, per audience. OFF unless FAIR_MAILS_ENABLED=true.
// Same rules as the email autopilot: real addresses only, never to unsubscribed or blocked people, one mail a day,
// weekly cap, once-only EmailLog key, unsubscribe link and header. Heavy modules are required inside functions so tests load this file.
const { istDayStart } = require('./driveRules');

const AUDIENCES = ['seeker', 'company', 'college'];
const ROLE_NAMES = { seeker: ['jobseeker'], company: ['company', 'recruiter'], college: ['college'] };
const DAY = 86400000;

const enabled = (env = process.env) => env.FAIR_MAILS_ENABLED === 'true' && !!env.FRONTEND_URL && !!env.API_PUBLIC_URL;
const maxPerClick = (env = process.env) => Math.max(1, Math.min(1000, Number(env.FAIR_MAILS_MAX) || 200));
// Once-only key. "fair_seeker-<id>" keeps the mail type readable in the autopilot report.
const keyFor = (audience, fairId) => `fair_${audience}-${fairId}`;

const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const first = (u) => esc(String(u?.name || 'there').split(' ')[0]);
const realEmail = (u) => !!u?.email && !/\.portal\s*$/i.test(u.email);
const optedOut = (u) => u?.emailPrefs?.marketingOptOut === true;

// Only published fairs that have not ended (the fair day itself still counts, India time).
const mailable = (fair, now = new Date()) => !!fair && fair.status === 'published' && new Date(fair.endDate || fair.date) >= istDayStart(now);

// Copy. Honest: we say who organises the fair; "Supported by" only when the fair carries that tag; no fake urgency.
const buildMail = (user, fair, audience, { frontend = '' } = {}) => {
  const url = `${frontend}/job-fairs/${fair.slug}?utm_source=email&utm_medium=lifecycle&utm_campaign=fair_${audience}`;
  const when = fair.endDate && +new Date(fair.endDate) !== +new Date(fair.date) ? `${fmtDate(fair.date)} to ${fmtDate(fair.endDate)}` : fmtDate(fair.date);
  const where = [fair.venue?.name, fair.venue?.city].filter(Boolean).join(', ');
  const org = fair.organiserName ? `Organised by ${esc(fair.organiserName)}.` : '';
  const tag = fair.supportedByUs ? ' Supported by Velaivaaipu.' : '';
  const facts = `<p><b>${esc(fair.title)}</b><br/>${esc(when)}${where ? `<br/>${esc(where)}` : ''}</p><p>${org}${tag}</p>`;
  const btn = (label) => `<p style="margin:20px 0;"><a href="${esc(url)}" style="background:#059669;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px;display:inline-block;">${esc(label)}</a></p>`;
  if (audience === 'company') {
    return {
      subject: `Job fair on ${fmtDate(fair.date)}: meet candidates`,
      title: 'A job fair you can join',
      html: `<p>Hi ${first(user)},</p>${facts}<p>Candidates attend job fairs to meet employers. See the details${fair.kind === 'own' ? ' and ask for a stall' : ''}.</p>${btn('See the fair')}`,
    };
  }
  if (audience === 'college') {
    return {
      subject: `Job fair on ${fmtDate(fair.date)} for your students`,
      title: 'A job fair for your students',
      html: `<p>Hi ${first(user)},</p>${facts}<p>Your final-year students and alumni may want to attend. Share the page with them.</p>${btn('See the fair')}`,
    };
  }
  return {
    subject: `${fair.title}: job fair on ${fmtDate(fair.date)}`,
    title: 'A job fair near you',
    html: `<p>Hi ${first(user)},</p>${facts}<p>Check the venue, the documents to bring and the official link. Tap "I am going" to get a reminder.</p>${btn('See the fair')}`,
  };
};

// Who gets the mail. Seekers are narrowed to the fair's town or district when the fair has one.
const buildUserFilter = (audience, roleIds, fair) => {
  const f = { role: { $in: roleIds }, isVerified: true, isAdminBlocked: { $ne: true }, 'emailPrefs.marketingOptOut': { $ne: true }, email: { $not: /\.portal$/i } };
  if (audience === 'seeker') {
    const places = [fair.venue?.city, fair.venue?.district].filter(Boolean).map((p) => String(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (places.length) f['profile.location'] = new RegExp(places.join('|'), 'i');
  }
  return f;
};

// deps are injectable for tests. Returns counts; never throws for one bad recipient.
const sendFairMails = async ({ fair, audience, preview = false, deps = {}, env = process.env, now = new Date() }) => {
  if (!AUDIENCES.includes(audience)) return { error: 'Choose job seekers, companies or colleges.' };
  if (!mailable(fair, now)) return { error: 'Only a published fair that has not ended can be mailed.' };
  if (!enabled(env)) return { error: 'Fair mails are switched off (FAIR_MAILS_ENABLED).' };
  const d = {
    User: deps.User || require('../models/User'),
    Role: deps.Role || require('../models/Role'),
    EmailLog: deps.EmailLog || require('../models/EmailLog'),
    sendEmail: deps.sendEmail || require('./sendEmail'),
    policy: deps.policy || require('./lifecycle/emailPolicy'),
    wrap: deps.wrap || ((m, uid) => { const l = require('./lifecycleEmails'); return { subject: m.subject, html: l.lifecycleWrapper(m.title, m.html, uid), headers: l.unsubscribeHeaders(uid) }; }),
    sleep: deps.sleep || ((ms) => new Promise((r) => setTimeout(r, ms))),
  };
  const roleIds = (await d.Role.find({ name: { $in: ROLE_NAMES[audience] } }).select('_id').lean()).map((r) => r._id);
  const users = await d.User.find(buildUserFilter(audience, roleIds, fair)).select('name email emailPrefs').limit(5000).lean();
  const key = keyFor(audience, fair._id);
  const done = new Set((await d.EmailLog.find({ key }).select('user').lean()).map((l) => String(l.user)));
  const todo = users.filter((u) => realEmail(u) && !optedOut(u) && !done.has(String(u._id)));
  if (preview) return { audience, eligible: todo.length, alreadyMailed: done.size };

  const limit = maxPerClick(env);
  const out = { audience, eligible: todo.length, sent: 0, skipped: 0, failed: 0, left: 0 };
  const from = env[`FAIR_FROM_${audience.toUpperCase()}`] || env.LIFECYCLE_FROM || '';
  for (const u of todo) {
    if (out.sent >= limit) { out.left += 1; continue; }
    try {
      if (await d.EmailLog.exists({ user: u._id, sentAt: { $gte: new Date(now.getTime() - 20 * 3600000) } })) { out.skipped += 1; continue; }
      const lastWeek = await d.EmailLog.countDocuments({ user: u._id, sentAt: { $gte: new Date(now.getTime() - 7 * DAY) }, key: { $not: /^(plan_|pay_|paid_)/ } });
      if (!d.policy.underWeeklyCap(audience, lastWeek)) { out.skipped += 1; continue; }
      try { await d.EmailLog.create({ user: u._id, key }); } catch (err) { if (err.code === 11000) { out.skipped += 1; continue; } throw err; }
      const mail = d.wrap(buildMail(u, fair, audience, { frontend: (env.FRONTEND_URL || '').replace(/\/$/, '') }), u._id);
      const ok = await d.sendEmail({ email: u.email, subject: mail.subject, html: mail.html, headers: mail.headers, ...(from ? { from } : {}) });
      if (!ok) { await d.EmailLog.deleteOne({ user: u._id, key }).catch(() => {}); out.failed += 1; continue; }
      out.sent += 1;
      await d.sleep(300);
    } catch (err) { console.error('Fair mail error:', err.message); out.failed += 1; }
  }
  return out;
};

module.exports = { AUDIENCES, enabled, keyFor, buildMail, buildUserFilter, mailable, sendFairMails, maxPerClick };
