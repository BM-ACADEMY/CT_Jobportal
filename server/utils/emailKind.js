// Is this a company address on its own website, or a free personal inbox? A hint for the person verifying a company.
// Never blocks anyone: many small businesses use Gmail honestly, and a bought domain proves little. Verification stays the gate.
const PERSONAL = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.in', 'yahoo.co.in', 'ymail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'rediffmail.com', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com', 'aol.com', 'zoho.com', 'mail.com', 'gmx.com']);

const hostOf = (site) => {
  const s = String(site || '').trim().toLowerCase();
  if (!s) return '';
  try { return new URL(/^https?:\/\//.test(s) ? s : `https://${s}`).hostname.replace(/^www\./, ''); } catch { return ''; }
};

const emailKind = (email, website) => {
  const at = String(email || '').trim().toLowerCase().split('@');
  const domain = at.length === 2 ? at[1] : '';
  if (!domain || !domain.includes('.')) return { kind: 'missing', matchesWebsite: false };
  if (PERSONAL.has(domain)) return { kind: 'personal', matchesWebsite: false };
  const host = hostOf(website);
  return { kind: 'official', matchesWebsite: !!host && (host === domain || host.endsWith(`.${domain}`) || domain.endsWith(`.${host}`)) };
};

const COMPANY_ROLES = ['recruiter', 'company'];
const isPersonalEmail = (email) => emailKind(email, '').kind === 'personal';
// Companies and recruiters sign up with their company email. Free inboxes (Gmail, Yahoo...) are not accepted for them.
const COMPANY_EMAIL_MSG = 'Please sign up with your company email address (like name@yourcompany.com). Gmail, Yahoo and other free email addresses are not accepted for companies and recruiters. Job seekers and colleges can use any email.';
const blocksCompanySignup = (role, email) => COMPANY_ROLES.includes(role) && isPersonalEmail(email);

module.exports = { emailKind, hostOf, isPersonalEmail, blocksCompanySignup, COMPANY_EMAIL_MSG };
