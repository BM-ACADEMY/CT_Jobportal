// Emails the Monday advisor note to the Super Admin(s). Pure builders plus a sender with injectable parts so it can be tested.
// Models and the mail sender are required lazily, so this file loads without a database.
const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const STATUS_WORD = { green: 'good', amber: 'watch', red: 'needs attention' };

const buildAdvisorMail = (report, { frontendUrl = '' } = {}) => {
  const r = report && typeof report.toObject === 'function' ? report.toObject() : (report || {});
  const metrics = Array.isArray(r.metrics) ? r.metrics : [];
  const rows = metrics.map((m) => `<tr><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">${esc(m.label || m.key)}</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;text-align:right"><strong>${esc(m.value ?? 0)}</strong>${m.previous != null ? ` <span style="color:#64748b">(last week ${esc(m.previous)})</span>` : ''}</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">${esc(STATUS_WORD[m.status] || m.status || '')}</td></tr>`).join('');
  const list = (title, arr) => (Array.isArray(arr) && arr.length ? `<p><strong>${title}</strong></p><ul style="padding-left:18px;margin:4px 0">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
  const base = String(frontendUrl || '').replace(/\/$/, '');
  const html = `${r.summary ? `<p>${esc(r.summary)}</p>` : '<p>This week\'s numbers are below.</p>'}
    ${rows ? `<table style="border-collapse:collapse;width:100%;font-size:13px">${rows}</table>` : ''}
    ${list('Going well', r.good)}${list('Needs attention', r.bad)}
    ${r.aiError ? `<p style="color:#64748b;font-size:12px">${esc(r.aiError)}</p>` : ''}
    ${base ? `<p><a href="${base}/admin/advisor" style="color:#059669;">Open the Advisor</a></p>` : ''}`;
  return { subject: '[Velaivaaipu] Your Monday business note', title: 'Your Monday business note', html };
};

// Super Admin addresses: Admin-panel accounts plus users holding the admin role. Never throws; [] when none.
const superAdminEmails = async (deps = {}) => {
  try {
    const Admin = deps.Admin || require('../models/Admin');
    const User = deps.User || require('../models/User');
    const Role = deps.Role || require('../models/Role');
    const admins = await Admin.find({ role: 'admin' }).select('email').lean();
    const roleDoc = await Role.findOne({ name: 'admin' }).select('_id').lean();
    const users = roleDoc ? await User.find({ role: roleDoc._id, isAdminBlocked: { $ne: true } }).select('email').lean() : [];
    return [...new Set([...admins, ...users].map((a) => String(a.email || '').trim().toLowerCase()).filter((e) => e && !/\.portal$/.test(e)))];
  } catch (e) { console.error('[Advisor] could not list Super Admins:', e.message); return []; }
};

const emailAdvisorNote = async (report, { env = process.env, recipients, send, deps } = {}) => {
  if (env.ADVISOR_ENABLED !== 'true' || !report) return { sent: 0, skipped: true };
  const to = recipients || await superAdminEmails(deps);
  if (!to.length) return { sent: 0, noRecipients: true };
  const mailer = send || require('./sendEmail');
  const { emailWrapper } = require('./emailTemplates');
  const mail = buildAdvisorMail(report, { frontendUrl: env.FRONTEND_URL });
  let sent = 0;
  for (const email of to) {
    try { if ((await mailer({ email, subject: mail.subject, html: emailWrapper(esc(mail.title), mail.html) })) !== false) sent += 1; }
    catch (e) { console.error('[Advisor] note email failed:', e.message); }
  }
  return { sent };
};

module.exports = { buildAdvisorMail, superAdminEmails, emailAdvisorNote };
