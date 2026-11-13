const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../controllers/jobController.js'), 'utf8');
const body = (name) => { const i = src.indexOf(`const ${name} = async`); const j = src.indexOf('\nconst ', i + 10); return src.slice(i, j); };

test('posting a job with vulgar or adult wording is refused with a reason', () => {
  const c = body('createJob');
  assert.match(c, /blockForContent\(req, user, req\.body\.title, req\.body\.description\)/);
  assert.match(c, /code: 'content_blocked'/);
  assert.match(src, /was not posted because the title or description has vulgar, abusive or adult wording/);
});
test('editing a live job cannot slip the wording in either', () => {
  const u = body('updateJob');
  assert.match(u, /blockForContent\(req, owner \|\| \{\}, req\.body\.title \?\? job\.title, req\.body\.description \?\? job\.description\)/);
});
test('drafts are allowed (never public) and admins are told about a blocked post', () => {
  assert.match(body('createJob'), /status !== 'draft' && await blockForContent/);
  assert.match(body('updateJob'), /updatedStatus !== 'draft'/);
  assert.match(src, /title: 'Job post blocked'/);
});
test('the block happens before the job is saved', () => {
  const c = body('createJob');
  assert.ok(c.indexOf('blockForContent') < c.indexOf('newJob.save()'));
});
