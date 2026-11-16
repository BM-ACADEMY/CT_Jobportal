const { cleanPhone } = require('./driveRules');
const HEX = /^[0-9a-fA-F]{24}$/;

// An invite code is just the inviter's account id from the link. Anything else is ignored.
const cleanReferrer = (raw) => (typeof raw === 'string' && HEX.test(raw) ? raw : '');

// WhatsApp opt-in: needs a real mobile number. Returns { number } or { error }.
const optInNumber = (bodyNumber, profilePhone) => {
  const n = cleanPhone(bodyNumber) || cleanPhone(profilePhone);
  return n ? { number: n } : { error: 'Please add a valid 10-digit mobile number first' };
};

const inviteLink = (userId, base) => `${String(base || 'https://velaivaaipu.in').replace(/\/$/, '')}/register?role=jobseeker&ref=${userId}`;

module.exports = { cleanReferrer, optInNumber, inviteLink };
