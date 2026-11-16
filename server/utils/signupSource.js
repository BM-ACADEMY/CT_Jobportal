// Where each new account came from. Only the three standard ad-link tags are kept, cleaned and short.
const part = (v) => String(v == null ? '' : v).toLowerCase().replace(/[^a-z0-9 _.\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);

const cleanUtm = (raw) => {
  const o = raw && typeof raw === 'object' ? raw : {};
  const out = { source: part(o.source), medium: part(o.medium), campaign: part(o.campaign) };
  return out.source || out.medium || out.campaign ? out : { source: '', medium: '', campaign: '' };
};

// One readable channel name per person. An invite link counts when no ad tag was kept.
const channelOf = (u = {}) => {
  const s = u.signupSource || {};
  if (s.source || s.medium || s.campaign) return [s.source || 'unknown', s.medium, s.campaign].filter(Boolean).join(' / ');
  return u.referredBy ? 'invite link' : 'direct or unknown';
};

// users: [{signupSource, referredBy, isVerified, roleName}] -> rows sorted by signups, biggest first.
const summarize = (users = []) => {
  const map = new Map();
  for (const u of users) {
    const k = channelOf(u);
    const r = map.get(k) || { channel: k, signups: 0, verified: 0, jobseekers: 0, companies: 0, colleges: 0 };
    r.signups += 1;
    if (u.isVerified) r.verified += 1;
    if (u.roleName === 'jobseeker') r.jobseekers += 1;
    else if (u.roleName === 'recruiter' || u.roleName === 'company') r.companies += 1;
    else if (u.roleName === 'college') r.colleges += 1;
    map.set(k, r);
  }
  return [...map.values()].sort((a, b) => b.signups - a.signups || a.channel.localeCompare(b.channel));
};

const cleanDays = (v) => ([7, 30, 60, 90].includes(parseInt(v, 10)) ? parseInt(v, 10) : 30);

// Results per ad source (the utm_source word, e.g. "meta"). Spend entries carry the same word.
// users: [{_id, signupSource}], paidByUser: {userId: rupees paid}, spends: [{source, amount}] -> sorted by spend then signups.
const sourceOf = (u = {}) => (u.signupSource && u.signupSource.source) || '';
const resultsBySource = (users = [], paidByUser = {}, spends = []) => {
  const map = new Map();
  const row = (k) => { if (!map.has(k)) map.set(k, { source: k, signups: 0, paid: 0, revenue: 0, spend: 0 }); return map.get(k); };
  for (const u of users) {
    const k = sourceOf(u);
    if (!k) continue;
    const r = row(k);
    r.signups += 1;
    const paid = Number(paidByUser[String(u._id)] || 0);
    if (paid > 0) { r.paid += 1; r.revenue += paid; }
  }
  for (const sp of spends) { const k = part(sp.source); if (k) row(k).spend += Number(sp.amount) || 0; }
  return [...map.values()].map((r) => ({
    ...r,
    revenue: Math.round(r.revenue),
    spend: Math.round(r.spend),
    costPerSignup: r.spend > 0 && r.signups > 0 ? Math.round(r.spend / r.signups) : null,
    costPerPaid: r.spend > 0 && r.paid > 0 ? Math.round(r.spend / r.paid) : null,
    attention: r.spend > 0 && r.signups === 0 ? 'Money spent, no signups yet' : (r.spend > 0 && r.paid === 0 && r.signups >= 20 ? 'Signups but no paying customer yet' : '')
  })).sort((a, b) => b.spend - a.spend || b.signups - a.signups || a.source.localeCompare(b.source));
};

module.exports = { cleanUtm, channelOf, summarize, cleanDays, part, resultsBySource };
