const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const src = (...p) => fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'src', ...p), 'utf8');

test('posting form tells companies internships must be free', () => {
  const s = src('pages', 'company', 'PostJob.jsx');
  assert.match(s, /internship-free-rule/);
  assert.match(s, /must be free for students/);
  assert.match(s, /A paid course or training is not an internship/);
});

test('public internships page warns students never to pay and points to Report', () => {
  const s = src('pages', 'Internships.jsx');
  assert.match(s, /internship-student-warning/);
  assert.match(s, /Never pay to get an internship/);
  assert.match(s, /Report button/);
});

test('report reason for money demands exists', () => {
  assert.match(src('components', 'jobs', 'ReportJobButton.jsx'), /asks_for_money/);
});
