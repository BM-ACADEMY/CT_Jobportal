// Fills and reads the campus question bank. Generation uses the same OpenRouter-backed helper as the other AI features.
const CampusQuestionSet = require('../models/CampusQuestionSet');
const { GoogleGenerativeAI } = require('./aiHelper');
const { getCategory } = require('../config/courseMap');
const { normalizeSet, QUESTIONS_PER_SET } = require('./campusTest');

const buildPrompt = (label) => `
You write skill-test questions for Indian college students applying for entry-level jobs.
Topic: ${label}
Write exactly ${QUESTIONS_PER_SET} multiple-choice questions. Basic to intermediate level, practical and job-relevant (what a fresher needs in a real office or shop), in simple English. No trick questions, no questions about specific brands' pricing.
Each question has exactly 4 options and exactly ONE correct option; the wrong options must be plausible and clearly different from each other.
Return ONLY a JSON array, no markdown. Schema:
[{"id":1,"question":"...","options":{"a":"...","b":"...","c":"...","d":"..."},"correct_option":"a","explanation":"one short sentence"}]
Random seed: ${Math.random()}`;

const { getCuratedSet } = require('../data/curatedQuestionBank');

const generateSet = async (categoryKey) => {
  const cat = getCategory(categoryKey);
  if (!cat) throw new Error('Unknown category');

  let questions = null;
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const model = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY).getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
      });
      const result = await model.generateContent(buildPrompt(cat.label));
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      questions = normalizeSet(JSON.parse(text));
    } catch (err) {
      console.warn(`[QuestionBank] AI call failed for ${cat.label} (${err.message}), using curated bank`);
    }
  }

  if (!questions) {
    const existingCount = await CampusQuestionSet.countDocuments({ category: categoryKey });
    questions = getCuratedSet(categoryKey, existingCount);
  }

  if (!questions) throw new Error('AI returned an unusable question set and no curated set available');
  return CampusQuestionSet.create({ category: categoryKey, questions });
};

const inflight = new Map(); // category -> promise, so a rush of students triggers one generation, not hundreds

// Random active set for a category. If the bank is empty, generate one set (shared by everyone waiting).
const pickSet = async (categoryKey) => {
  const count = await CampusQuestionSet.countDocuments({ category: categoryKey, active: true });
  if (count > 0) {
    const [set] = await CampusQuestionSet.find({ category: categoryKey, active: true }).skip(Math.floor(Math.random() * count)).limit(1);
    if (set) return set;
  }
  if (!inflight.has(categoryKey)) {
    inflight.set(categoryKey, generateSet(categoryKey).finally(() => inflight.delete(categoryKey)));
  }
  return inflight.get(categoryKey);
};

module.exports = { generateSet, pickSet, buildPrompt };
