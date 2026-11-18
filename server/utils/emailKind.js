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

const isPersonalEmail = (email) => emailKind(email, '').kind === 'personal';

module.exports = { emailKind, hostOf, isPersonalEmail };
