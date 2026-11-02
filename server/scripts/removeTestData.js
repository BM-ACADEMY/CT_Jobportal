// Removes only the records a person marked "yes" in the last column of test-data-audit.csv.
//   node scripts/removeTestData.js test-data-audit.csv            -> DRY RUN, shows what would go
//   node scripts/removeTestData.js test-data-audit.csv --apply    -> really deletes
// Before deleting, every removed record is saved to removed-<time>.json so it can be put back.
// Take a database backup first. Admin accounts and anything with a real Razorpay payment are never removed.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const mongoose = require('mongoose');
const models = {
  User: require('../models/User'), Job: require('../models/Job'), Company: require('../models/Company'),
  College: require('../models/College'), Payment: require('../models/Payment'),
};
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const SkillTestResult = require('../models/SkillTestResult');
const EmailLog = require('../models/EmailLog');
const Payment = models.Payment;

const parseCsv = (text) => text.split(/\r?\n/).filter(Boolean).map((line) => {
  const cells = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { cells.push(cur); cur = ''; } else cur += ch;
  }
  cells.push(cur); return cells;
});

(async () => {
  const file = process.argv[2];
  const apply = process.argv.includes('--apply');
  if (!file || !fs.existsSync(file)) { console.error('Usage: node scripts/removeTestData.js <audit.csv> [--apply]'); process.exit(1); }
  const marked = parseCsv(fs.readFileSync(file, 'utf8')).slice(1).filter((r) => String(r[7]).trim().toLowerCase() === 'yes');
  await mongoose.connect(process.env.MONGODB_URI);
  const saved = []; const plan = {}; const related = [];
  for (const [col, id] of marked.map((r) => [r[0], r[1]])) {
    const Model = models[col];
    if (!Model || !mongoose.isValidObjectId(id)) { console.log(`Skip ${col} ${id}: not recognised`); continue; }
    const doc = await Model.findById(id).lean();
    if (!doc) continue;
    if (col === 'User' && /admin/i.test(String(doc.role))) { console.log(`Skip ${doc.email}: admin account`); continue; }
    if (col === 'Payment' && doc.razorpay_payment_id) { console.log(`Skip payment ${id}: has a Razorpay payment id`); continue; }
    if (col === 'User' && await Payment.exists({ user: id, razorpay_payment_id: { $exists: true, $ne: null, $ne: '' } })) { console.log(`Skip ${doc.email}: has a real payment`); continue; }
    plan[col] = (plan[col] || 0) + 1;
    saved.push({ collection: col, doc });
    // Records that belong to this one go with it, and are backed up too.
    if (col === 'User') {
      for (const [name, M, filter] of [['Application', Application, { applicant: id }], ['Notification', Notification, { recipient: id }], ['SkillTestResult', SkillTestResult, { user: id }], ['EmailLog', EmailLog, { user: id }]]) {
        const docs = await M.find(filter).lean(); docs.forEach((d) => related.push({ name, M, doc: d }));
      }
    }
    if (col === 'Job') (await Application.find({ job: id }).lean()).forEach((d) => related.push({ name: 'Application', M: Application, doc: d }));
  }
  const relCount = related.reduce((a, r) => ({ ...a, [r.name]: (a[r.name] || 0) + 1 }), {});
  console.log(apply ? 'DELETING:' : 'DRY RUN, nothing deleted. Would remove:', plan, 'plus related records:', relCount);
  if (apply && (saved.length || related.length)) {
    const backup = `removed-${Date.now()}.json`;
    fs.writeFileSync(backup, JSON.stringify({ records: saved, related: related.map((r) => ({ collection: r.name, doc: r.doc })) }));
    console.log(`Backup of everything about to be removed saved in ${backup}`);
    for (const r of related) await r.M.deleteOne({ _id: r.doc._id });
    for (const { collection, doc } of saved) await models[collection].deleteOne({ _id: doc._id });
    console.log('Done.');
  }
  if (!apply) console.log('Run again with --apply when the list looks right.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
