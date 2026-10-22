const { PASS_RATIO, getCategory } = require('../../config/courseMap');

// Batch readiness numbers from CollegeStudent documents (assessmentScores: [{skill, score, total, category}]).
const computeBatchStats = (students) => {
  const registered = students.length;
  const tested = students.filter((s) => (s.assessmentScores || []).some((a) => a.total > 0));
  const bestRatio = (s) => Math.max(...s.assessmentScores.filter((a) => a.total > 0).map((a) => a.score / a.total));
  const passed = tested.filter((s) => bestRatio(s) >= PASS_RATIO).length;

  const byCat = new Map();
  tested.forEach((s) => s.assessmentScores.filter((a) => a.total > 0).forEach((a) => {
    const label = getCategory(a.category)?.label || a.skill || 'General';
    const row = byCat.get(label) || { sum: 0, n: 0 };
    row.sum += a.score / a.total; row.n += 1;
    byCat.set(label, row);
  }));
  const ranked = [...byCat.entries()].map(([label, r]) => ({ label, avg: r.sum / r.n })).sort((a, b) => b.avg - a.avg);
  const all = tested.flatMap((s) => s.assessmentScores.filter((a) => a.total > 0).map((a) => a.score / a.total));

  return {
    registered,
    tested: tested.length,
    passRate: tested.length ? Math.round((passed / tested.length) * 100) : 0,
    avgPercent: all.length ? Math.round((all.reduce((x, y) => x + y, 0) / all.length) * 100) : 0,
    best: ranked[0]?.label || 'n/a',
    weakest: ranked.length > 1 ? ranked[ranked.length - 1].label : (ranked[0]?.label || 'n/a'),
  };
};

// Id of the current period (e.g. 7 for weekly), so a mail is sent at most once per period.
const periodId = (days, now = new Date()) => Math.floor(now.getTime() / (days * 86400000));

module.exports = { computeBatchStats, periodId };
