// Colleges that registered but are still waiting get one polite mail after 2 days asking for the details we need
// (their name, role and a phone number). Pure, so it can be tested.
const DAY = 86400000;
const AFTER_DAYS = 2;
const keyFor = (college) => `college-role-ask:${college._id}`;

const ROLE_ASK = 'Thanks for registering your college on Velaivaaipu. To finish verifying it, please reply with your name, your role at the college (TPO, Principal or other) and the best phone number to reach you. No documents are needed.';

// Returns the colleges to ask now: pending, not a test college, 2+ days old, never asked, and reachable by email.
const pickCollegesToAsk = (colleges, sentKeys = new Set(), now = new Date()) => (colleges || []).filter((c) => (
  c && c.verificationStatus === 'pending' && c.isTest !== true
  && now.getTime() - new Date(c.createdAt).getTime() >= AFTER_DAYS * DAY
  && !(c.infoRequests || []).length
  && !sentKeys.has(keyFor(c))
  && (c.principalEmail || c.tpoUser?.email || c.collegeEmail)
));

module.exports = { pickCollegesToAsk, keyFor, ROLE_ASK, AFTER_DAYS };
