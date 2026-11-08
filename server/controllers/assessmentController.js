const Assessment = require('../models/Assessment');
const { GoogleGenerativeAI } = require('../utils/aiHelper');
const { normalizeSet, publicQuestions, scoreAttempt, QUESTIONS_PER_SET } = require('../utils/campusTest');
const CampusQuestionSet = require('../models/CampusQuestionSet');
const { SKILL_CATEGORIES, getCategory, PASS_RATIO: BANK_PASS_RATIO } = require('../config/courseMap');
const { pickSet } = require('../utils/questionBank');
const { levelsFor } = require('../data/curatedQuestionBank');
const { ALL_SKILLS, getFreeSkill, cleanLevel } = require('../config/freeSkills');
const { signAttempt, verifyAttempt } = require('../utils/campusTest');
const FreeTestAttempt = require('../models/FreeTestAttempt');
const { cleanSkill, cleanDifficulty, signStart, verifyStart, signResult, verifyResult, PASS_RATIO } = require('../utils/freeAssessment');

// Count every scored free test. Never blocks or fails the test if the log cannot be written.
const recordAttempt = (data) => {
  try {
    const p = FreeTestAttempt.create(data);
    if (p && typeof p.catch === 'function') p.catch((err) => console.error('Free test log failed:', err.message));
  } catch (err) { console.error('Free test log failed:', err.message); }
};

const buildPrompt = (skill, difficulty) => `
You are an expert technical interviewer and examination engine. Your task is to generate a multiple-choice skill assessment test based on the following parameters:
- Skill: ${skill}
- Difficulty: ${difficulty}
- Number of Questions: 10
- Randomization Seed: ${Math.random()}

### Difficulty Guidelines:
- Easy: Core syntax, basic concepts, and common definitions.
- Medium: Real-world implementation, debugging simple snippets, understanding edge cases.
- Hard: Optimization, advanced architectural patterns, memory management, and complex debugging.

### Output Constraints:
- Return ONLY a valid JSON array of objects.
- Do NOT include any conversational filler, intro, outro, or markdown code block formatting (like \`\`\`json). Just the raw JSON string.
- The questions should be exactly 10 questions. 
- You can include multiple choice questions, fill-in-the-blanks, and short descriptive ones. 
- For all types of questions, provide 4 options to keep the UI consistent, or structure them logically. 
- Ensure only ONE option is correct.
- The "explanation" field should briefly explain why the correct answer is right.

### JSON Schema Requirement (Array of Objects):
[
  {
    "id": 1,
    "question": "The question text goes here?",
    "options": {
      "a": "Option A text",
      "b": "Option B text",
      "c": "Option C text",
      "d": "Option D text"
    },
    "correct_option": "a",
    "explanation": "Brief explanation of the correct answer."
  }
]
`;

// Questions for the free assessment: a fresh AI set, or a cached one if the AI is unavailable. Either way the set is
// normalised (options shuffled, answer validated) and stored as its own document, so one attempt = one document.
const buildSet = async (skill, difficulty) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set in environment');
    const model = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY).getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
    });
    const resultObj = await model.generateContent(buildPrompt(skill, difficulty));
    const text = resultObj.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const questions = normalizeSet(JSON.parse(text));
    if (!questions) throw new Error('AI returned an unusable question set');
    return await Assessment.create({ skill, difficulty, questions });
  } catch (genErr) {
    console.warn('AI Assessment Generation failed (falling back to cache):', genErr.message);
    const cached = await Assessment.findOne({ skill, difficulty, 'questions.9': { $exists: true } });
    const plain = cached ? (cached.questions || []).map((q) => (q.toObject ? q.toObject() : q)) : [];
    const questions = normalizeSet(plain);
    if (!questions) return null;
    return Assessment.create({ skill, difficulty, questions });
  }
};

