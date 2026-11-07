// Revenue on the admin dashboard counts only payments from launch day (5 Nov 2026, IST).
// Older payments are pre-launch test data. They stay in the database, they just are not counted.
const REVENUE_START = new Date('2026-11-04T18:30:00.000Z');

// Start of the chart window: the first day of the month three months back, but never before REVENUE_START.
const chartStart = (now = new Date()) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() - 3);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d < REVENUE_START ? REVENUE_START : d;
};

module.exports = { REVENUE_START, chartStart };
