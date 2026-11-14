// Finding and merging duplicate colleges (Admin only). Logic is separate from Express and takes its models as arguments,
// so it can be tested without a database. Nothing is ever deleted: the source college is marked merged and switched off.
const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.in', 'yahoo.co.in', 'outlook.com', 'hotmail.com', 'live.com', 'rediffmail.com', 'icloud.com', 'proton.me', 'protonmail.com', 'aol.com']);

const normaliseName = (name) => String(name || '').toLowerCase()
  .replace(/['’`]/g, '')
  .replace(/&/g, ' and ').replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\b(the|of)\b/g, ' ').replace(/\s+/g, ' ').trim();
const normaliseCity = (loc) => String(loc || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

// The domain of an institutional address; '' for free mail providers and anything unusable.
const emailDomain = (email) => {
  const m = String(email || '').trim().toLowerCase().match(/^[^@\s]+@([a-z0-9.-]+\.[a-z]{2,})$/);
  return m && !FREE_MAIL.has(m[1]) ? m[1] : '';
};
const domainsOf = (c) => [...new Set([c.collegeEmail, c.principalEmail].map(emailDomain).filter(Boolean))];

// colleges: plain objects. Groups of two or more likely duplicates (same name+city, or a shared institutional email domain).
// Colleges already merged away are ignored. Returns [{ reason, colleges: [...] }].
const findDuplicateGroups = (colleges = []) => {
  const live = colleges.filter((c) => c && !c.mergedInto);
  const parent = new Map(live.map((c) => [String(c._id), String(c._id)]));
  const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  const union = (a, b) => { const ra = find(a); const rb = find(b); if (ra !== rb) parent.set(ra, rb); };
  const keyMembers = new Map(); // 'kind:key' -> { label, ids }
  const link = (kind, key, id, label) => {
    if (!key) return;
    const k = `${kind}:${key}`;
    const e = keyMembers.get(k) || keyMembers.set(k, { label, ids: [] }).get(k);
    if (e.ids.length) union(e.ids[0], id);
    e.ids.push(id);
  };
  for (const c of live) {
    const id = String(c._id);
    const n = normaliseName(c.name);
    link('name', n ? `${n}|${normaliseCity(c.location)}` : '', id, 'Same name and city');
    for (const d of domainsOf(c)) link('domain', d, id, `Same email domain (${d})`);
  }
  const groups = new Map();
  for (const c of live) { const r = find(String(c._id)); (groups.get(r) || groups.set(r, []).get(r)).push(c); }
  return [...groups.values()].filter((g) => g.length > 1).map((g) => {
    const ids = new Set(g.map((c) => String(c._id)));
    const why = [...keyMembers.values()].filter((r) => r.ids.length > 1 && ids.has(r.ids[0])).map((r) => r.label);
    return { reason: [...new Set(why)].join('; '), colleges: g };
  });
};

const ID = /^[0-9a-fA-F]{24}$/;

// Moves everything that points at `source` over to `target`, keeps the target, marks the source merged, writes an audit row.
// m: { College, CollegeStudent, CampusDrive, CollegeDriveEvent, CollegeEmployer, CollegePlacementReport, CollegePackPayment,
//      AccreditationExportLog, CollegeActivityLog, AdminRequest, User }
const mergeColleges = async ({ sourceId, targetId, actor = {}, models: m, now = new Date() }) => {
  if (!ID.test(String(sourceId)) || !ID.test(String(targetId))) return { error: 'Choose two colleges.', status: 400 };
  if (String(sourceId) === String(targetId)) return { error: 'A college cannot be merged into itself.', status: 400 };
  const [source, target] = await Promise.all([m.College.findById(sourceId), m.College.findById(targetId)]);
  if (!source || !target) return { error: 'College not found.', status: 404 };
  if (source.mergedInto) return { error: 'The college you are merging away was already merged.', status: 409 };
  if (target.mergedInto) return { error: 'The college you are keeping was merged into another one. Pick that one instead.', status: 409 };

  const moved = {};
  const moveAll = async (key, Model, field = 'college') => {
    if (!Model) return;
    const r = await Model.updateMany({ [field]: source._id }, { $set: { [field]: target._id } });
    moved[key] = r?.modifiedCount ?? r?.nModified ?? 0;
  };
  // Models with a one-per-college rule: move only rows the target does not already have, leave the rest in place.
  const moveUnique = async (key, Model, keyField) => {
    if (!Model) return;
    const have = new Set((await Model.find({ college: target._id }).select(keyField).lean()).map((r) => String(r[keyField])));
    const rows = await Model.find({ college: source._id }).select(`_id ${keyField}`).lean();
    const ids = rows.filter((r) => !have.has(String(r[keyField]))).map((r) => r._id);
    if (ids.length) await Model.updateMany({ _id: { $in: ids } }, { $set: { college: target._id } });
    moved[key] = ids.length;
    moved[`${key}Left`] = rows.length - ids.length;
  };

  await moveUnique('students', m.CollegeStudent, 'user');
  await moveAll('drives', m.CampusDrive);
  await moveAll('driveEvents', m.CollegeDriveEvent);
  await moveUnique('employers', m.CollegeEmployer, 'name');
  await moveAll('placementReports', m.CollegePlacementReport);
  await moveAll('packPayments', m.CollegePackPayment);
  await moveAll('accreditationExports', m.AccreditationExportLog);
  await moveAll('activity', m.CollegeActivityLog);
  await moveAll('requests', m.AdminRequest);
  await moveAll('accounts', m.User, 'collegeProfile.college');

  // Team members who are not already on the target come along.
  const onTarget = new Set((target.teamMembers || []).map((t) => String(t.user)));
  const extra = (source.teamMembers || []).filter((t) => !onTarget.has(String(t.user)));
  if (extra.length) target.teamMembers = [...(target.teamMembers || []), ...extra.map((t) => (typeof t.toObject === 'function' ? t.toObject() : t))];
  moved.teamMembers = extra.length;
  await target.save();

  source.mergedInto = target._id; source.mergedAt = now; source.mergedBy = String(actor.id || '');
  source.isActive = false;
  await source.save();

  // Audit trail on both colleges (who, when, what moved).
  const base = { actor: actor.id, actorName: actor.name || 'Super Admin', entityType: 'college', metadata: { sourceId: String(source._id), targetId: String(target._id), moved } };
  await m.CollegeActivityLog.insertMany([
    { ...base, college: target._id, entity: source._id, action: 'college_merged_in', description: `Merged duplicate college "${source.name}" into this college` },
    { ...base, college: source._id, entity: target._id, action: 'college_merged_out', description: `This college was merged into "${target.name}"` },
  ]);
  return { ok: true, status: 200, target: { id: String(target._id), name: target.name }, source: { id: String(source._id), name: source.name }, moved };
};

module.exports = { normaliseName, normaliseCity, emailDomain, findDuplicateGroups, mergeColleges };