// @desc    Generate a skill assessment. The browser gets the questions WITHOUT answers plus a signed attempt token.
// @route   GET /api/assessments/public?skill=X&difficulty=Y
// @access  Public (rate limited)
const getAssessment = async (req, res) => {
  try {
    const skill = cleanSkill(req.query.skill);
    const difficulty = cleanDifficulty(req.query.difficulty);
    if (!skill || !difficulty) {
      return res.status(400).json({ msg: 'A skill and a difficulty (easy, medium or hard) are required.' });
    }
    const set = await buildSet(skill, difficulty);
    // Never show placeholder questions to real users.
    if (!set) return res.status(503).json({ msg: 'The test is not available right now. Please try again later.' });
    return res.json({
      msg: 'Assessment ready',
      questions: publicQuestions(set),
      attemptToken: signStart({ setId: set._id, skill, difficulty }),
    });
  } catch (err) {
    console.error('Assessment Generation Error:', err);
    res.status(500).json({ msg: 'Server error generating assessment' });
  }
};

// @desc    Score a free assessment on the server. One submission per attempt.
// @route   POST /api/assessments/public/submit   Body: { attemptToken, answers: { "<questionId>": "a" } }
// @access  Public (rate limited)
const submitPublicAssessment = async (req, res) => {
  try {
    const attempt = verifyStart(req.body?.attemptToken, { questionCount: QUESTIONS_PER_SET });
    if (attempt.error === 'too_fast') return res.status(400).json({ msg: 'That was too quick. Please read the questions and try again.' });
    if (attempt.error) return res.status(400).json({ msg: 'This test session is not valid. Please start the test again.' });

    // Claim the attempt atomically so the same questions cannot be re-scored with different guesses.
    const set = await Assessment.findOneAndUpdate({ _id: attempt.claims.set, submittedAt: null }, { $set: { submittedAt: new Date() } }, { new: true });
    if (!set) return res.status(409).json({ msg: 'This test was already submitted. Please start a new one.' });

    const { score, total } = scoreAttempt(set, req.body.answers);
    const percentage = total ? Math.round((score / total) * 100) : 0;
    recordAttempt({ skill: attempt.claims.skill, source: 'ai', score, total, percentage, passed: total > 0 && score / total >= PASS_RATIO });
    res.json({
      score,
      total,
      percentage,
      passed: total > 0 && score / total >= PASS_RATIO,
      resultToken: signResult({ setId: set._id, skill: attempt.claims.skill, difficulty: attempt.claims.difficulty, score, total }),
    });
  } catch (err) {
    console.error('Submit Public Assessment Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getCategories = (req, res) => {
  const categories = [
    'Digital Marketing Basics', 
    'MS Excel', 
    'Communication/English Basics', 
    'Computer Basics', 
    'Customer Service', 
    'Tally/Basic Accounting', 
    'Canva/Graphic Design Basics'
  ];
  res.json(categories);
};

const SkillTestResult = require('../models/SkillTestResult');

// @desc    Get the logged-in jobseeker's latest result per skill
// @route   GET /api/skill-tests/my-results
// @access  Private (jobseeker)
const getMyResults = async (req, res) => {
  try {
    const results = await SkillTestResult.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    const latestBySkill = new Map();
    for (const r of results) {
      if (!latestBySkill.has(r.skill)) latestBySkill.set(r.skill, r);
    }

    res.json([...latestBySkill.values()]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @desc    Save a free-assessment result on the logged-in job seeker's profile.
// The score is NOT taken from the request: it comes from the signed resultToken the server issued at submit.
const saveResult = async (req, res) => {
  try {
    const claims = verifyResult(req.body?.resultToken);
    if (!claims) return res.status(400).json({ msg: 'This result could not be verified. Please take the test again.' });
    const set = (await Assessment.findById(claims.set)) || (await CampusQuestionSet.findById(claims.set));
    const { skill, difficulty, score, total } = claims;
    const percentage = total ? Math.round((score / total) * 100) : 0;
    const answers = req.body.answers && typeof req.body.answers === 'object' && !Array.isArray(req.body.answers) ? req.body.answers : {};

    const result = await SkillTestResult.findOneAndUpdate(
      { user: req.user.id, skill },
      {
        user: req.user.id,
        skill,
        difficulty,
        score,
        total,
        percentage,
        passed: total > 0 && score / total >= PASS_RATIO,
        questions: set ? set.questions : [],
        answers
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(result);
  } catch (err) {
    console.error('Save Result Error:', err.message);
    res.status(500).json({ msg: 'Server error saving result' });
  }
};

// Free skill test from the pre-checked question bank (no live AI call, answers scored on the server).
// @route GET /api/assessments/skills  -> skills that have questions ready, with industry and the levels on offer
const getFreeSkills = async (req, res) => {
  try {
    const ready = await CampusQuestionSet.distinct('category', { active: true });
    const skills = [];
    for (const { key, label, industry } of ALL_SKILLS) {
      let levels = levelsFor(key);
      if (!levels.length && ready.includes(key)) levels = ['medium']; // only AI-made sets exist
      if (levels.length) skills.push({ key, label, industry, levels });
    }
    res.json(skills);
  } catch (err) {
    console.error('Free skills list error:', err.message);
    res.status(500).json({ msg: 'Something went wrong. Please try again.' });
  }
};

// @route GET /api/assessments/bank?category=<key>&level=easy|medium|hard
const getFreeBankTest = async (req, res) => {
  try {
    const cat = getFreeSkill(req.query.category);
    if (!cat) return res.status(400).json({ msg: 'Please choose a skill from the list.' });
    const level = cleanLevel(req.query.level);
    let set;
    try { set = await pickSet(cat.key, level); } catch (err) {
      console.error('Question bank unavailable:', err.message);
      return res.status(503).json({ msg: 'This test is being prepared. Please try another skill or come back later.' });
    }
    res.json({
      skill: cat.label,
      level,
      questions: publicQuestions(set),
      attemptToken: signAttempt({ studentId: 'guest', category: cat.key, setId: set._id }),
    });
  } catch (err) {
    console.error('Free bank test error:', err.message);
    res.status(500).json({ msg: 'Something went wrong. Please try again.' });
  }
};

// @route POST /api/assessments/bank/submit   Body: { category, attemptToken, answers: { "<questionId>": "a" } }
const submitFreeBankTest = async (req, res) => {
  try {
    const cat = getFreeSkill(req.body.category);
    if (!cat) return res.status(400).json({ msg: 'Please choose a skill from the list.' });
    const check = verifyAttempt(req.body.attemptToken, { studentId: 'guest', category: cat.key });
    if (check.error === 'too_fast') return res.status(400).json({ msg: 'That was too fast. Please read each question and try again.' });
    if (check.error) return res.status(400).json({ msg: 'This test has expired. Please start again.' });
    const set = await CampusQuestionSet.findById(check.claims.set);
    if (!set) return res.status(400).json({ msg: 'This test has expired. Please start again.' });
    const { score, total } = scoreAttempt(set, req.body.answers);
    const percentage = Math.round((score / total) * 100);
    const level = set.level || 'medium';
    recordAttempt({ skill: cat.label, source: 'bank', level, score, total, percentage, passed: score / total >= BANK_PASS_RATIO });
    res.json({
      score, total, percentage, level, passed: score / total >= BANK_PASS_RATIO,
      // Same signed proof the older free test gives, so a logged-in job seeker's result can be saved.
      resultToken: signResult({ setId: set._id, skill: cat.label, difficulty: level, score, total }),
      review: set.questions.map((q) => ({ id: q.id, correct_option: q.correct_option, explanation: q.explanation })),
    });
  } catch (err) {
    console.error('Free bank submit error:', err.message);
    res.status(500).json({ msg: 'Something went wrong. Please try again.' });
  }
};

  getFreeSkills,
  getFreeBankTest,
module.exports = {
  getFreeSkills,
  getFreeBankTest,
  submitFreeBankTest,
  getAssessment,
  submitPublicAssessment,
  getCategories,
  getMyResults,
  saveResult
};
