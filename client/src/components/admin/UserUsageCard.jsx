import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const day = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const Row = ({ k, v }) => (
  <div className="flex items-start justify-between gap-3 text-xs">
    <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px] shrink-0">{k}</span>
    <span className="font-semibold text-slate-700 text-right">{v}</span>
  </div>
);

// Plan, days left and what this person has used. Read only. Admins only: other staff just do not see the card.
const UserUsageCard = ({ userId }) => {
  const [d, setD] = useState(null);
  useEffect(() => {
    let live = true;
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${userId}/usage`).then((r) => { if (live) setD(r.data); }).catch(() => {});
    return () => { live = false; };
  }, [userId]);
  if (!d) return null;
  const p = d.plan;
  const tone = p.state === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : p.state === 'expired' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200';
  const label = p.state === 'active' ? 'Paid plan' : p.state === 'expired' ? 'Expired' : p.state === 'free' ? 'Free plan' : 'No plan';
  const left = p.daysLeft === null ? (p.state === 'active' ? 'No end date' : 'n/a') : `${p.daysLeft} day${p.daysLeft === 1 ? '' : 's'} left`;
  return (
    <Card className="p-6 rounded-[24px] border-slate-200 shadow-sm bg-white space-y-4">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Plan and usage</h3>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-900 text-sm">{p.name}</span>
        <Badge className={`${tone} text-[9px] font-bold uppercase`}>{label}</Badge>
      </div>
      <div className="space-y-2">
        {p.price > 0 && <Row k="Price" v={`${rupees(p.price)} ${p.duration || ''}`} />}
        {p.expiry && <Row k="Ends" v={`${day(p.expiry)} · ${left}`} />}
        {!p.expiry && p.state !== 'none' && <Row k="Validity" v={left} />}
        {p.price > 0 && <Row k="Auto-renew" v={p.autoRenew ? 'On' : 'Off'} />}
        {d.givenByAdmin && <Row k="Given by" v="our team (no payment found)" />}
      </div>
      {d.used.length > 0 && (<div className="space-y-2 pt-2 border-t border-slate-100"><p className="text-[10px] font-bold uppercase text-slate-400">Used from the plan</p>{d.used.map((u) => <Row key={u.key} k={u.label} v={u.value} />)}</div>)}
      {d.payPerFeature.length > 0 && (<div className="space-y-2 pt-2 border-t border-slate-100"><p className="text-[10px] font-bold uppercase text-slate-400">Bought separately</p>{d.payPerFeature.map((f, i) => <Row key={i} k={f.key} v={`${f.usageLeft} left${f.expiresAt ? ` · ${f.daysLeft} days` : ''}${f.active ? '' : ' · ended'}`} />)}</div>)}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <p className="text-[10px] font-bold uppercase text-slate-400">Free tools, last 30 days</p>
        {d.freeAi.map((a) => <Row key={a.kind} k={a.label} v={`${a.last30Days} used${a.lastUsedAt ? ` · last ${day(a.lastUsedAt)}` : ''}`} />)}
        <Row k="Skill tests taken" v={d.skillTests.total} />
        {d.skillTests.recent.map((t, i) => <Row key={i} k={`${t.skill}`} v={`${t.percentage}% · ${t.passed ? 'passed' : 'not passed'} · ${day(t.createdAt)}`} />)}
        <Row k="Jobs applied to" v={d.applications} />
        {d.jobsPosted > 0 && <Row k="Jobs posted" v={d.jobsPosted} />}
      </div>
      {d.payments.length > 0 && (<div className="space-y-2 pt-2 border-t border-slate-100"><p className="text-[10px] font-bold uppercase text-slate-400">Recent payments</p>{d.payments.map((x, i) => <Row key={i} k={day(x.at)} v={`${rupees(x.amount)} · ${x.status}`} />)}</div>)}
    </Card>
  );
};

export default UserUsageCard;
