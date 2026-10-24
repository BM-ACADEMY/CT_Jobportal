// Free (public) skill assessment: signed tokens so the server, not the browser, decides the score.
//  - start token: ties one submission to one stored question set (Assessment document).
//  - result token: proves a score the server computed; a logged-in job seeker hands it back to save the result.
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwt');
const { MIN_SECONDS_PER_QUESTION } = require('./campusTest');

const ATTEMPT_TTL = '2h';
const RESULT_TTL = '7d';
const PASS_RATIO = 0.6;

// The skill text goes into an AI prompt, so keep it short and plain (letters, digits and a few separators).
const cleanSkill = (raw) => String(raw || '').replace(/[^\p{L}\p{N}\s.+#/&-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60).toLowerCase();
const cleanDifficulty = (raw) => {
  const d = String(raw || '').toLowerCase().trim();
  return ['easy', 'medium', 'hard'].includes(d) ? d : '';
};

const signStart = ({ setId, skill, difficulty }) =>
  jwt.sign({ purpose: 'free-assessment', set: String(setId), skill, difficulty }, getJwtSecret(), { expiresIn: ATTEMPT_TTL });

const verifyStart = (token, { questionCount = 10, nowMs = Date.now() } = {}) => {
  let claims;
  try { claims = jwt.verify(String(token || ''), getJwtSecret()); } catch { return { error: 'invalid' }; }
  if (claims.purpose !== 'free-assessment' || !claims.set) return { error: 'invalid' };
  if (nowMs - claims.iat * 1000 < questionCount * MIN_SECONDS_PER_QUESTION * 1000) return { error: 'too_fast' };
  return { claims };
};

const signResult = ({ setId, skill, difficulty, score, total }) =>
  jwt.sign({ purpose: 'free-assessment-result', set: String(setId), skill, difficulty, score, total }, getJwtSecret(), { expiresIn: RESULT_TTL });

const verifyResult = (token) => {
  try {
    const claims = jwt.verify(String(token || ''), getJwtSecret());
    if (claims.purpose !== 'free-assessment-result') return null;
    return claims;
  } catch { return null; }
};

module.exports = { cleanSkill, cleanDifficulty, signStart, verifyStart, signResult, verifyResult, PASS_RATIO };
