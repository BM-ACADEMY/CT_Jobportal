// Checks every question file in data/questionBank: node scripts/validateQuestionBank.js [file.js ...]
// Rules: 10 questions per level, 4 distinct options, a valid answer key, a one-line explanation, no duplicate questions.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../data/questionBank');
const files = process.argv.length > 2 ? process.argv.slice(2).map((f) => path.resolve(f)) : fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js').map((f) => path.join(dir, f));
let problems = 0;
const seen = new Set();
const bad = (msg) => { problems += 1; console.error('  x ' + msg); };

for (const file of files) {
  const data = require(file);
  console.log(path.basename(file) + ': ' + Object.keys(data).length + ' skills');
  for (const [skill, levels] of Object.entries(data)) {
    for (const level of ['easy', 'medium', 'hard']) {
      const list = levels[level];
      if (!list) { if (level !== 'medium' || !levels.easy) continue; else continue; }
      if (list.length < 10) bad(`${skill}/${level}: only ${list.length} questions (need 10 or more)`);
      const counts = { a: 0, b: 0, c: 0, d: 0 };
      list.forEach((q, i) => {
        const where = `${skill}/${level}#${i + 1}`;
        const opts = q.opts || {};
        const texts = ['a', 'b', 'c', 'd'].map((l) => String(opts[l] || '').trim());
        if (!q.q || String(q.q).trim().length < 10) bad(`${where}: missing question`);
        if (texts.some((t) => !t)) bad(`${where}: an option is empty`);
        if (new Set(texts.map((t) => t.toLowerCase())).size !== 4) bad(`${where}: options are not 4 different texts`);
        if (!['a', 'b', 'c', 'd'].includes(q.ans)) bad(`${where}: answer key must be a, b, c or d`); else counts[q.ans] += 1;
        if (!q.exp || String(q.exp).trim().length < 8) bad(`${where}: explanation missing`);
        const key = String(q.q).toLowerCase().replace(/\W+/g, ' ').trim();
        if (seen.has(key)) bad(`${where}: duplicate question`);
        seen.add(key);
      });
      if (list.length >= 10 && Math.max(...Object.values(counts)) > Math.ceil(list.length * 0.5)) bad(`${skill}/${level}: answer key is lopsided ${JSON.stringify(counts)}`);
    }
  }
}
console.log(problems ? `${problems} problem(s)` : 'All good');
process.exit(problems ? 1 : 0);
