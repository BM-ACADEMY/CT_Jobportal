import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, CalendarDays } from 'lucide-react';
import { API, inr, fmtDate, DRIVE_STATUS, inputCls } from '../drives/driveUi';

// Staff create a drive for a client (or for Velaivaaipu's own recruiter account). It goes live straight away.
const blankDrive = { title: '', date: '', venue: { name: '', address: '', city: '', mapUrl: '' }, roles: [{ title: '', vacancies: 1, pay: '' }], slots: [{ label: '10:00 AM - 12:00 PM', capacity: 50 }], documents: '', screeningQuestions: '', description: '', plan: 'free', paymentNote: '', organiserName: '' };
const CreateForClient = ({ onDone }) => {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blankDrive);
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);
  const [org, setOrg] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open || org) return undefined;
    const t = setTimeout(() => axios.get(`${API}/admin/drives/organisers`, { params: { q } }).then((r) => setFound(r.data)).catch(() => setFound([])), 250);
    return () => clearTimeout(t);
  }, [q, open, org]);
  const setRole = (i, k, v) => setF({ ...f, roles: f.roles.map((r, j) => (j === i ? { ...r, [k]: v } : r)) });
  const setSlot = (i, k, v) => setF({ ...f, slots: f.slots.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });
  const paid = f.plan !== 'free';
  const submit = async (e) => {
    e.preventDefault();
    if (!org) { toast.error('Choose the company or recruiter this drive is for'); return; }
    setBusy(true);
    try {
      const body = { ...f, organiserId: org.id, documents: f.documents.split(',').map((x) => x.trim()).filter(Boolean), screeningQuestions: f.screeningQuestions.split('\n').map((x) => x.trim()).filter(Boolean) };
      const r = await axios.post(`${API}/admin/drives/create`, body);
      toast.success(`Drive is live: ${r.data.url}`);
      setOpen(false); setF(blankDrive); setOrg(null); setQ(''); onDone();
    } catch (err) { toast.error(err.response?.data?.msg || 'Could not create the drive'); } finally { setBusy(false); }
  };
  if (!open) return <button onClick={() => setOpen(true)} className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold">Create a drive for a client</button>;
  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
      <div className="flex justify-between"><b>Create a drive for a client</b><button type="button" className="text-xs font-bold text-slate-500" onClick={() => setOpen(false)}>Close</button></div>
      <p className="text-xs text-slate-500">The drive goes live straight away under the account you choose. For a Velaivaaipu drive, choose the Velaivaaipu / Afra Ventures recruiter account.</p>
      {org ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm"><span><b>{org.name}</b> <span className="text-slate-500">{org.email}</span></span><button type="button" className="text-xs font-bold text-emerald-700" onClick={() => setOrg(null)}>Change</button></div>
      ) : (
        <div className="space-y-2">
          <input className={inputCls} placeholder="Search the company or recruiter by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="max-h-40 overflow-auto rounded-xl border border-slate-100 divide-y">{found.length === 0 ? <p className="p-3 text-xs text-slate-400">No account found.</p> : found.map((u) => <button type="button" key={u.id} onClick={() => setOrg(u)} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"><b>{u.name}</b> <span className="text-xs text-slate-500">{u.email}</span></button>)}</div>
        </div>
      )}
      <input className={inputCls} placeholder="Drive title, e.g. Walk-in for Sales Executives" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
      <input className={inputCls} placeholder="Name shown as the organiser (optional, default is the account name)" value={f.organiserName} onChange={(e) => setF({ ...f, organiserName: e.target.value })} />
      <input className={inputCls} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required />
      <input className={inputCls} placeholder="Venue name" value={f.venue.name} onChange={(e) => setF({ ...f, venue: { ...f.venue, name: e.target.value } })} />
      <input className={inputCls} placeholder="Venue address" value={f.venue.address} onChange={(e) => setF({ ...f, venue: { ...f.venue, address: e.target.value } })} required />
      <input className={inputCls} placeholder="City" value={f.venue.city} onChange={(e) => setF({ ...f, venue: { ...f.venue, city: e.target.value } })} />
      <input className={inputCls} placeholder="Google Maps link (optional)" value={f.venue.mapUrl} onChange={(e) => setF({ ...f, venue: { ...f.venue, mapUrl: e.target.value } })} />
      <p className="text-xs font-bold text-slate-600">Roles</p>
      {f.roles.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-2">
          <input className={`${inputCls} col-span-6`} placeholder="Role" value={r.title} onChange={(e) => setRole(i, 'title', e.target.value)} />
          <input className={`${inputCls} col-span-2`} type="number" min="1" value={r.vacancies} onChange={(e) => setRole(i, 'vacancies', e.target.value)} />
          <input className={`${inputCls} col-span-4`} placeholder="Pay" value={r.pay} onChange={(e) => setRole(i, 'pay', e.target.value)} />
        </div>
      ))}
      <button type="button" className="text-xs font-bold text-emerald-700" onClick={() => setF({ ...f, roles: [...f.roles, { title: '', vacancies: 1, pay: '' }] })}>+ Add role</button>
      <p className="text-xs font-bold text-slate-600">Time slots</p>
      {f.slots.map((s, i) => (
        <div key={i} className="grid grid-cols-12 gap-2">
          <input className={`${inputCls} col-span-8`} value={s.label} onChange={(e) => setSlot(i, 'label', e.target.value)} />
          <input className={`${inputCls} col-span-4`} type="number" min="1" value={s.capacity} onChange={(e) => setSlot(i, 'capacity', e.target.value)} />
        </div>
      ))}
      <button type="button" className="text-xs font-bold text-emerald-700" onClick={() => setF({ ...f, slots: [...f.slots, { label: '', capacity: 50 }] })}>+ Add slot</button>
      <input className={inputCls} placeholder="Documents to bring, separated by commas" value={f.documents} onChange={(e) => setF({ ...f, documents: e.target.value })} />
      <textarea className={`${inputCls} h-20 py-2`} placeholder="Screening questions, one per line (Drive Plus or Pro only)" value={f.screeningQuestions} onChange={(e) => setF({ ...f, screeningQuestions: e.target.value })} />
      <textarea className={`${inputCls} h-20 py-2`} placeholder="About the drive (optional)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <select className={inputCls} value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })}>
        <option value="free">Free (up to 50 registrations)</option>
        <option value="plus">Drive Plus (Rs 999 + GST)</option>
        <option value="pro">Drive Pro (Rs 2,999 + GST)</option>
      </select>
      {paid && <input className={inputCls} placeholder="How it was paid, e.g. UPI reference (required)" value={f.paymentNote} onChange={(e) => setF({ ...f, paymentNote: e.target.value })} required />}
      <button disabled={busy} className="w-full h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50">{busy ? 'Creating...' : 'Create and publish'}</button>
    </form>
  );
};

