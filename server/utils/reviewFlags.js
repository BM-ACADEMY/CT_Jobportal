// Quick checks on a review's words so a person looks twice before it goes on the home page.
// It never rejects anything: it only returns reasons to look again.
const LABELS = {
  too_short: 'Very short',
  has_link: 'Has a link',
  has_phone: 'Has a phone number',
  looks_like_advert: 'Looks like a job advert',
  repeated: 'Repeated words'
};

const ADVERT_WORDS = /\b(hiring|vacanc(?:y|ies)|apply\s+now|walk-?in|interview\s+on|salary\s+(?:up\s*to|\d)|contact\s+(?:us|me)|whats\s?app|call\s+now|join\s+(?:us|now)|openings?\s+for|work\s+from\s+home\s+jobs?)\b/i;

const reviewFlags = (comment) => {
  const text = String(comment || '').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const flags = [];
  if (words.length < 5) flags.push('too_short');
  if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|in|net|org|co)\b)/i.test(text)) flags.push('has_link');
  if (/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/.test(text)) flags.push('has_phone');
  if (ADVERT_WORDS.test(text)) flags.push('looks_like_advert');
  const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean));
  if (words.length >= 4 && unique.size <= Math.ceil(words.length / 3)) flags.push('repeated');
  return flags;
};

module.exports = { reviewFlags, LABELS };
