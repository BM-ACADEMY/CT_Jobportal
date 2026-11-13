import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_BASE_URL;
const WHY = { match: 'Matched to you', field: 'In a field you chose', new: 'New on Velaivaaipu' };

// Same rules as server/utils/homeSummary.js (kept in step by hand): matches first, then same field, then newest.
const fillRows = (matches, allJobs, cats, limit = 6) => {
  const rows = matches.slice(0, limit).map((job) => ({ job, why: 'match' }));
  const seen = new Set(matches.map((j) => String(j._id)));
  const add = (list, why) => { for (const j of list) { if (rows.length >= limit) return; if (!seen.has(String(j._id))) { seen.add(String(j._id)); rows.push({ job: j, why }); } } };
  const set = new Set(cats);
  add(allJobs.filter((j) => j.category && set.has(j.category)), 'field');
  add([...allJobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), 'new');
  return rows;
};
const tips = (profile = {}) => {
  const t = [];
  const skills = Array.isArray(profile.skills) ? profile.skills.length : 0;
  if (skills < 5) t.push(`Add ${5 - skills} more ${5 - skills === 1 ? 'skill' : 'skills'}`);
  if (!profile.resumeUrl) t.push('Add your resume');
  if ((profile.interestedCategories || []).length < 3) t.push('Choose up to 3 fields you want to work in');
  return t.slice(0, 3);
};

// Top of the job seeker home: how many jobs matched, six rows (never empty), and small steps to get more matches.
const MatchesBoard = () => {
  const { user } = useAuth();
  const [state, setState] = useState(null);
  useEffect(() => {
    let off = false;
    (async () => {
      let matches = [];
      try { if (user?.profile?.skills?.length) matches = (await axios.get(`${API}/jobs/matching`)).data || []; } catch { /* no matches yet */ }
      let all = [];
      try { const r = await axios.get(`${API}/jobs`); all = Array.isArray(r.data) ? r.data : r.data.jobs || []; } catch { /* list unavailable */ }
      if (!off) setState({ matches, rows: fillRows(matches, all, user?.profile?.interestedCategories || []) });
    })();
    return () => { off = true; };
  }, [user]);
  if (!state || !state.rows.length) return null;
  const n = state.matches.length;
  const more = tips(user?.profile);
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-3 mb-4">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Sparkles size={22} className="text-emerald-600" />{n > 0 ? `${n} ${n === 1 ? 'job' : 'jobs'} matched you` : 'Jobs for you'}</h2>
        <Link to="/jobs?tab=matched" className="text-sm font-bold text-emerald-700 whitespace-nowrap">{n > 6 ? `See all ${n}` : 'See all jobs'}</Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {state.rows.map(({ job, why }) => (
          <Link key={job._id} to={`/jobs/${job._id}`} className="block bg-white rounded-2xl border border-slate-100 p-4 hover:border-emerald-300">
            <p className="text-[10px] font-bold uppercase text-emerald-700">{WHY[why]}</p>
            <p className="font-black text-slate-900 mt-1">{job.title}</p>
            <p className="text-xs text-slate-500">{job.company?.name || 'Employer on Velaivaaipu'} · {job.location}</p>
            {why === 'match' && job.relevance?.reasons?.length > 0 && <p className="text-xs text-slate-600 mt-1">{job.relevance.reasons.slice(0, 3).join(' · ')}</p>}
          </Link>
        ))}
      </div>
      {more.length > 0 && (
        <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <p className="font-bold text-slate-900 text-sm">Get more matches</p>
          <ul className="mt-1 text-sm text-slate-700 list-disc pl-5">{more.map((x) => <li key={x}>{x}</li>)}</ul>
          <Link to="/candidate/settings" className="inline-block mt-2 text-sm font-bold text-emerald-700">Update my profile</Link>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link to="/internships" className="px-3.5 py-2 rounded-full bg-white border border-slate-200 font-semibold text-slate-700">Internships (free)</Link>
        <Link to="/drives" className="px-3.5 py-2 rounded-full bg-white border border-slate-200 font-semibold text-slate-700">Walk-in drives</Link>
        <Link to="/free-assessment" className="px-3.5 py-2 rounded-full bg-white border border-slate-200 font-semibold text-slate-700">Free skill test</Link>
      </div>
    </section>
  );
};
export default MatchesBoard;
