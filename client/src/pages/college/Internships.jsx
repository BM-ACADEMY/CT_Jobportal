import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const WORD = { pending: 'Applied', reviewed: 'Seen', shortlisted: 'Shortlisted', accepted: 'Selected', rejected: 'Not selected', withdrawn: 'Withdrawn' };

// How this college's students are doing on internships. Read only.
const CollegeInternships = () => {
  const [d, setD] = useState(null);
  useEffect(() => { axios.get(`${API}/college/internships`).then((r) => setD(r.data)).catch(() => setD({ summary: null, recent: [] })); }, []);
  if (!d) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>;
  const s = d.summary || {};
  return (
    <div className="max-w-4xl mx-auto space-y-5 py-6 px-4">
      <h1 className="text-xl font-black text-slate-900">Student internships</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['Applications', s.applications], ['Students applied', s.students], ['Shortlisted', s.shortlisted], ['Selected', s.selected]].map(([l, v]) => (
          <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4"><p className="text-2xl font-black text-slate-900">{v ?? 0}</p><p className="text-xs text-slate-500">{l}</p></div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
        <h2 className="font-black text-slate-900">Recent applications</h2>
        {d.recent?.length ? d.recent.map((r) => (
          <div key={r.id} className="flex justify-between gap-2 text-sm border-t border-slate-100 pt-2">
            <span><b>{r.studentName}</b> {r.department && <span className="text-slate-400">({r.department})</span>}<br /><span className="text-xs text-slate-500">{r.title} · {r.company}</span></span>
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{WORD[r.status] || r.status}</span>
          </div>
        )) : <p className="text-sm text-slate-500">No student has applied for an internship yet.</p>}
      </div>
    </div>
  );
};
export default CollegeInternships;
