const Assessment = require('../models/Assessment');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Generate or fetch a skill assessment
// @route   GET /api/assessments/public?skill=X&difficulty=Y
// @access  Public
const getAssessment = async (req, res) => {
  try {
    let { skill, difficulty } = req.query;
    if (!skill || !difficulty) {
      return res.status(400).json({ msg: 'Skill and difficulty are required.' });
    }

    skill = skill.toLowerCase().trim();
    difficulty = difficulty.toLowerCase().trim();

    // Check cache in MongoDB
    const cachedAssessment = await Assessment.findOne({ skill, difficulty });
    if (cachedAssessment && cachedAssessment.questions.length > 0) {
      return res.json({ msg: 'Fetched from cache', questions: cachedAssessment.questions });
    }

    // Generate via Gemini
    const prompt = `
You are an expert technical interviewer and examination engine. Your task is to generate a multiple-choice skill assessment test based on the following parameters:
- Skill: ${skill}
- Difficulty: ${difficulty}
- Number of Questions: 10

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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const resultObj = await model.generateContent(prompt);
    let responseText = resultObj.response.text();
    
    // Strip markdown formatting if present
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let questions;
    try {
      questions = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error for Assessment:', parseError);
      return res.status(500).json({ msg: 'Failed to parse AI generated assessment format' });
    }

    // Save to cache
    const newAssessment = new Assessment({
      skill,
      difficulty,
      questions
    });
    await newAssessment.save();

    res.json({ msg: 'Generated new assessment', questions });

  } catch (err) {
    console.error('Assessment Generation Error:', err);
    res.status(500).json({ msg: 'Server error generating assessment', error: err.message });
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
    res.json({ score, total, passed, percentage: Math.round((score/total)*100) });
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

module.exports = {
  getAssessment,
  getCategories,
  startTest,
  submitTest,
  claimCertificate
};
