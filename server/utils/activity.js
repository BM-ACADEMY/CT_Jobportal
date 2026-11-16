// Helpers for the Daily activity page. Days are Indian calendar days (YYYY-MM-DD), oldest first, today last.
const DAY = 86400000;
const ist = (d) => new Date(d.getTime() + 330 * 60000);
const dayOf = (d) => ist(d).toISOString().slice(0, 10);

const istDays = (n, now = new Date()) => Array.from({ length: n }, (_, i) => dayOf(new Date(now.getTime() - (n - 1 - i) * DAY)));
const startOf = (day) => new Date(`${day}T00:00:00+05:30`);
const cleanDays = (v) => ([7, 14, 30, 60].includes(parseInt(v, 10)) ? parseInt(v, 10) : 14);

// rows: [{ _id:'2026-11-10', <field>: n }] -> one number per day (0 when a day has no row)
const fill = (days, rows = [], field = 'n') => { const m = new Map(rows.map((r) => [r._id, Number(r[field]) || 0])); return days.map((d) => m.get(d) || 0); };

// steps: [[label, count], ...] -> each step with its share of the first step and of the step before it
const funnel = (steps) => steps.map(([label, count], i) => ({
  label, count,
  pctOfFirst: steps[0][1] > 0 ? Math.round((count / steps[0][1]) * 100) : 0,
  pctOfPrev: i === 0 ? 100 : steps[i - 1][1] > 0 ? Math.round((count / steps[i - 1][1]) * 100) : 0,
}));

// Today and the average of the seven days before today.
const compare = (series) => {
  const out = {};
  for (const [k, arr] of Object.entries(series)) {
    const today = arr[arr.length - 1] || 0; const prev = arr.slice(-8, -1);
    out[k] = { today, avg7: prev.length ? Math.round((prev.reduce((a, b) => a + b, 0) / prev.length) * 10) / 10 : 0 };
  }
  return out;
};

module.exports = { istDays, startOf, cleanDays, fill, funnel, compare, dayOf };
