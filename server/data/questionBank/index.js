// Loads every question file in this folder and merges them: { skill-key: { easy, medium, hard } }.
// Add a new industry by dropping another file here (check it with scripts/validateQuestionBank.js).
const fs = require('fs');
const path = require('path');

const merged = {};
for (const file of fs.readdirSync(__dirname).sort()) {
  if (!file.endsWith('.js') || file === 'index.js') continue;
  let data;
  try { data = require(path.join(__dirname, file)); } catch (err) { console.error(`[QuestionBank] could not load ${file}: ${err.message}`); continue; }
  for (const [skill, levels] of Object.entries(data)) merged[skill] = { ...(merged[skill] || {}), ...levels };
}

module.exports = merged;
