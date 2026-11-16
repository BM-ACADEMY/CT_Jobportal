// Finds who a phone number belongs to, so the admin sees "Christ College (TPO)" instead of a bare number.
const findMatch = async (phone10) => {
  const re = new RegExp(`${phone10}$`);
  const College = require('../models/College');
  const college = await College.findOne({ collegePhone: re }).select('name').lean();
  if (college) return { kind: 'college', name: college.name };
  const User = require('../models/User');
  const user = await User.findOne({ $or: [{ 'profile.phone': re }, { 'recruiterProfile.phone': re }, { 'companyProfile.phone': re }] }).select('name').lean();
  if (user) return { kind: 'user', name: user.name };
  return null;
};
module.exports = { findMatch };
