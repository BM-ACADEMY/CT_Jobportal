import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CalendarDays, Loader2, Users } from 'lucide-react';
import { API, fmtDate } from './driveUi';

// Public list of upcoming walk-in drives.
const Drives = () => {
  const [drives, setDrives] = useState(null);
  useEffect(() => { axios.get(`${API}/drives`).then((r) => setDrives(r.data)).catch(() => setDrives([])); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><CalendarDays className="text-emerald-600" /> Walk-in Drives</h1>
        <p className="text-sm text-slate-500 mt-1">Register for free, get your pass, and walk in on the day.</p>
      </div>
      {!drives ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>
        : drives.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-slate-100"><p className="text-sm font-bold text-slate-500">No drives right now. Please check again soon.</p></div>
        : drives.map((d) => (
          <Link key={d.slug} to={`/drives/${d.slug}`} className="block bg-white rounded-2xl border border-slate-100 p-4 hover:border-emerald-300">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-black text-slate-900">{d.title}</h2>
              {d.sponsored && <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">Sponsored</span>}
            </div>
            <p className="text-xs text-slate-500 mt-1">{d.organiserName}</p>
            <p className="text-sm text-slate-700 mt-2">{fmtDate(d.date)} · {[d.venue?.name, d.venue?.city].filter(Boolean).join(', ')}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Users size={12} /> {d.roles.map((r) => r.title).slice(0, 3).join(', ')}</p>
          </Link>
        ))}
    </div>
  );
};
export default Drives;
