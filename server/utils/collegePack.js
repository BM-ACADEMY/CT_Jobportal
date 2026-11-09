const { PACK } = require('../config/collegePack');
const { GST_RATE } = require('../config/driveConfig');
const UNLIMITED = 100000; // same number the plan fulfilment uses for "unlimited"
const round2 = (n) => Math.round(n * 100) / 100;

// Extra students count only until extraUntil. After that the college goes back to its plan's capacity.
const activeExtra = (college, now = new Date()) => (college?.extraStudents > 0 && college.extraUntil && new Date(college.extraUntil) > now ? college.extraStudents : 0);
const effectiveStudentLimit = (college, now = new Date()) => {
  const base = college?.studentLimit || 100;
  return base >= UNLIMITED ? base : base + activeExtra(college, now);
};

// Works out what recording `packs` packs would do. Returns { error } or the new totals and what was paid.
const planPack = (college, packs, now = new Date()) => {
  const n = Number(packs);
  if (!Number.isInteger(n) || n < 1) return { error: 'Choose how many packs, 1 or more.' };
  if ((college?.studentLimit || 100) >= UNLIMITED) return { error: 'This college already has unlimited students.' };
  const haveStudents = activeExtra(college, now);
  const havePacks = Math.round(haveStudents / PACK.students);
  if (havePacks + n > PACK.maxPacks) return { error: `A college can have at most ${PACK.maxPacks} packs. It has ${havePacks} now. A bigger plan is better value beyond that.` };
  const base = PACK.price * n;
  const extraUntil = new Date(Math.max(now.getTime() + PACK.days * 86400000, activeExtra(college, now) && college.extraUntil ? new Date(college.extraUntil).getTime() : 0));
  return { packs: n, students: PACK.students * n, base, total: round2(base * (1 + GST_RATE)), extraStudents: haveStudents + PACK.students * n, extraUntil };
};

module.exports = { UNLIMITED, activeExtra, effectiveStudentLimit, planPack };
