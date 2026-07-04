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

module.exports = {
  getAssessment
};
