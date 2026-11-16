import React, { useEffect, useState } from 'react';
import SEOHead from '../../components/seo/SEOHead';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CalendarDays, Loader2, MapPin } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });

// Public list of upcoming job fairs. Government fairs are listed free; we link to the official page and support them.
const JobFairs = () => {
  const [fairs, setFairs] = useState(null);
  const [kind, setKind] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    setFairs(null);
    axios.get(`${API}/job-fairs`, { params: { ...(kind ? { kind } : {}), ...(city.trim() ? { city: city.trim() } : {}) } })
      .then((r) => setFairs(r.data)).catch(() => setFairs([]));
  }, [kind, city]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      <SEOHead title="Job fairs in Tamil Nadu and Puducherry | Velaivaaipu" description="Upcoming government and private job fairs with date, venue, documents to bring and the official registration link. Free for job seekers." />
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><CalendarDays className="text-emerald-600" /> Job Fairs</h1>
        <p className="text-sm text-slate-500 mt-1">Government and private job fairs near you. Free for job seekers. Tap I am going to get reminders.</p>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        {[['', 'All'], ['government', 'Government'], ['own', 'Private']].map(([k, label]) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={`h-9 px-3 rounded-full text-xs font-bold border ${kind === k ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>{label}</button>
        ))}
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your town or district" aria-label="Town or district" className="h-9 px-3 rounded-full border border-slate-200 text-xs flex-1 min-w-[160px]" />
      </div>
      {!fairs ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>
        : fairs.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-slate-100"><p className="text-sm font-bold text-slate-500">No upcoming fairs here right now. Check again soon.</p></div>
        : fairs.map((f) => (
          <Link key={f.slug} to={`/job-fairs/${f.slug}`} className="block bg-white rounded-2xl border border-slate-100 p-4 hover:border-emerald-300">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-black text-slate-900">{f.title}</h2>
              {f.kind === 'government' && <span className="text-[10px] font-bold uppercase bg-sky-100 text-sky-700 rounded-full px-2 py-0.5 shrink-0">Government</span>}
            </div>
            {f.organiserName && <p className="text-xs text-slate-500 mt-1">Organised by {f.organiserName}</p>}
            <p className="text-sm text-slate-700 mt-2">{fmt(f.date)}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={12} /> {[f.venue?.name, f.venue?.city].filter(Boolean).join(', ')}</p>
            <div className="flex items-center justify-between mt-2">
              {f.supportedByUs ? <span className="text-[10px] font-bold text-emerald-700">Supported by Velaivaaipu</span> : <span />}
              {f.going > 0 && <span className="text-[11px] text-slate-500">{f.going} going</span>}
            </div>
          </Link>
        ))}
    </div>
  );
};
export default JobFairs;
