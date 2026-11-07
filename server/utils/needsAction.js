// Turns the things waiting for an admin (from several collections) into one list, oldest and most overdue first.
// Pure: no database, so it can be tested. Late after 24 hours, overdue after 48 hours.
const HOUR = 3600000;
const LATE_HOURS = 24;
const OVERDUE_HOURS = 48;

const levelFor = (ageHours) => (ageHours >= OVERDUE_HOURS ? 'overdue' : ageHours >= LATE_HOURS ? 'late' : 'ok');
const RANK = { overdue: 2, late: 1, ok: 0 };

const text = (v, max = 120) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);

const SOURCES = [
  { key: 'colleges', kind: 'college', label: 'College verification', link: '/admin/colleges',
    title: (x) => text(`${x.name}${x.code ? ` (${x.code})` : ''}`), detail: (x) => text(x.collegeEmail || x.collegePhone) },
  { key: 'tickets', kind: 'ticket', label: 'Support ticket', link: '/admin/tickets',
    title: (x) => text(String(x.category || 'ticket').replace(/_/g, ' ')), detail: (x) => text(x.accountIdentity) },
  { key: 'messages', kind: 'message', label: 'Contact message', link: '/admin/messages',
    title: (x) => text(x.subject || 'No subject'), detail: (x) => text(`${x.name || ''} ${x.email || ''}`) },
  { key: 'reviews', kind: 'review', label: 'Review', link: '/admin/reviews',
    title: (x) => text(`${x.rating || ''} star review`), detail: (x) => text(x.comment) },
  { key: 'requests', kind: 'request', label: 'Request', link: '/admin/requests',
    title: (x) => text(String(x.type || 'request').replace(/_/g, ' ')), detail: (x) => text(x.bookingName || x.bookingEmail) },
  { key: 'jobs', kind: 'job', label: 'Possible scam job', link: '/admin/jobs',
    title: (x) => text(x.title || 'Untitled job'), detail: (x) => text((x.scamFlags || []).join(', ').replace(/_/g, ' ')) }
];

const buildNeedsAction = (groups = {}, assignments = [], now = new Date()) => {
  const owners = new Map((assignments || []).map((a) => [`${a.kind}:${String(a.refId)}`, a]));
  const items = [];
  SOURCES.forEach((src) => {
    (groups[src.key] || []).forEach((row) => {
      const created = new Date(row.createdAt || now).getTime();
      const ageHours = Math.max(0, Math.floor((now.getTime() - created) / HOUR));
      const owner = owners.get(`${src.kind}:${String(row._id)}`);
      items.push({
        kind: src.kind, id: String(row._id), label: src.label, link: src.link,
        title: src.title(row), detail: src.detail(row),
        createdAt: new Date(created).toISOString(), ageHours, level: levelFor(ageHours),
        owner: owner ? { id: owner.ownerId, name: owner.ownerName } : null
      });
    });
  });
  items.sort((a, b) => RANK[b.level] - RANK[a.level] || b.ageHours - a.ageHours);
  const summary = {
    total: items.length,
    overdue: items.filter((i) => i.level === 'overdue').length,
    late: items.filter((i) => i.level === 'late').length,
    unassigned: items.filter((i) => !i.owner).length
  };
  return { items, summary };
};

module.exports = { buildNeedsAction, levelFor, LATE_HOURS, OVERDUE_HOURS };
