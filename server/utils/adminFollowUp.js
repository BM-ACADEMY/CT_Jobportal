// Decisions for the admin follow-up jobs. Pure functions (no database, no clock), so they can be tested.
const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Items that have no owner yet, for a type that has a routing rule -> who should own each.
const planAutoAssign = (items = [], rules = []) => {
  const byKind = new Map((rules || []).map((r) => [r.kind, r]));
  return (items || [])
    .filter((i) => !i.owner && byKind.has(i.kind))
    .map((i) => ({ kind: i.kind, id: i.id, ownerId: byKind.get(i.kind).ownerId, ownerName: byKind.get(i.kind).ownerName }));
};

// Late (24h+) items with an owner remind the owner; overdue (48h+) items go to the super admin.
// `sent` is a Set of keys already sent, so each reminder goes out once.
const planReminders = (items = [], sent = new Set()) => {
  const ownerReminders = [];
  const escalations = [];
  (items || []).forEach((i) => {
    const lateKey = `late:${i.kind}:${i.id}`;
    const overdueKey = `overdue:${i.kind}:${i.id}`;
    if ((i.level === 'late' || i.level === 'overdue') && i.owner && !sent.has(lateKey)) ownerReminders.push({ item: i, key: lateKey });
    if (i.level === 'overdue' && !sent.has(overdueKey)) escalations.push({ item: i, key: overdueKey });
  });
  return { ownerReminders, escalations };
};

const ageText = (h) => (h < 24 ? `${h}h` : `${Math.floor(h / 24)}d ${h % 24}h`);

const itemsHtml = (items) => `<ul style="padding-left:18px;margin:8px 0">${items.map((i) =>
  `<li><strong>${esc(i.label)}</strong>: ${esc(i.title)} (${ageText(i.ageHours)}${i.owner ? `, owner ${esc(i.owner.name)}` : ', no owner'})</li>`).join('')}</ul>`;

const escalationBody = (items) => `<p>${items.length} item${items.length === 1 ? ' has' : 's have'} waited more than 48 hours:</p>${itemsHtml(items.slice(0, 15))}${items.length > 15 ? `<p>and ${items.length - 15} more.</p>` : ''}`;

const digestBody = ({ summary, items, failedPayments = 0, newUsers = 0, revenue = 0 }) => `
  <p><strong>${summary.total}</strong> waiting, <strong>${summary.overdue}</strong> overdue, <strong>${summary.late}</strong> late, <strong>${summary.unassigned}</strong> with no owner.</p>
  <p>Last 24 hours: <strong>${newUsers}</strong> new users, <strong>₹${Number(revenue || 0).toLocaleString('en-IN')}</strong> in completed payments, <strong>${failedPayments}</strong> failed payment${failedPayments === 1 ? '' : 's'}.</p>
  ${items.length ? `<p>Oldest first:</p>${itemsHtml(items.slice(0, 10))}` : '<p>Nothing is waiting.</p>'}`;

const paymentAlertBody = (rows) => `<p>${rows.length} payment${rows.length === 1 ? '' : 's'} failed:</p><ul style="padding-left:18px;margin:8px 0">${rows.map((p) =>
  `<li>₹${Number(p.amount || 0).toLocaleString('en-IN')} ${esc(p.email || p.user || '')} at ${esc(new Date(p.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))}</li>`).join('')}</ul><p>A reply to the customer with a retry link recovers many of these.</p>`;

module.exports = { planAutoAssign, planReminders, escalationBody, digestBody, paymentAlertBody };
