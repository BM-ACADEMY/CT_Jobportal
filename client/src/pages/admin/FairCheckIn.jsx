import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

// Check-in on the day of one of our own fairs: search a name or phone, tap to check in. Counts refresh every 15 seconds.
const FairCheckIn = () => {
  const { id } = useParams();
  const [q, setQ] = useState('');
  const [data, setData] = useState(null);
  const qRef = useRef('');
  qRef.current = q;

  const load = useCallback(() => axios.get(`${API}/job-fairs/admin/${id}/checkin`, { params: { q: qRef.current } })
    .then((r) => setData(r.data)).catch(() => toast.error('Could not load check-in')), [id]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q, load]);
  useEffect(() => { const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const tap = async (kind, row) => {
    try {
      const r = await axios.post(`${API}/job-fairs/admin/${id}/checkin`, { kind, id: row.id, undo: row.checkedIn });
      setData((d) => ({ ...d, counts: r.data.counts, [kind === 'seeker' ? 'seekers' : 'stalls']: d[kind === 'seeker' ? 'seekers' : 'stalls'].map((x) => (x.id === row.id ? { ...x, checkedIn: !row.checkedIn } : x)) }));
    } catch (err) { toast.error(err.response?.data?.msg || 'Could not check in'); }
  };

  const Row = ({ kind, row, sub }) => (
    <button type="button" onClick={() => tap(kind, row)} className={`w-full text-left flex justify-between items-center gap-2 p-3 rounded-xl border ${row.checkedIn ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'}`}>
      <span><b className="text-sm">{row.name || 'No name'}</b><br /><span className="text-xs text-slate-500">{sub}</span></span>
      <span className={`text-xs font-bold ${row.checkedIn ? 'text-emerald-700' : 'text-slate-500'}`}>{row.checkedIn ? 'Checked in. Tap to undo' : 'Tap to check in'}</span>
    </button>
  );

  if (!data) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>;
  const c = data.counts;
  return (
    <div className="space-y-4 max-w-xl">
      <Link to="/admin/job-fairs" className="text-xs font-bold text-emerald-700">Back to job fairs</Link>
      <h1 className="text-xl font-black text-slate-900">Check-in: {data.title}</h1>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-white rounded-2xl border border-slate-100 p-3"><p className="text-2xl font-black text-slate-900">{c.seekerIn} / {c.going}</p><p className="text-xs text-slate-500">Job seekers in / registered</p></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-3"><p className="text-2xl font-black text-slate-900">{c.stallsIn} / {c.stallsApproved}</p><p className="text-xs text-slate-500">Stalls in / approved</p></div>
      </div>
      <input className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-white text-sm" placeholder="Search name or phone number" value={q} onChange={(e) => setQ(e.target.value)} inputMode="search" />
      {data.stalls.length > 0 && <div className="space-y-2"><p className="text-xs font-bold uppercase text-slate-500">Stalls</p>{data.stalls.map((s) => <Row key={s.id} kind="stall" row={s} sub={[s.contactName, s.phone].filter(Boolean).join(' · ')} />)}</div>}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase text-slate-500">Job seekers</p>
        {data.seekers.length === 0 ? <p className="text-sm text-slate-500">No registered job seeker matches.</p> : data.seekers.map((s) => <Row key={s.id} kind="seeker" row={s} sub={s.phone} />)}
      </div>
    </div>
  );
};
export default FairCheckIn;
