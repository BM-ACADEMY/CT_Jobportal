import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, CalendarDays } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const input = 'w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm';
const EMPTY = { title: '', kind: 'government', organiserName: '', date: '', endDate: '', officialUrl: '', venueName: '', venueAddress: '', venueCity: '', venueDistrict: '', eligibility: '', documents: '', companies: '', description: '', supportedByUs: true };

// Super Admin: add a fair from an official notice, publish it, close it. Fairs show on /job-fairs once published.
const JobFairsAdmin = () => {
  const [list, setList] = useState(null);
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => axios.get(`${API}/job-fairs/admin/all`).then((r) => setList(r.data)).catch(() => { setList([]); toast.error('Could not load fairs'); }), []);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const create = async (status) => {
    setSaving(true);
    try {
      await axios.post(`${API}/job-fairs/admin`, {
        title: f.title, kind: f.kind, organiserName: f.organiserName, date: f.date, endDate: f.endDate || undefined, officialUrl: f.officialUrl,
        venue: { name: f.venueName, address: f.venueAddress, city: f.venueCity, district: f.venueDistrict },
        eligibility: f.eligibility, documents: f.documents, companies: f.companies, description: f.description, supportedByUs: f.supportedByUs, status,
      });
      toast.success(status === 'published' ? 'Fair published' : 'Saved as draft');
      setF(EMPTY); await load();
    } catch (err) { toast.error(err.response?.data?.msg || 'Could not save'); } finally { setSaving(false); }
  };
  const setStatus = async (id, status) => { try { await axios.patch(`${API}/job-fairs/admin/${id}`, { status }); await load(); } catch (err) { toast.error(err.response?.data?.msg || 'Failed'); } };

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-xl font-black text-slate-900 flex items-center gap-2"><CalendarDays size={20} className="text-emerald-600" /> Job Fairs</h1>
      <p className="text-xs text-slate-500">Add a fair from the official notice. Government fairs need the department name and the official link. Only tick the Supported by tag when we really help (listing, reminders, free kit).</p>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 grid gap-3">
        <input className={input} placeholder="Fair title" value={f.title} onChange={set('title')} />
        <select className={input} value={f.kind} onChange={set('kind')}><option value="government">Government fair</option><option value="own">Our own or partner fair</option></select>
        <input className={input} placeholder="Organised by (department)" value={f.organiserName} onChange={set('organiserName')} />
        <div className="grid grid-cols-2 gap-3"><input className={input} type="date" aria-label="Date" value={f.date} onChange={set('date')} /><input className={input} type="date" aria-label="End date (optional)" value={f.endDate} onChange={set('endDate')} /></div>
        <input className={input} placeholder="Official notice or registration link (https://)" value={f.officialUrl} onChange={set('officialUrl')} />
        <input className={input} placeholder="Venue name" value={f.venueName} onChange={set('venueName')} />
        <input className={input} placeholder="Venue address" value={f.venueAddress} onChange={set('venueAddress')} />
        <div className="grid grid-cols-2 gap-3"><input className={input} placeholder="Town" value={f.venueCity} onChange={set('venueCity')} /><input className={input} placeholder="District" value={f.venueDistrict} onChange={set('venueDistrict')} /></div>
        <input className={input} placeholder="Who can attend (optional)" value={f.eligibility} onChange={set('eligibility')} />
        <input className={input} placeholder="Documents to bring, separated by commas" value={f.documents} onChange={set('documents')} />
        <input className={input} placeholder="Companies listed in the notice, separated by commas (optional)" value={f.companies} onChange={set('companies')} />
        <textarea className="w-full rounded-xl border border-slate-200 p-3 text-sm" rows={3} placeholder="Short description (optional)" value={f.description} onChange={set('description')} />
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={f.supportedByUs} onChange={set('supportedByUs')} /> Show "Supported by Velaivaaipu"</label>
        <div className="flex gap-2">
          <button type="button" disabled={saving} onClick={() => create('published')} className="h-11 px-5 rounded-xl bg-emerald-600 text-white font-bold text-sm">Publish</button>
          <button type="button" disabled={saving} onClick={() => create('draft')} className="h-11 px-5 rounded-xl border border-slate-200 font-bold text-sm">Save draft</button>
        </div>
      </div>
      {!list ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-600" /></div> : list.map((x) => (
        <div key={x._id} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-1">
          <div className="flex justify-between gap-2"><b>{x.title}</b><span className="text-xs font-bold text-slate-500">{x.status}</span></div>
          <p className="text-xs text-slate-500">{new Date(x.date).toLocaleDateString('en-IN')} · {[x.venue?.city, x.venue?.district].filter(Boolean).join(', ')} · {x.going} going</p>
          <div className="flex gap-2 pt-1">
            {x.status !== 'published' && <button type="button" onClick={() => setStatus(x._id, 'published')} className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold">Publish</button>}
            {x.status === 'published' && <button type="button" onClick={() => setStatus(x._id, 'closed')} className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold">Close</button>}
            <a href={`${API}/job-fairs/${x.slug}/card.svg`} target="_blank" rel="noopener noreferrer" className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold inline-flex items-center">Poster card</a>
          </div>
        </div>
      ))}
    </div>
  );
};
export default JobFairsAdmin;
