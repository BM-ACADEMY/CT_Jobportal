const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
process.env.JWT_SECRET = 'y'.repeat(40);
process.env.FRONTEND_URL = 'https://velaivaaipu.in';
process.env.API_PUBLIC_URL = 'https://api.velaivaaipu.in';
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'jsonwebtoken') return { sign: () => 'tok', verify: () => ({}) };
  if (/sendEmail$/.test(request)) return async () => true;
  if (request === 'nodemailer') return { createTransport: () => ({ sendMail: async () => ({}) }) };
  return realLoad.call(this, request, ...rest);
};
const w = require('../../utils/lifecycle/welcomeSeries');
const DAY = 86400000;
const user = { name: 'Priya Raman' };

test('day 2 and day 5 are due only in their window', () => {
  const now = Date.now();
  assert.deepEqual(w.dueStages(new Date(now - 1 * DAY), now), []);
  assert.deepEqual(w.dueStages(new Date(now - 3 * DAY), now), ['d2']);
  assert.deepEqual(w.dueStages(new Date(now - 6 * DAY), now), ['d2', 'd5']);
  assert.deepEqual(w.dueStages(new Date(now - 30 * DAY), now), []);
});
test('every audience has both mails, with one button and the stage in the key', () => {
  for (const a of ['seeker', 'company', 'college']) for (const s of ['d2', 'd5']) {
    const m = w.welcomeMail(a, s, user);
    assert.ok(m.subject && m.title);
    assert.equal((m.html.match(/<a /g) || []).length, 1);
    assert.match(m.html, /Hi Priya/);
    assert.equal(w.keyFor(a, s), `wel_${a}_${s}`);
  }
  assert.equal(w.welcomeMail('seeker', 'd9', user), null);
});
test('roles map to audiences; staff roles get nothing', () => {
  assert.equal(w.audienceOf('jobseeker'), 'seeker');
  assert.equal(w.audienceOf('recruiter'), 'company');
  assert.equal(w.audienceOf('admin'), null);
});
test('the series runs only inside the lifecycle cron, which is off unless LIFECYCLE_EMAILS_ENABLED=true', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../cron/lifecycleMails.js'), 'utf8');
  assert.match(src, /welcomeSeries/);
  assert.match(src, /process\.env\.LIFECYCLE_EMAILS_ENABLED === 'true'/);
  assert.match(src, /if \(!enabled\(\)\) return;/);
  assert.match(src, /EmailLog\.create\(\{ user: user\._id, key \}\)/);
  assert.equal(w.welcomeEnabled({}), false);
});
