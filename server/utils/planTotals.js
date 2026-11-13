// One plan can come back as several rows (one per plan document with the same name).
// The dashboard shows each plan name once, with the users added together, biggest first.
const mergePlanTotals = (rows) => {
  const totals = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const name = String(row?.name || '').trim() || 'Unnamed plan';
    totals.set(name, (totals.get(name) || 0) + (Number(row?.value) || 0));
  });
  return [...totals.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
};

module.exports = { mergePlanTotals };
