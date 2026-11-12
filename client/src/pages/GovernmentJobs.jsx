import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Landmark, ExternalLink } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

const API = import.meta.env.VITE_API_BASE_URL;
const fmt = (d) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };
const daysLeft = (d) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));

// Public list of government jobs. Posted only by our team from the official notification; a job disappears after its last date.
// Candidates apply on the department's own site: this page only points to the official notification.
const GovernmentJobs = () => {
  const [jobs, setJobs] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => { axios.get(`${API}/government-jobs`).then((r) => setJobs(r.data.jobs || [])).catch(() => setJobs([])); }, []);

  const list = (jobs || []).filter((j) => !q.trim() || `${j.title} ${j.department}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
      <SEOHead title="Government jobs in India, official notifications | Velaivaaipu" description="Government job notifications with the last date and a link to the official notification. Always check the official site before you apply." path="/government-jobs" />
      <nav className="text-xs font-semibold text-slate-500"><Link to="/jobs" className="hover:text-emerald-600">Jobs</Link> / Government jobs</nav>
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Landmark className="text-emerald-600" /> Government jobs</h1>
        <p className="text-sm text-slate-500 mt-1">Posted by our team from the official notification. You apply on the department's own site, and you never pay us to apply. Jobs disappear after their last date.</p>
      </div>
      <input className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm" placeholder="Search post or department" value={q} onChange={(e) => setQ(e.target.value)} />
      {jobs === null ? (
        <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : list.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">No open government jobs right now. Please check again soon.</p>
      ) : (
        <div className="space-y-3">
          {list.map((j) => (
            <article key={j._id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 text-base">{j.title}</h2>
                  <p className="text-sm text-slate-600">{j.department}</p>
                </div>
                <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-3 py-1 shrink-0">Last date {fmt(j.lastDate)} ({daysLeft(j.lastDate)} days left)</span>
              </div>
              <p className="text-xs text-slate-500">{[j.location, j.vacancies > 1 ? `${j.vacancies} vacancies` : ''].filter(Boolean).join(' · ')}</p>
              {j.summary && <p className="text-sm text-slate-600 whitespace-pre-line">{j.summary}</p>}
              <a href={j.notificationUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:underline">
                Source: official notification <ExternalLink size={14} />
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernmentJobs;
