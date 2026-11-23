// One-off: mail job seekers who signed up from 12 Nov and never verified. Reads the database only; never changes an account.
// Usage (from /var/www/CT_Jobportal/server):
//   node scripts/notifyUnverified.js count            numbers only, sends nothing
//   node scripts/notifyUnverified.js export           saves a CSV in the home folder (private)
//   node scripts/notifyUnverified.js test you@mail    sends one test mail
//   LIMIT=15 node scripts/notifyUnverified.js send    mails one batch (default 15, 30 s apart)
// Hostinger allows only 100 outgoing mails per rolling 24 hours, shared with login codes, so keep batches small.
require('dotenv').config();
const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const sendEmail = require('../utils/sendEmail');

const SINCE = new Date('2026-11-12T00:00:00+05:30');
const CSV = path.join(os.homedir(), 'unverified_jobseekers.csv');
const SENT = path.join(os.homedir(), 'unverified_sent.log');
const DELAY = Number(process.env.DELAY_MS) || 30000;
const LIMIT = Number(process.env.LIMIT) || 15;
const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SUBJECT = 'Your Velaivaaipu code, sorry about that';
const body = (name) => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#1e293b;font-size:15px;line-height:1.6">
<p>Hi ${esc(name || 'there')},</p>
<p>When you signed up on Velaivaaipu, your verification code probably came late or didn't work. That was our mistake, and it's fixed now.</p>
<p>Please log in again at <a href="https://velaivaaipu.in">velaivaaipu.in</a>. A new code will be sent to you. If you don't see it, please check your Spam folder. The code is valid for 10 minutes.</p>
<p>If you still have trouble, just reply to this mail and we'll help you personally.</p>
<p>Kamarudeen BM<br>Velaivaaipu</p></div>`;
const readSent = () => new Set(fs.existsSync(SENT) ? fs.readFileSync(SENT, 'utf8').split('\n').filter(Boolean) : []);

(async () => {
  const mode = process.argv[2];
  await mongoose.connect(process.env.MONGODB_URI);
  const role = await Role.findOne({ name: 'jobseeker' }).select('_id').lean();
  const users = await User.find({
    role: role._id, isVerified: false, createdAt: { $gte: SINCE },
    isAdminBlocked: { $ne: true }, email: { $not: /\.portal\s*$/i },
  }).select('name email profile.phone createdAt').sort({ createdAt: 1 }).lean();

  if (mode === 'count') {
    const done = readSent();
    const left = users.filter((u) => !done.has(String(u.email).toLowerCase())).length;
    console.log('Unverified job seekers since 12 Nov:', users.length, '| already mailed:', users.length - left, '| still to mail:', left);
  } else if (mode === 'export') {
    const q = (s) => '"' + String(s || '').replace(/"/g, '""') + '"';
    const rows = ['name,email,phone,signed_up'].concat(users.map((u) => [q(u.name), q(u.email), q(u.profile && u.profile.phone), q(u.createdAt.toISOString())].join(',')));
    fs.writeFileSync(CSV, rows.join('\n'), { mode: 0o600 });
    console.log('Saved', users.length, 'rows to', CSV);
  } else if (mode === 'test') {
    const to = process.argv[3];
    if (!to) throw new Error('Usage: node scripts/notifyUnverified.js test your@address');
    const ok = await sendEmail({ email: to, subject: SUBJECT, html: body('Test') });
    console.log(ok ? 'Test mail sent. Check Inbox and Spam.' : 'Test mail FAILED. See the error above.');
  } else if (mode === 'send') {
    const done = readSent();
    let sent = 0, failed = 0, skipped = 0, streak = 0;
    for (const u of users) {
      if (sent >= LIMIT) break;
      const e = String(u.email).toLowerCase();
      if (done.has(e)) { skipped++; continue; }
      const ok = await sendEmail({ email: u.email, subject: SUBJECT, html: body(u.name) });
      if (ok) { sent++; streak = 0; fs.appendFileSync(SENT, e + '\n'); } else { failed++; streak++; }
      if (streak >= 3) { console.log('Stopping: 3 failures in a row.'); break; }
      await sleep(DELAY);
    }
    console.log(`sent ${sent}, failed ${failed}, already sent earlier ${skipped}, total on list ${users.length}`);
  } else console.log('Usage: node scripts/notifyUnverified.js count | export | test <email> | send');
  await mongoose.disconnect();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
