// Campus skill test helpers: validate AI output, hide answers, issue/verify attempt tokens, score on the server.
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwt');

const LETTERS = ['a', 'b', 'c', 'd'];
const QUESTIONS_PER_SET = 10;
const MIN_SECONDS_PER_QUESTION = 2; // faster than this is a script, not a student
const ATTEMPT_TTL = '2h';

const clean = (v, max = 400) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

// Validates raw AI output and returns normalised questions with the options shuffled, or null if unusable.
const normalizeSet = (raw, rng = Math.random) => {
  if (!Array.isArray(raw) || raw.length < QUESTIONS_PER_SET) return null;
  const out = [];
  for (const item of raw.slice(0, QUESTIONS_PER_SET)) {
    const opts = item?.options;
    const correct = String(item?.correct_option || '').toLowerCase();
    if (!item?.question || !opts || !LETTERS.includes(correct)) return null;
    const texts = LETTERS.map((l) => clean(opts[l], 200));
    if (texts.some((t) => !t) || new Set(texts.map((t) => t.toLowerCase())).size !== 4) return null;

    // Shuffle so the right answer is not always in the same position.
    const order = [0, 1, 2, 3];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const options = {};
    order.forEach((from, to) => { options[LETTERS[to]] = texts[from]; });
    out.push({
      id: out.length + 1,
      question: clean(item.question, 500),
      options,
      correct_option: LETTERS[order.indexOf(LETTERS.indexOf(correct))],
      explanation: clean(item.explanation, 500),
    });
  }
  return out;
};

// What the browser may see: no correct answers, no explanations.
const publicQuestions = (set) => set.questions.map((q) => ({ id: q.id, question: q.question, options: q.options }));

const signAttempt = ({ studentId, category, setId }) =>
  jwt.sign({ purpose: 'campus-test', sid: String(studentId), cat: category, set: String(setId) }, getJwtSecret(), { expiresIn: ATTEMPT_TTL });

// Returns the claims, or { error } with a reason the API can map to a status code.
const verifyAttempt = (token, { studentId, category, questionCount = QUESTIONS_PER_SET, nowMs = Date.now() }) => {
  let claims;
  try { claims = jwt.verify(String(token || ''), getJwtSecret()); } catch { return { error: 'invalid' }; }
  if (claims.purpose !== 'campus-test' || claims.sid !== String(studentId) || claims.cat !== category) return { error: 'mismatch' };
  if (nowMs - claims.iat * 1000 < questionCount * MIN_SECONDS_PER_QUESTION * 1000) return { error: 'too_fast' };
  return { claims };
};

// answers: { "<questionId>": "a" | "b" | "c" | "d" }
const scoreAttempt = (set, answers) => {
  const given = answers && typeof answers === 'object' && !Array.isArray(answers) ? answers : {};
  let score = 0;
  for (const q of set.questions) {
    if (String(given[q.id] || '').toLowerCase() === q.correct_option) score += 1;
  }
  return { score, total: set.questions.length };
};

module.exports = { normalizeSet, publicQuestions, signAttempt, verifyAttempt, scoreAttempt, QUESTIONS_PER_SET, MIN_SECONDS_PER_QUESTION };
