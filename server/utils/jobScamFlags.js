// Flags job text that looks like a scam, so an admin can review it. It never blocks or hides a job:
// a flag only puts the job in the admin's "Needs review" count.
// Words that make a mention harmless: "no registration fee", "zero deposit", "free training".
const { inappropriateText } = require('./contentFlags');
const SAFE_BEFORE = /(?:\bno|\bzero|\bwithout|\bnot|\bnil|\bfree of|\bnever)\W+(?:\w+\W+){0,2}$/i;

const PAY_TO_APPLY = /\b(registration|joining|training|security|processing|application|verification|kit|uniform|laptop|id\s*card)\s+(fees?|charges?|deposit|amount)\b|\bpay\s+(?:rs\.?|inr|₹)\s*\d+|\brefundable\s+deposit\b|\bsend\s+money\b/gi;
const PRIVATE_CHAT = /\btelegram\b|\bshare\s+(?:your\s+)?otp\b|\bsend\s+(?:your\s+)?otp\b|\batm\s+(?:card|pin)\b|\bbank\s+(?:account\s+)?(?:details|password)\b/i;
const TOO_GOOD = /\bearn\s*(?:rs\.?|inr|₹)?\s*\d{4,}\s*(?:per|\/|a)\s*(?:day|hour)\b|\bno\s+experience\b[^.]{0,60}\b(?:lakh|lakhs)\b/i;

const hasUnsafeMatch = (text, regex) => {
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
  let m;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(Math.max(0, m.index - 30), m.index);
    if (!SAFE_BEFORE.test(before)) return true;
    if (m[0].length === 0) re.lastIndex += 1;
  }
  return false;
};

const jobScamFlags = ({ title, description } = {}) => {
  const text = `${title || ''}\n${String(description || '').replace(/<[^>]*>/g, ' ')}`.replace(/\s+/g, ' ');
  const flags = [];
  if (hasUnsafeMatch(text, PAY_TO_APPLY)) flags.push('asks_for_money');
  if (hasUnsafeMatch(text, PRIVATE_CHAT)) flags.push('private_chat_or_otp');
  if (hasUnsafeMatch(text, TOO_GOOD)) flags.push('pay_too_good');
  if (inappropriateText(text)) flags.push('inappropriate_content');
  return flags;
};

module.exports = { jobScamFlags };
