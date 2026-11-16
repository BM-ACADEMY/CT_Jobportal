// Quick apply: a job seeker with a thin profile can apply by giving a few basics in the same step.
// The details only FILL profile fields that are still empty. They never overwrite what the person already saved.
const { cleanPhone } = require('./driveRules');
const { cleanCategory } = require('../config/jobCategories');

const LEVELS = ['fresher', 'under_2_years', '2_to_5_years', 'over_5_years'];
const str = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

const cleanQuickDetails = (raw) => {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  const phone = cleanPhone(raw.phone); if (phone) out.phone = phone;
  const location = str(raw.location, 80); if (location.length >= 2) out.location = location;
  if (LEVELS.includes(raw.experienceLevel)) out.experienceLevel = raw.experienceLevel;
  const category = cleanCategory(raw.category); if (category) out.category = category;
  return out;
};

// Mongo $set for only the fields the user has not filled yet. Returns null when there is nothing to save.
const fillMissing = (user, details) => {
  const p = user?.profile || {};
  const set = {};
  if (details.phone && !p.phone) set['profile.phone'] = details.phone;
  if (details.location && !p.location) set['profile.location'] = details.location;
  if (details.experienceLevel && !p.experienceLevel) set['profile.experienceLevel'] = details.experienceLevel;
  if (details.category && !(p.interestedCategories || []).length) set['profile.interestedCategories'] = [details.category];
  return Object.keys(set).length ? set : null;
};

module.exports = { LEVELS, cleanQuickDetails, fillMissing };
