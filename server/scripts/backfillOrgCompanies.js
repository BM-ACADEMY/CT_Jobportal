// Creates a Company document for every organization account (role 'company') that has none.
// Dry run by default:  node scripts/backfillOrgCompanies.js
// Apply:               node scripts/backfillOrgCompanies.js --apply
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const { ensureOrgCompany } = require('../utils/ensureOrgCompany');

(async () => {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGODB_URI);
  const role = await Role.findOne({ name: 'company' });
  const users = await User.find({ role: role._id, company: { $in: [null, undefined] } });
  console.log(`${users.length} organization account(s) without a company record`);
  for (const u of users) {
    console.log(`${apply ? 'CREATE' : 'would create'}: ${u.name} <${u.email}>`);
    if (apply) await ensureOrgCompany(u, 'company');
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
