// How full is a college's student limit, and what to say about it. Plain rules, easy to test.
const UNLIMITED = 100000;

// 0 = nothing to say yet. 70, 90 or 100 = the highest line the college has crossed.
const levelFor = (used, limit) => {
  const u = Number(used) || 0; const l = Number(limit) || 0;
  if (l <= 0 || l >= UNLIMITED) return 0;
  const pct = (u / l) * 100;
  return pct >= 100 ? 100 : pct >= 90 ? 90 : pct >= 70 ? 70 : 0;
};

const nudgeText = (level, { used, limit, college }) => {
  const name = college || 'your college';
  if (level === 100) return { title: 'Your student limit is full', message: `${name} has ${used} of ${limit} students. New students cannot join or be uploaded until you add a student pack or move to a bigger plan. Our team will call you to help.` };
  if (level === 90) return { title: 'Your student limit is almost full', message: `${name} has ${used} of ${limit} students (over 90%). Add a student pack or move to a bigger plan before the last students are turned away.` };
  return { title: 'Your student limit is filling up', message: `${name} has ${used} of ${limit} students (over 70%). You can add a student pack or move to a bigger plan any time.` };
};

module.exports = { levelFor, nudgeText, UNLIMITED };
