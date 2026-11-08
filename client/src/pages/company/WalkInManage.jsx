import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, QrCode } from 'lucide-react';
import { API, inr, fmtDate, STATUS_TEXT, DRIVE_STATUS, inputCls } from '../drives/driveUi';

const RESULTS = [['shortlisted', 'Shortlist'], ['selected', 'Select'], ['on_hold', 'Hold'], ['not_selected', 'Reject']];

const ManageDrive = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState(null);
  const [code, setCode] = useState('');
  const [last, setLast] = useState(null);
  const [report, setReport] = useState(null);

  const load = useCallback(() => axios.get(`${API}/drives/mine/${id}`).then((r) => setData(r.data)).catch(() => toast.error('Could not load this drive')), [id]);
  useEffect(() => { load(); axios.get(`${API}/drives/plans`).then((r) => setPlans(r.data)); }, [load]);

  const act = async (fn, okMsg) => { try { const r = await fn(); if (okMsg) toast.success(okMsg); await load(); return r; } catch (e) { toast.error(e.response?.data?.msg || 'Something went wrong'); } };
  const checkIn = async (e) => {
    e.preventDefault();
    const v = code.trim(); const body = /^\d[\d\s+-]{8,}$/.test(v) ? { phone: v } : { code: v };
    const r = await act(() => axios.post(`${API}/drives/mine/${id}/check-in`, body));
    if (r) { setLast(r.data); setCode(''); }
  };
  const setResult = (regId, status) => {
    const joiningDate = status === 'selected' ? window.prompt('Joining date (YYYY-MM-DD), or leave empty') : undefined;
    return act(() => axios.patch(`${API}/drives/mine/${id}/registrations/${regId}`, { status, joiningDate: joiningDate || undefined }));
  };
  const loadReport = async () => { const r = await act(() => axios.get(`${API}/drives/mine/${id}/report`)); if (r) setReport(r.data); };
  const csv = async () => {
    try {
      const r = await axios.get(`${API}/drives/mine/${id}/report`, { params: { format: 'csv' }, responseType: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = 'drive-report.csv'; a.click();
    } catch (e) { toast.error('The full report needs Drive Plus or the report add-on'); }
  };

  if (!data) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>;
  const { drive, summary, registrations, quote } = data;
  const live = drive.status === 'published';

  return (
    <div className="space-y-5 max-w-3xl">
      <Link to="/company/drives" className="text-xs font-bold text-emerald-700">← All drives</Link>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
        <h1 className="text-lg font-black text-slate-900">{drive.title}</h1>
        <p className="text-sm text-slate-600">{fmtDate(drive.date)} · {DRIVE_STATUS[drive.status]}</p>
        {drive.adminNote && <p className="text-xs text-rose-600">{drive.adminNote}</p>}
        {live && <><p className="text-xs text-slate-500 break-all">Share: {data.url}</p>
          <a className="inline-flex h-10 px-4 items-center rounded-xl bg-emerald-600 text-white text-sm font-bold" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(data.shareText)}`}>Share on WhatsApp</a></>}
        <p className="text-sm text-slate-700">{summary.registered} registered · {summary.attended} attended · {summary.selected} selected</p>
      </div>

      {live && (
        <form onSubmit={checkIn} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
          <h2 className="font-black text-slate-900 flex items-center gap-2"><QrCode size={16} className="text-emerald-600" /> Desk check-in</h2>
          <input className={inputCls} placeholder="Pass code or mobile number" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="w-full h-11 rounded-xl bg-emerald-600 text-white font-black">Check in</button>
          {last && <p className="text-sm font-bold text-emerald-700">{last.name}: {last.already ? 'already checked in, ' : ''}token {last.tokenNumber}</p>}
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <h2 className="font-black text-slate-900">People ({registrations.length})</h2>
        {registrations.length === 0 && <p className="text-sm text-slate-500">Nobody yet.</p>}
        {registrations.map((r) => (
          <div key={r._id} className="border-t border-slate-100 pt-2">
            <div className="flex justify-between gap-2 text-sm"><b>{r.name}</b><span className="text-xs font-bold text-slate-500">{STATUS_TEXT[r.status]}{r.tokenNumber ? ` · #${r.tokenNumber}` : ''}</span></div>
            <p className="text-xs text-slate-500">{r.phone} · {r.slot}</p>
            {r.answers?.map((a) => a.answer && <p key={a.question} className="text-xs text-slate-600">{a.question} {a.answer}</p>)}
            {r.status !== 'registered' && <div className="flex gap-1.5 flex-wrap mt-1.5">{RESULTS.map(([s, l]) => <button key={s} onClick={() => setResult(r._id, s)} className={`h-8 px-3 rounded-full text-xs font-bold border ${r.status === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>{l}</button>)}</div>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
        <h2 className="font-black text-slate-900">Plan and add-ons</h2>
        {quote.lines.map((l) => <p key={l.key} className="text-sm text-slate-700 flex justify-between"><span>{l.label}{l.qty > 1 ? ` x ${l.qty}` : ''}</span><span>{l.base ? inr(l.base) : 'Free'} {l.base ? (l.paid ? '· paid' : '· not paid yet') : ''}</span></p>)}
        <p className="text-sm font-black">Total with GST: {inr(quote.total)}{quote.due.total > 0 ? ` (to pay: ${inr(quote.due.total)})` : ''}</p>
        {plans && <select className={inputCls} defaultValue="" onChange={(e) => { const key = e.target.value; e.target.value = ''; if (key) act(() => axios.post(`${API}/drives/mine/${id}/addons`, { key }), 'Added. It starts once we confirm payment.'); }}>
          <option value="">Add an extra…</option>
          {plans.addons.map((a) => <option key={a.key} value={a.key}>{a.label} · {inr(a.price)}</option>)}
        </select>}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
        <h2 className="font-black text-slate-900">After the drive</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={loadReport} className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold">Show report</button>
          <button onClick={csv} className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold">Download list (CSV)</button>
          <button onClick={() => act(() => axios.post(`${API}/drives/mine/${id}/thanks`), 'Thank-you mails sent')} className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold">Send thank-you mails</button>
        </div>
        {report && <div className="text-sm text-slate-700 space-y-1">
          <p>Registered {report.summary.registered} · Attended {report.summary.attended} · No-show {report.summary.noShow}</p>
          <p>Shortlisted {report.summary.shortlisted} · Selected {report.summary.selected} · On hold {report.summary.onHold} · Not selected {report.summary.notSelected}</p>
          {report.costPerHire != null && <p className="font-bold">Cost per hire: {inr(report.costPerHire)}</p>}
          {report.bySlot && Object.entries(report.bySlot).map(([s, v]) => <p key={s}>{s}: {v.attended} of {v.registered} came</p>)}
        </div>}
      </div>
    </div>
  );
};
export default ManageDrive;
