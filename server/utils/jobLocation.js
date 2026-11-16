// Google Jobs and job seekers need a real place. "Various", "Tamil Nadu" or "India" alone is refused for a job that
// has a fixed workplace. Remote jobs may say Remote or India. The message says what to write instead.
const VAGUE = /^(various|various\s+locations?|multiple|multiple\s+locations?|multiple\s+cities|anywhere|any|any\s+location|all|all\s+india|pan\s+india|india|tamil\s*nadu|tn|south\s+india|n\/?a|na|-+)$/i;
const clean = (v) => String(v == null ? '' : v).trim().replace(/[.,;]+$/g, '').replace(/\s+/g, ' ').trim();

const vagueLocation = (location, workMode) => {
  const loc = clean(location);
  if (!loc) return false; // empty is handled by the form, drafts may be empty
  if (String(workMode || '').toLowerCase() === 'remote') return false;
  return VAGUE.test(loc);
};

const VAGUE_LOCATION_MESSAGE = 'Please give the town or city where the person will work, for example "Puducherry" or "Villupuram". "Various", "Tamil Nadu" or "India" alone is not accepted for jobs with a fixed workplace.';

module.exports = { vagueLocation, VAGUE_LOCATION_MESSAGE };
