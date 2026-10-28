// READ-ONLY audit of privileged accounts before launch. Changes nothing.
// Usage: cd server && node scripts/auditPrivilegedAccounts.js
// Lists every Admin document and every User whose role is admin, subadmin or drive_incharge,
// and flags the known leftover test account admin@ct.com. Review the list, then delete or reset
// anything you do not recognise from your own admin screen or the MongoDB shell.
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Role = require('../models/Role');

const PRIVILEGED = ['admin', 'subadmin', 'drive_incharge'];
const KNOWN_BAD = ['admin@ct.com'];

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(uri);

  const admins = await Admin.find({}, 'name email role createdAt updatedAt').lean();
  console.log(`\nAdmin collection: ${admins.length}`);
  admins.forEach((a) => {
    const flag = KNOWN_BAD.includes(a.email) ? '  <-- KNOWN TEST ACCOUNT, REMOVE' : '';
    console.log(`  ${a.email}  name="${a.name}"  role=${a.role}  created=${a.createdAt?.toISOString?.() || '-'}${flag}`);
  });

  const roles = await Role.find({ name: { $in: PRIVILEGED } }, '_id name').lean();
  const roleName = Object.fromEntries(roles.map((r) => [String(r._id), r.name]));
  const users = await User.find(
    { $or: [{ role: { $in: roles.map((r) => r._id) } }, { email: { $in: KNOWN_BAD } }] },
    'name email role isActive createdAt'
  ).lean();
  console.log(`\nUsers with a privileged role: ${users.length}`);
  users.forEach((u) => {
    const flag = KNOWN_BAD.includes(u.email) ? '  <-- KNOWN TEST ACCOUNT, REMOVE' : '';
    console.log(`  ${u.email}  name="${u.name}"  role=${roleName[String(u.role)] || u.role}  active=${u.isActive}  created=${u.createdAt?.toISOString?.() || '-'}${flag}`);
  });

  console.log('\nNothing was changed.');
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