const ManageDrives = () => {
  const [list, setList] = useState(null);
  const [status, setStatus] = useState('pending_approval');
  const [notes, setNotes] = useState({});
  const load = useCallback(() => axios.get(`${API}/admin/drives`, { params: { status } }).then((r) => setList(r.data)).catch(() => { setList([]); toast.error('Failed to load drives'); }), [status]);
  useEffect(() => { setList(null); load(); }, [load]);

  const post = async (path, body, okMsg) => { try { await axios.post(`${API}/admin/drives/${path}`, body); toast.success(okMsg); await load(); } catch (e) { toast.error(e.response?.data?.msg || 'Failed'); } };

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-xl font-black text-slate-900 flex items-center gap-2"><CalendarDays size={20} className="text-emerald-600" /> Walk-in Drives</h1>
      <p className="text-xs text-slate-500">Paid plans and add-ons are confirmed here by hand after the money arrives. Nothing uses Razorpay.</p>
      <CreateForClient onDone={() => { setStatus('published'); load(); }} />
      <div className="flex gap-2 flex-wrap">{Object.entries(DRIVE_STATUS).map(([k, v]) => <button key={k} onClick={() => setStatus(k)} className={`h-9 px-3 rounded-full text-xs font-bold border ${status === k ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>{v}</button>)}</div>
      {!list ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" /></div>
        : list.length === 0 ? <p className="text-sm text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-100">Nothing here.</p>
        : list.map((d) => {
          const n = notes[d.id] || '';
          return (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
              <div className="flex justify-between gap-2"><b>{d.title}</b><span className="text-xs font-bold text-slate-500">{DRIVE_STATUS[d.status]}</span></div>
              <p className="text-xs text-slate-500">{d.organiserName} · {fmtDate(d.date)} · {[d.venue?.city, d.venue?.address].filter(Boolean).join(', ')}</p>
              <p className="text-xs text-slate-600">{d.roles.map((r) => `${r.title} (${r.vacancies})`).join(', ')}</p>
              {d.quote.lines.map((l) => (
                <div key={l.key} className="flex items-center justify-between gap-2 text-sm">
                  <span>{l.label}{l.qty > 1 ? ` x ${l.qty}` : ''}: {l.base ? inr(l.base) : 'Free'}</span>
                  {l.base > 0 && (l.paid ? <span className="text-xs font-bold text-emerald-700">Paid</span>
                    : <button disabled={!n} onClick={() => post(`${d.id}/mark-paid`, { key: l.key === d.plan ? 'plan' : l.key, note: n }, 'Marked paid')} className="h-8 px-3 rounded-full text-xs font-bold bg-amber-100 text-amber-800 disabled:opacity-40">Mark paid</button>)}
                </div>
              ))}
              <p className="text-sm font-black">Total with GST {inr(d.quote.total)}</p>
              {d.status === 'pending_approval' && (
                <>
                  <input className={inputCls} placeholder="Note (UPI reference for Mark paid, or the reason for Reject)" value={n} onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })} />
                  <div className="flex gap-2">
                    <button onClick={() => post(`${d.id}/review`, { decision: 'approve', note: n, ignoreUnpaidAddons: false }, 'Approved')} className="flex-1 h-10 rounded-xl bg-emerald-600 text-white text-sm font-bold">Approve</button>
                    <button onClick={() => post(`${d.id}/review`, { decision: 'reject', note: n }, 'Rejected')} className="flex-1 h-10 rounded-xl bg-rose-50 text-rose-700 text-sm font-bold border border-rose-200">Reject</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
    </div>
  );
};
export default ManageDrives;
