// Sponsored placement bought as an add-on. The admin creates three add-ons in Pay-per (any price) with these keys;
// the company buys one through the normal add-on payment and then picks a live job to sponsor.
const SPONSOR_PACKS = { sponsoredJob7: 7, sponsoredJob15: 15, sponsoredJob30: 30 };
const MAX_PRIORITY_TOP = 3; // gold Priority jobs pinned above the normal list, so the page is not all gold

// The company's usable sponsor pack: active, not expired, something left. wantedKey narrows it when they chose one.
const findSponsorPack = (purchased = [], wantedKey = '', now = new Date()) => {
  const usable = (purchased || []).filter((f) => SPONSOR_PACKS[f.featureKey] && f.isActive && Number(f.usageLeft) > 0 && (!f.expiresAt || new Date(f.expiresAt) > now));
  const pick = wantedKey ? usable.filter((f) => f.featureKey === wantedKey) : usable;
  return pick.sort((a, b) => SPONSOR_PACKS[a.featureKey] - SPONSOR_PACKS[b.featureKey])[0] || null;
};

// A job that has unchecked flags (scam wording, reports) cannot be bought into the top of the list.
const sponsorBlockedByFlags = (job) => Array.isArray(job?.scamFlags) && job.scamFlags.length > 0 && job.scamReviewed !== true;

// Priority jobs: only the first few are pinned on top, the rest keep their badge but sort with everyone else.
const pinPriority = (jobs, isPriority, max = MAX_PRIORITY_TOP) => {
  const pinned = jobs.filter(isPriority).slice(0, max);
  const set = new Set(pinned);
  return [...pinned, ...jobs.filter((j) => !set.has(j))];
};

module.exports = { SPONSOR_PACKS, MAX_PRIORITY_TOP, findSponsorPack, sponsorBlockedByFlags, pinPriority };
