// Counts of automatic mails per mail type for the last 7 and 30 days (Admin > Feedback page, "Automatic mails").
// Pure. Source is EmailLog: one row per mail actually sent. A mail whose send failed is removed again so it can be retried,
// and the mail provider's open events are not stored, so `failed` and `opened` are reported as null ("not tracked")
// rather than as a made-up 0.
const { kindOf } = require('./emailPolicy');

const DAY = 86400000;
const WINDOWS = [7, 30];

const countByType = (logs, now = Date.now(), windows = WINDOWS) => {
  const rows = new Map();
  (logs || []).forEach((l) => {
    const age = now - new Date(l.sentAt).getTime();
    if (!Number.isFinite(age) || age < 0) return;
    const kind = kindOf(l.key);
    if (!kind) return;
    const row = rows.get(kind) || { kind, sent7: 0, sent30: 0 };
    if (age <= windows[0] * DAY) row.sent7 += 1;
    if (age <= windows[1] * DAY) row.sent30 += 1;
    if (row.sent30 || row.sent7) rows.set(kind, row);
  });
  const list = [...rows.values()].sort((a, b) => b.sent30 - a.sent30 || a.kind.localeCompare(b.kind));
  return {
    windows,
    rows: list.map((r) => ({ ...r, failed7: null, failed30: null, opened7: null, opened30: null })),
    totals: { sent7: list.reduce((a, r) => a + r.sent7, 0), sent30: list.reduce((a, r) => a + r.sent30, 0) },
    tracked: { failed: false, opened: false },
  };
};

module.exports = { countByType, WINDOWS };
