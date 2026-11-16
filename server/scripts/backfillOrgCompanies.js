// 1) Creates a Company document for every organization account (role 'company') that has none.
// 2) Marks the company verified for every admin-verified recruiter / organization account.
// Dry run by default:  node scripts/backfillOrgCompanies.js
// Apply:               node scripts/backfillOrgCompanies.js --apply
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Company = require('../models/Company');
const { ensureOrgCompany, verifyLinkedCompany } = require('../utils/ensureOrgCompany');

(async () => {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGODB_URI);
  const roles = await Role.find({ name: { $in: ['company', 'recruiter'] } });
  const orgRole = roles.find((r) => r.name === 'company');

  const orphans = orgRole ? await User.find({ role: orgRole._id, company: { $in: [null, undefined] } }) : [];
  console.log(`${orphans.length} organization account(s) without a company record`);
  for (const u of orphans) {
    console.log(`${apply ? 'CREATE' : 'would create'}: ${u.name} <${u.email}>`);
    if (apply) await ensureOrgCompany(u, 'company');
  }

  const verifiedUsers = await User.find({
    role: { $in: roles.map((r) => r._id) },
    profileVerificationStatus: 'Verified',
    company: { $ne: null },
  });
  let n = 0;
  for (const u of verifiedUsers) {
    const c = await Company.findById(u.company).select('name is_verified');
    if (!c || c.is_verified) continue;
    n += 1;
    console.log(`${apply ? 'VERIFY' : 'would verify'} company: ${c.name} (account: ${u.name} <${u.email}>)`);
    if (apply) await verifyLinkedCompany(u);
  }
  console.log(`${n} company record(s) of verified accounts not yet verified`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
