// Midnight today in India time (IST, UTC+5:30), as a Date. Pure: pass `now` in tests.
const istDayStart = (now = new Date()) => {
  const ist = new Date(new Date(now).getTime() + 5.5 * 3600000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 3600000);
};
module.exports = { istDayStart };
