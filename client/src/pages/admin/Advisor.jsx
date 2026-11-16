import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const DOT = { green: 'bg-emerald-500', amber: 'bg-amber-400', red: 'bg-rose-500' };
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const Advisor = () => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState(null);

  const load = useCallback(() => axios.get(`${API}/admin/advisor`).then((r) => setData(r.data)).catch(() => { setData({}); toast.error('Failed to load'); }), []);
  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setBusy(true);
    try { const r = await axios.post(`${API}/admin/advisor/generate`); if (r.data.aiError) toast.message(r.data.aiError); await load(); }
    catch { toast.error('Could not write the note'); } finally { setBusy(false); }
  };
  const ask = async (e) => {
    e.preventDefault(); setBusy(true); setAnswer(null);
    try { const r = await axios.post(`${API}/admin/advisor/ask`, { question: q }); setAnswer(r.data.answer || r.data.aiError); setQ(''); await load(); }
    catch (err) { toast.error(err.response?.data?.msg || 'Could not answer'); } finally { setBusy(false); }
  };
  const decide = async (id, status) => { try { await axios.post(`${API}/admin/advisor/ideas/${id}`, { status }); await load(); } catch { toast.error('Failed'); } };

  if (!data) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>;
  const { latest, ideas = [], accepted = [], later = [], questions = [] } = data;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2"><Sparkles size={20} className="text-emerald-600" /> Business advisor</h1>
        <button disabled={busy} onClick={generate} className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-60">{busy ? 'Working…' : 'Write this week’s note'}</button>
      </div>
      <p className="text-xs text-slate-500">The numbers are counted by the system. The AI only explains them and suggests ideas; it never changes prices, plans, payments or settings. Only totals are sent to it, never personal details.</p>

      {!latest ? <p className="text-sm text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-100">No note yet. Press the button to write the first one.</p> : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
            <p className="text-xs text-slate-500">Last 7 days compared with the 7 before · {new Date(latest.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            {latest.metrics.map((m) => (
              <div key={m.key} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${DOT[m.status]}`} />{m.label}</span>
                <span className="font-bold">{fmt(m.value)} <span className="font-normal text-xs text-slate-400">(was {fmt(m.previous)})</span></span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
            {latest.summary ? <p className="text-sm text-slate-800">{latest.summary}</p> : <p className="text-sm text-slate-500">{latest.aiError || 'No AI note this week.'}</p>}
            {latest.good?.map((g) => <p key={g} className="text-sm text-emerald-700">+ {g}</p>)}
            {latest.bad?.map((b) => <p key={b} className="text-sm text-rose-700">− {b}</p>)}
          </div>
          {ideas.map((i) => (
            <div key={i._id} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-1.5">
              <p className="font-black text-slate-900">{i.title}</p>
              <p className="text-sm text-slate-600">{i.reason}</p>
              <p className="text-xs text-slate-500">Numbers: {i.numbers}</p>
              {i.status === 'suggested' ? (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => decide(i._id, 'accepted')} className="h-9 px-4 rounded-full bg-emerald-600 text-white text-xs font-bold">Accept</button>
                  <button onClick={() => decide(i._id, 'later')} className="h-9 px-4 rounded-full border border-slate-200 text-xs font-bold">Later</button>
                  <button onClick={() => decide(i._id, 'rejected')} className="h-9 px-4 rounded-full border border-rose-200 text-rose-700 text-xs font-bold">Reject</button>
                </div>
              ) : <p className="text-xs font-bold text-slate-500">{i.status}</p>}
            </div>
          ))}
        </>
      )}

      {accepted.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
          <h2 className="font-black text-slate-900">Accepted, to do</h2>
          {accepted.map((i) => <div key={i._id} className="flex items-center justify-between gap-2 text-sm"><span>{i.title}</span><button onClick={() => decide(i._id, 'done')} className="h-8 px-3 rounded-full bg-slate-900 text-white text-xs font-bold">Done</button></div>)}
        </div>
      )}
      {later.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
          <h2 className="font-black text-slate-900">For later</h2>
          {later.map((i) => <div key={i._id} className="flex items-center justify-between gap-2 text-sm"><span>{i.title}</span><button onClick={() => decide(i._id, 'accepted')} className="h-8 px-3 rounded-full border border-slate-200 text-xs font-bold">Accept now</button></div>)}
        </div>
      )}

      <form onSubmit={ask} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
        <h2 className="font-black text-slate-900">Ask a question</h2>
        <input className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm" placeholder="Why were there fewer signups this week?" value={q} onChange={(e) => setQ(e.target.value)} />
        <button disabled={busy || q.trim().length < 5} className="h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-50">Ask</button>
        {answer && <p className="text-sm text-slate-800 pt-1">{answer}</p>}
        {questions.length > 0 && <div className="pt-2 space-y-1">{questions.slice(0, 5).map((x) => <p key={x._id} className="text-xs text-slate-500"><b>{x.question}</b> {x.summary || x.aiError}</p>)}</div>}
      </form>
    </div>
  );
};
export default Advisor;
