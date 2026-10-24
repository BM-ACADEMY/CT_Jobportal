const Assessment = require('../models/Assessment');
const { GoogleGenerativeAI } = require('../utils/aiHelper');
const { normalizeSet, publicQuestions, scoreAttempt, QUESTIONS_PER_SET } = require('../utils/campusTest');
const { cleanSkill, cleanDifficulty, signStart, verifyStart, signResult, verifyResult, PASS_RATIO } = require('../utils/freeAssessment');

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

const startTest = async (req, res) => {
  try {
    const { category } = req.params;
    
    // Attempt to fetch cached for medium difficulty
    const skill = category.toLowerCase().trim();
    let cachedAssessment = await Assessment.findOne({ skill, difficulty: 'medium' });
    
    if (cachedAssessment && cachedAssessment.questions.length > 0) {
      // Strip correct_option and explanation for public start
      const sanitizedQuestions = cachedAssessment.questions.map(q => {
        const { correct_option, explanation, ...rest } = (q.toObject ? q.toObject() : q);
        return rest;
      });
      return res.json({ category, questions: sanitizedQuestions });
    }
    
    // Otherwise fallback to generation logic here or return a generic message to generate first
    // For simplicity of funnel, return 404 and instruct to generate via /public
    res.status(404).json({ msg: 'Test not found for this category yet. Please generate via public assessment API first.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

const SkillTestResult = require('../models/SkillTestResult');

const submitTest = async (req, res) => {
  try {
    const { category } = req.params;
    const { answers } = req.body; // { "1": "a", "2": "c" }

    const skill = category.toLowerCase().trim();
    const cachedAssessment = await Assessment.findOne({ skill, difficulty: 'medium' });
    if (!cachedAssessment) return res.status(404).json({ msg: 'Test not found' });

    let score = 0;
    const total = cachedAssessment.questions.length;

    cachedAssessment.questions.forEach(q => {
      if (answers[q.id] === q.correct_option) score++;
    });

    const passed = (score / total) >= 0.7; // 70%+ required
    const percentage = Math.round((score / total) * 100);

    // Persist the result for logged-in jobseekers only (req.user is set by
    // optionalVerifyToken when a valid token is present; guests still get scored).
    if (req.user?.id && req.user.role === 'jobseeker') {
      try {
        await SkillTestResult.findOneAndUpdate(
          { user: req.user.id, skill },
          { user: req.user.id, skill, difficulty: 'medium', score, total, percentage, passed },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (persistErr) {
        console.error('SkillTestResult persist error:', persistErr.message);
      }
    }

    res.json({ score, total, passed, percentage });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

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

const crypto = require('crypto');
const User = require('../models/User');

const claimCertificate = async (req, res) => {
  try {
    const { category } = req.params;
    const { name, phone, score, total } = req.body;

    if (!name || !phone) return res.status(400).json({ msg: 'Name and phone required' });

    const passed = (score / total) >= 0.7;
    if (!passed) return res.status(400).json({ msg: 'Score too low for certificate' });

    // Minimal registration
    let user = await User.findOne({ 'profile.phone': phone });
    if (!user) {
      user = new User({
        name,
        email: `${phone}@temp.velaivaaipu.in`,
        password: crypto.randomBytes(8).toString('hex'), // temp random
        role: await require('../models/Role').findOne({ name: 'jobseeker' }).then(r => r._id),
        profile: { phone }
      });
      await user.save();
    }

    const certCode = `CERT-SKILL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    res.json({
      msg: 'Certificate claimed',
      certificateCode: certCode,
      user: { id: user._id, name: user.name }
    });
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
    const set = await Assessment.findById(claims.set);
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

module.exports = {
  getAssessment,
  submitPublicAssessment,
  getCategories,
  startTest,
  submitTest,
  getMyResults,
  claimCertificate,
  saveResult
};
