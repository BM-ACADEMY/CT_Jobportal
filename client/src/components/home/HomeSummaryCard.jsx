import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;
const LABELS = {
  employer: (s) => [['Open jobs', s.openJobs], ['Applicants', s.applicants], ['New to review', s.newApplicants], ['Shortlisted', s.pipeline?.shortlisted || 0]],
  college: (s) => [['Students joined', s.students], ['Students applied', s.applied], ['Shortlisted', s.shortlisted], ['Campus drives', s.drives]],
};

// Top of the company, recruiter and college homes: four real numbers and the one thing to do next.
const HomeSummaryCard = () => {
  const [d, setD] = useState(null);
  useEffect(() => { axios.get(`${API}/home/summary`).then((r) => setD(r.data)).catch(() => {}); }, []);
  if (!d || !LABELS[d.kind]) return null;
  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {LABELS[d.kind](d.stats).map(([l, v]) => (
            <div key={l}><p className="text-2xl font-black text-slate-900">{v ?? 0}</p><p className="text-xs text-slate-500">{l}</p></div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-700 max-w-xl">{d.next.text}</p>
          <Link to={d.next.to} className="inline-flex items-center h-10 px-5 rounded-xl bg-emerald-600 text-white text-sm font-black">{d.next.cta}</Link>
        </div>
      </div>
    </section>
  );
};
export default HomeSummaryCard;
