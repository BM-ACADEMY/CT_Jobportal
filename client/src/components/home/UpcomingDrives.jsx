import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CalendarDays } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

// Up to three upcoming walk-in drives. Sponsored (paid home page spot) ones come first and are labelled. Hidden when there are none.
const UpcomingDrives = () => {
  const [drives, setDrives] = useState([]);
  useEffect(() => { axios.get(`${API}/drives`).then((r) => setDrives(r.data.slice(0, 3))).catch(() => {}); }, []);
  if (!drives.length) return null;
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><CalendarDays size={20} className="text-emerald-600" /> Walk-in Drives</h2>
        <Link to="/drives" className="text-sm font-bold text-emerald-700">See all</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {drives.map((d) => (
          <Link key={d.slug} to={`/drives/${d.slug}`} className="block bg-white rounded-2xl border border-slate-100 p-4 hover:border-emerald-300">
            {d.sponsored && <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">Sponsored</span>}
            <p className="font-black text-slate-900 mt-1">{d.title}</p>
            <p className="text-xs text-slate-500 mt-1">{d.organiserName}</p>
            <p className="text-sm text-slate-700 mt-2">{fmt(d.date)} · {d.venue?.city}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};
export default UpcomingDrives;
