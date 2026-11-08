// Fills and reads the campus question bank. Generation uses the same OpenRouter-backed helper as the other AI features.
const CampusQuestionSet = require('../models/CampusQuestionSet');
const { GoogleGenerativeAI } = require('./aiHelper');
const { getFreeSkill } = require('../config/freeSkills');
const { normalizeSet, QUESTIONS_PER_SET } = require('./campusTest');

const LEVEL_TEXT = {
  easy: 'Easy level: basic terms and common sense.',
  medium: 'Basic to intermediate level.',
  hard: 'Hard level: scenario-based judgment (what should you do first, which step is most correct).',
};

const buildPrompt = (label, level = 'medium') => `
You write skill-test questions for Indian college students applying for entry-level jobs.
Topic: ${label}
Write exactly ${QUESTIONS_PER_SET} multiple-choice questions. ${LEVEL_TEXT[level] || LEVEL_TEXT.medium} Practical and job-relevant (what a fresher needs in a real office or shop), in simple English. No trick questions, no questions about specific brands' pricing.
Each question has exactly 4 options and exactly ONE correct option; the wrong options must be plausible and clearly different from each other.
Return ONLY a JSON array, no markdown. Schema:
[{"id":1,"question":"...","options":{"a":"...","b":"...","c":"...","d":"..."},"correct_option":"a","explanation":"one short sentence"}]
Random seed: ${Math.random()}`;

const { getCuratedSet, setCount } = require('../data/curatedQuestionBank');

// JSON mode makes some models wrap the list in an object, e.g. {"questions":[...]}. Accept either shape.
const unwrapQuestions = (parsed) => {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') return Object.values(parsed).find(Array.isArray) || null;
  return null;
};

const levelFilter = (level) => (level === 'medium' ? { $in: ['medium', null] } : level);

// Reviewed questions come first (no live AI call). AI writes a set only for a skill and level with no reviewed pool.
const generateSet = async (categoryKey, level = 'medium') => {
  const cat = getFreeSkill(categoryKey);
  if (!cat) throw new Error('Unknown category');

  const existingCount = await CampusQuestionSet.countDocuments({ category: categoryKey, level: levelFilter(level) });
  let questions = setCount(categoryKey, level) > 0 ? getCuratedSet(categoryKey, existingCount, level) : null;

  if (!questions && process.env.OPENROUTER_API_KEY) {
    try {
      const model = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY).getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
      });
      const result = await model.generateContent(buildPrompt(cat.label, level));
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      questions = normalizeSet(unwrapQuestions(JSON.parse(text)));
      if (!questions) console.warn(`[QuestionBank] AI output for ${cat.label} failed validation`);
    } catch (err) {
      console.warn(`[QuestionBank] AI call failed for ${cat.label} (${err.message})`);
    }
  }

  if (!questions) throw new Error('No reviewed questions and no usable AI set for this skill and level');
  return CampusQuestionSet.create({ category: categoryKey, level, questions });
};

const inflight = new Map(); // category -> promise, so a rush of students triggers one generation, not hundreds

// Random active set for a skill and level. Reviewed sets that are not saved yet are created first, so every
// 10-question slice of the pool gets used. If nothing exists, one set is generated (shared by everyone waiting).
const pickSet = async (categoryKey, level = 'medium') => {
  const where = { category: categoryKey, active: true, level: levelFilter(level) };
  let count = await CampusQuestionSet.countDocuments(where);
  const wanted = setCount(categoryKey, level);
  const key = `${categoryKey}:${level}`;
  if (count < wanted) {
    if (!inflight.has(key)) {
      inflight.set(key, (async () => { for (let i = count; i < wanted; i += 1) await generateSet(categoryKey, level); })().finally(() => inflight.delete(key)));
    }
    try { await inflight.get(key); } catch (err) { if (count === 0) throw err; }
    count = await CampusQuestionSet.countDocuments(where);
  }
  if (count > 0) {
    const [set] = await CampusQuestionSet.find(where).skip(Math.floor(Math.random() * count)).limit(1);
    if (set) return set;
  }
  if (!inflight.has(key)) {
    inflight.set(key, generateSet(categoryKey, level).finally(() => inflight.delete(key)));
  }
  return inflight.get(key);
};

module.exports = { generateSet, pickSet, buildPrompt, unwrapQuestions };
