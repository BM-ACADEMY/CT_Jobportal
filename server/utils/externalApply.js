// Jobs found on the web: the candidate applies on the employer's own site, not inside Velaivaaipu.
// Only an admin can create these (controllers/externalJobController.js). Recruiters can never set the link.
const BAD_HOST = /^(localhost|.*\.local|.*\.internal)$/i;
const SHORTENERS = /^(bit\.ly|tinyurl\.com|t\.co|goo\.gl|cutt\.ly|rb\.gy|is\.gd|ow\.ly|wa\.me|t\.me)$/i;

const cleanApplyUrl = (raw) => {
  const s = String(raw ?? '').trim();
  if (!s) return { error: 'Paste the link where candidates should apply.' };
  if (s.length > 500) return { error: 'That link is too long.' };
  let u;
  try { u = new URL(s); } catch { return { error: 'That does not look like a web link. It should start with https://' }; }
  if (u.protocol !== 'https:') return { error: 'The apply link must start with https://' };
  if (u.username || u.password) return { error: 'The link must not contain a login.' };
  const host = u.hostname.toLowerCase();
  if (BAD_HOST.test(host) || /^\d+\.\d+\.\d+\.\d+$/.test(host) || !host.includes('.')) return { error: 'Use the employer\'s real website link.' };
  if (SHORTENERS.test(host)) return { error: 'Short links are not allowed. Paste the full employer link.' };
  return { url: u.toString() };
};

const cleanExternalApply = ({ url, employerName, sourceName } = {}) => {
  const link = cleanApplyUrl(url);
  if (link.error) return { error: link.error };
  const employer = String(employerName ?? '').trim().slice(0, 120);
  if (employer.length < 2) return { error: 'Write the real employer\'s name.' };
  const source = String(sourceName ?? '').trim().slice(0, 80);
  return { data: { url: link.url, employerName: employer, sourceName: source, clicks: 0 } };
};

const isExternal = (job) => !!(job && job.externalApply && job.externalApply.url);

module.exports = { cleanApplyUrl, cleanExternalApply, isExternal };
