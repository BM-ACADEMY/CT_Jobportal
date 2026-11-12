const { cleanPhone } = require('./driveRules');
const HEX = /^[0-9a-fA-F]{24}$/;

// An invite code is just the inviter's account id from the link. Anything else is ignored.
// A pasted invite link or a code with spaces around it is accepted too.
const cleanReferrer = (raw) => {
  if (typeof raw !== 'string') return '';
  const s = raw.trim();
  if (HEX.test(s)) return s;
  const m = /[?&]ref=([0-9a-fA-F]{24})(?![0-9a-fA-F])/.exec(s);
  return m ? m[1] : '';
};

// WhatsApp opt-in: needs a real mobile number. Returns { number } or { error }.
const optInNumber = (bodyNumber, profilePhone) => {
  const n = cleanPhone(bodyNumber) || cleanPhone(profilePhone);
  return n ? { number: n } : { error: 'Please add a valid 10-digit mobile number first' };
};

const inviteLink = (userId, base) => `${String(base || 'https://velaivaaipu.in').replace(/\/$/, '')}/register?role=jobseeker&ref=${userId}`;

module.exports = { cleanReferrer, optInNumber, inviteLink };
