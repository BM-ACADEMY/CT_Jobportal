// Welcome, receipt and job-alert emails, plus the signed links used for one-click alert opt-in/out.
const jwt = require('jsonwebtoken');
const sendEmail = require('./sendEmail');
const { emailWrapper } = require('./emailTemplates');
const { getJwtSecret } = require('../config/jwt');

const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const frontend = () => (process.env.FRONTEND_URL || '').replace(/\/$/, '');
const apiBase = () => (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
const inr = (n) => `Rs ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const button = (href, label) =>
  `<p style="margin:20px 0;"><a href="${esc(href)}" style="background:#059669;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px;display:inline-block;">${esc(label)}</a></p>`;

// ---- signed one-click links (no login needed). Purpose-bound so they cannot be used as login tokens.
const signAlertToken = (userId, action) =>
  jwt.sign({ uid: String(userId), purpose: 'email-prefs', action }, getJwtSecret(), { expiresIn: '90d' });

const verifyAlertToken = (token) => {
  try {
    const p = jwt.verify(String(token || ''), getJwtSecret());
    if (p.purpose !== 'email-prefs' || !p.uid || !['off'].includes(p.action)) return null;
    return p;
  } catch { return null; }
};

const unsubscribeLink = (userId) => (userId && apiBase() ? `${apiBase()}/api/public/unsubscribe?token=${signAlertToken(userId, 'off')}` : '');

// ---- welcome
const FIRST_STEP = {
  jobseeker: { text: 'Complete your profile and upload your resume so employers and our job matching can find you.', path: '/candidate/settings', label: 'Complete my profile' },
  recruiter: { text: 'Post your first job; it goes live on your public page and in search.', path: '/company/jobs/new', label: 'Post my first job' },
  company: { text: 'Add your company details and post your first job.', path: '/company/jobs/new', label: 'Post my first job' },
  college: { text: 'Create your first campus drive and share the QR code with students. They join with just a WhatsApp number.', path: '/college/dashboard', label: 'Go to my dashboard' },
};

const sendWelcomeEmail = async (user, roleName) => {
  if (!user?.email || /\.portal$/i.test(user.email)) return false;
  const step = FIRST_STEP[roleName] || FIRST_STEP.jobseeker;
  return sendEmail({
    email: user.email,
    subject: 'Welcome to Velaivaaipu',
    html: emailWrapper('Welcome to Velaivaaipu', `
      <p>Hi ${esc(user.name || 'there')},</p>
      <p>Your account is ready. Your first step:</p>
      <p>${esc(step.text)}</p>
      ${frontend() ? button(`${frontend()}${step.path}`, step.label) : ''}
      <p style="font-size:13px;color:#475569;">Need help? Write to support@velaivaaipu.in.</p>
    `),
  }).then(() => true).catch(() => false);
};

// ---- receipt (GST breakdown). `payment` carries amount, baseAmount, gstAmount, gstPercentage.
const sendReceiptEmail = async ({ user, itemName, payment, validUntil, paymentId, isRenewal = false }) => {
  if (!user?.email || /\.portal$/i.test(user.email)) return false;
  const rows = [
    ['Item', esc(itemName)],
    ['Amount before GST', inr(payment.baseAmount)],
    [`GST (${Number(payment.gstPercentage || 0)}%)`, inr(payment.gstAmount)],
    ['Total paid', `<strong>${inr(payment.amount)}</strong>`],
  ];
  if (validUntil) rows.push(['Valid until', esc(validUntil)]);
  if (paymentId) rows.push(['Payment ID', esc(paymentId)]);
  return sendEmail({
    email: user.email,
    subject: `${isRenewal ? 'Renewal receipt' : 'Payment receipt'}: ${itemName}`,
    html: emailWrapper(isRenewal ? 'Renewal Successful' : 'Payment Successful', `
      <p>Hi ${esc(user.name || 'there')},</p>
      <p>Thank you. Here is your receipt.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows.map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;">${k}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${v}</td></tr>`).join('')}
      </table>
      <p style="font-size:12px;color:#64748b;margin-top:16px;">Sold by ${esc(process.env.FOOTER_ENTITY || 'Afra Ventures Private Limited')}, ${esc(process.env.FOOTER_ADDRESS || '78 Lenin St, Kosapalayam, Puducherry 605013')}${(process.env.GSTIN || '34ABGCA7083D1ZS') ? `. GSTIN ${esc(process.env.GSTIN || '34ABGCA7083D1ZS')}` : ''}.</p>
      <p style="font-size:13px;color:#475569;margin-top:8px;">Refunds follow our <a href="${esc(frontend())}/refund-policy" style="color:#059669;">Refund policy</a> (24 hours, nothing used). Questions: support@velaivaaipu.in.</p>
    `),
  }).then(() => true).catch(() => false);
};

// Wrapper for non-transactional mail: brand footer with address and a one-click unsubscribe (never sent without one).
const lifecycleWrapper = (title, bodyHtml, userId) => {
  const unsub = unsubscribeLink(userId);
  const entity = process.env.FOOTER_ENTITY || 'Afra Ventures Private Limited';
  const address = process.env.FOOTER_ADDRESS || '78 Lenin St, Kosapalayam, Puducherry 605013';
  const phone = process.env.FOOTER_PHONE || '';
  return `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #0f172a; padding: 20px 24px; border-radius: 12px 12px 0 0;"><span style="color: #10b981; font-weight: 900; font-size: 18px;">Velaivaaipu</span></div>
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
    <h2 style="margin-top: 0; color: #0f172a; font-size: 18px;">${esc(title)}</h2>
    ${bodyHtml}
  </div>
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px; line-height: 1.5;">
    ${esc(entity)}${address ? `, ${esc(address)}` : ''}${phone ? ` &middot; ${esc(phone)}` : ''}<br/>
    You get this because you have a Velaivaaipu account. ${unsub ? `<a href="${esc(unsub)}" style="color:#94a3b8;">Unsubscribe</a>` : ''}
  </p>
</div>`;
};

// Headers that make Gmail / Yahoo show their own "Unsubscribe" button (required for bulk senders).
const unsubscribeHeaders = (userId) => {
  const url = unsubscribeLink(userId);
  if (!url) return undefined;
  return { 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
};

module.exports = { unsubscribeHeaders, lifecycleWrapper, sendWelcomeEmail, sendReceiptEmail, signAlertToken, verifyAlertToken, unsubscribeLink, button, esc, frontend, apiBase };
