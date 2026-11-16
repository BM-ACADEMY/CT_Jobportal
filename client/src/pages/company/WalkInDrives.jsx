import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { CalendarDays, Loader2 } from 'lucide-react';
import { API, inr, fmtDate, DRIVE_STATUS, inputCls } from '../drives/driveUi';

const blank = { title: '', date: '', venue: { name: '', address: '', city: '', mapUrl: '' }, roles: [{ title: '', vacancies: 1, pay: '' }], slots: [{ label: '10:00 AM - 12:00 PM', capacity: 50 }], documents: '', screeningQuestions: '', description: '', plan: 'free', addons: {} };

const MyDrives = () => {
  const [list, setList] = useState(null);
  const [plans, setPlans] = useState(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => axios.get(`${API}/drives/mine`).then((r) => setList(r.data)).catch(() => setList([])), []);
  useEffect(() => { load(); axios.get(`${API}/drives/plans`).then((r) => setPlans(r.data)); }, [load]);

  const plan = plans?.plans.find((p) => p.key === f.plan);
  const chosen = Object.entries(f.addons).filter(([, q]) => q > 0);
  const base = (plan?.price || 0) + chosen.reduce((s, [k, q]) => s + (plans.addons.find((a) => a.key === k)?.price || 0) * q, 0);
  const total = Math.round(base * (1 + (plans?.gstRate || 0.18)) * 100) / 100;

  const setRole = (i, k, v) => setF({ ...f, roles: f.roles.map((r, j) => (j === i ? { ...r, [k]: v } : r)) });
  const setSlot = (i, k, v) => setF({ ...f, slots: f.slots.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const body = { ...f, documents: f.documents.split(',').map((x) => x.trim()).filter(Boolean), screeningQuestions: f.screeningQuestions.split('\n').map((x) => x.trim()).filter(Boolean), addons: chosen.map(([key, qty]) => ({ key, qty })) };
      const r = await axios.post(`${API}/drives`, body);
      toast.success(r.data.msg); setOpen(false); setF(blank); load();
    } catch (err) { toast.error(err.response?.data?.msg || 'Could not save the drive'); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2"><CalendarDays size={20} className="text-emerald-600" /> Walk-in Drives</h1>
        <button onClick={() => setOpen(!open)} className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold">{open ? 'Close' : 'New drive'}</button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <input className={inputCls} placeholder="Drive title, e.g. Walk-in for Sales Executives" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
          <input className={inputCls} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required />
          <input className={inputCls} placeholder="Venue name" value={f.venue.name} onChange={(e) => setF({ ...f, venue: { ...f.venue, name: e.target.value } })} />
          <input className={inputCls} placeholder="Venue address" value={f.venue.address} onChange={(e) => setF({ ...f, venue: { ...f.venue, address: e.target.value } })} required />
          <input className={inputCls} placeholder="City" value={f.venue.city} onChange={(e) => setF({ ...f, venue: { ...f.venue, city: e.target.value } })} />
          <input className={inputCls} placeholder="Google Maps link (optional)" value={f.venue.mapUrl} onChange={(e) => setF({ ...f, venue: { ...f.venue, mapUrl: e.target.value } })} />

          <p className="text-xs font-bold text-slate-600">Roles</p>
          {f.roles.map((r, i) => (
            <div key={i} className="grid grid-cols-6 gap-2">
              <input className={`${inputCls} col-span-3`} placeholder="Role" value={r.title} onChange={(e) => setRole(i, 'title', e.target.value)} />
              <input className={`${inputCls} col-span-1`} type="number" min="1" value={r.vacancies} onChange={(e) => setRole(i, 'vacancies', e.target.value)} />
              <input className={`${inputCls} col-span-2`} placeholder="Pay" value={r.pay} onChange={(e) => setRole(i, 'pay', e.target.value)} />
            </div>
          ))}
          <button type="button" className="text-xs font-bold text-emerald-700" onClick={() => setF({ ...f, roles: [...f.roles, { title: '', vacancies: 1, pay: '' }] })}>+ Add role</button>

          <p className="text-xs font-bold text-slate-600">Time slots (people per slot)</p>
          {f.slots.map((s, i) => (
            <div key={i} className="grid grid-cols-4 gap-2">
              <input className={`${inputCls} col-span-3`} value={s.label} onChange={(e) => setSlot(i, 'label', e.target.value)} />
              <input className={inputCls} type="number" min="1" value={s.capacity} onChange={(e) => setSlot(i, 'capacity', e.target.value)} />
            </div>
          ))}
          <button type="button" className="text-xs font-bold text-emerald-700" onClick={() => setF({ ...f, slots: [...f.slots, { label: '', capacity: 50 }] })}>+ Add slot</button>

          <input className={inputCls} placeholder="Documents to bring, separated by commas" value={f.documents} onChange={(e) => setF({ ...f, documents: e.target.value })} />
          <textarea className={`${inputCls} h-24 py-2`} placeholder="Screening questions, one per line (Drive Plus, Pro, or the add-on)" value={f.screeningQuestions} onChange={(e) => setF({ ...f, screeningQuestions: e.target.value })} />
          <textarea className={`${inputCls} h-24 py-2`} placeholder="About the drive (optional)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />

          {plans && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-600">Choose a plan (per drive, GST extra)</p>
              {plans.plans.map((p) => (
                <label key={p.key} className={`block rounded-xl border p-3 text-sm ${f.plan === p.key ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                  <input type="radio" name="plan" className="mr-2" checked={f.plan === p.key} onChange={() => setF({ ...f, plan: p.key })} />
                  <b>{p.label}</b> · {p.price ? inr(p.price) : 'Free'} · up to {p.maxRegistrations} registrations{p.qrCheckIn ? ' · QR check-in' : ''}{p.homeSpotDays ? ` · home page spot ${p.homeSpotDays} days` : ''}
                </label>
              ))}
              <p className="text-xs font-bold text-slate-600 pt-1">Add-ons (any plan)</p>
              {plans.addons.map((a) => (
                <label key={a.key} className="flex items-center justify-between gap-2 text-sm">
                  <span><input type="checkbox" className="mr-2" checked={!!f.addons[a.key]} onChange={(e) => setF({ ...f, addons: { ...f.addons, [a.key]: e.target.checked ? 1 : 0 } })} />{a.label}</span>
                  <span className="text-slate-500 whitespace-nowrap">{inr(a.price)}</span>
                </label>
              ))}
              <p className="text-sm font-black text-slate-900">Total with 18% GST: {inr(total)}</p>
              {total > 0 && <p className="text-xs text-slate-500">We will contact you to take payment. Your drive goes live after we confirm it.</p>}
            </div>
          )}
          <button disabled={busy} className="w-full h-12 rounded-xl bg-emerald-600 text-white font-black disabled:opacity-60">{busy ? 'Please wait…' : 'Send for approval'}</button>
        </form>
      )}

      {!list ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" /></div>
        : list.length === 0 ? <p className="text-sm text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-100">No drives yet. Your first one each month is free.</p>
        : list.map((d) => (
          <Link key={d.id} to={`/company/drives/${d.id}`} className="block bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex justify-between gap-2"><b className="text-slate-900">{d.title}</b><span className="text-xs font-bold text-emerald-700">{DRIVE_STATUS[d.status]}</span></div>
            <p className="text-xs text-slate-500 mt-1">{fmtDate(d.date)} · {d.registered} registered</p>
            {d.adminNote && <p className="text-xs text-rose-600 mt-1">{d.adminNote}</p>}
          </Link>
        ))}
    </div>
  );
};
export default MyDrives;
