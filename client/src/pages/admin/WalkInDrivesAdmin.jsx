import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, CalendarDays } from 'lucide-react';
import { API, inr, fmtDate, DRIVE_STATUS, inputCls } from '../drives/driveUi';

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
