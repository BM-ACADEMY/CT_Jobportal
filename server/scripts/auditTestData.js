// READ-ONLY. Lists records that look like test or dummy data so a person can decide what to remove.
//   node scripts/auditTestData.js            -> writes test-data-audit.csv in the current folder
// Nothing is changed in the database. Needs MONGODB_URI in server/.env.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const Company = require('../models/Company');
const College = require('../models/College');
const Payment = require('../models/Payment');

const TEST_WORDS = /\b(test|testing|demo|dummy|sample|fake|asdf|qwerty|xyz|temp|sneha|trial)\b/i;
const TEST_DOMAINS = /@(example\.|test\.|mailinator|yopmail|guerrillamail|tempmail|ct\.com$|abc\.com$|xyz\.com$)/i;
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const rows = [['collection', 'id', 'label', 'email', 'created', 'looks_like_test', 'has_real_payment', 'remove (type yes)']];
  const realPay = new Set((await Payment.find({ razorpay_payment_id: { $exists: true, $ne: null, $ne: '' } }).select('user').lean()).map((p) => String(p.user)));

  for (const u of await User.find({}).select('name email role createdAt').lean()) {
    const hit = TEST_WORDS.test(u.name || '') || TEST_DOMAINS.test(u.email || '') || TEST_WORDS.test((u.email || '').split('@')[0]);
    rows.push(['User', u._id, `${u.name || ''} (${u.role})`, u.email, u.createdAt?.toISOString().slice(0, 10), hit ? 'yes' : 'no', realPay.has(String(u._id)) ? 'yes' : 'no', '']);
  }
  for (const j of await Job.find({}).select('title createdAt').lean()) {
    rows.push(['Job', j._id, j.title, '', j.createdAt?.toISOString().slice(0, 10), TEST_WORDS.test(j.title || '') ? 'yes' : 'no', 'no', '']);
  }
  for (const c of await Company.find({}).select('name admin_email createdAt').lean()) {
    rows.push(['Company', c._id, c.name, c.admin_email, c.createdAt?.toISOString().slice(0, 10), TEST_WORDS.test(c.name || '') || TEST_DOMAINS.test(c.admin_email || '') ? 'yes' : 'no', 'no', '']);
  }
  for (const c of await College.find({}).select('name principalEmail createdAt').lean()) {
    rows.push(['College', c._id, c.name, c.principalEmail, c.createdAt?.toISOString().slice(0, 10), TEST_WORDS.test(c.name || '') || TEST_DOMAINS.test(c.principalEmail || '') ? 'yes' : 'no', 'no', '']);
  }
  // Payments with no Razorpay payment id are not real money (Payment.status defaults to "completed").
  const pays = await Payment.find({}).select('user amount status razorpay_payment_id createdAt').lean();
  for (const p of pays) {
    const real = !!p.razorpay_payment_id;
    rows.push(['Payment', p._id, `Rs ${p.amount} ${p.status}`, '', p.createdAt?.toISOString().slice(0, 10), real ? 'no' : 'yes', real ? 'yes' : 'no', '']);
  }
  fs.writeFileSync('test-data-audit.csv', rows.map((r) => r.map(csvCell).join(',')).join('\n'));
  const count = (col, flag) => rows.filter((r) => r[0] === col && r[5] === flag).length;
  console.log('Written test-data-audit.csv');
  for (const col of ['User', 'Job', 'Company', 'College', 'Payment']) console.log(`${col}: ${count(col, 'yes')} look like test, ${count(col, 'no')} look real`);
  const sum = pays.filter((p) => p.status === 'completed' && !p.razorpay_payment_id).reduce((a, p) => a + (p.amount || 0), 0);
  console.log(`Completed payments with no Razorpay id (not real money): Rs ${sum}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
