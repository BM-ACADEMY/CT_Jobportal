// Fills the campus question bank. Run once before a college drive, and again whenever you want fresh sets:
//   node scripts/generateQuestionBank.js --sets 5
// Needs MONGODB_URI and OPENROUTER_API_KEY in the environment (server/.env is loaded).
require('dotenv').config();
const mongoose = require('mongoose');
const { SKILL_CATEGORIES } = require('../config/courseMap');
const { generateSet } = require('../utils/questionBank');
const CampusQuestionSet = require('../models/CampusQuestionSet');

const arg = process.argv.indexOf('--sets');
const SETS = arg > -1 ? Math.max(1, Number(process.argv[arg + 1]) || 5) : 5;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const cat of SKILL_CATEGORIES) {
    let have = await CampusQuestionSet.countDocuments({ category: cat.key, active: true });
    let failures = 0;
    while (have < SETS && failures < 3) {
      try {
        await generateSet(cat.key);
        have += 1;
        console.log(`${cat.label}: ${have}/${SETS}`);
      } catch (err) {
        failures += 1;
        console.error(`${cat.label}: attempt failed (${err.message})`);
      }
    }
  }
  await mongoose.disconnect();
  console.log('Done.');
})().catch((err) => { console.error(err); process.exit(1); });
