import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';
import axios from 'axios';
import { Loader2, GraduationCap } from 'lucide-react';
import { JOB_CATEGORIES } from '@/data/jobCategories';

const API = import.meta.env.VITE_API_BASE_URL;
const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
const MODE = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' };
const sel = 'h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm';

// Public Internships page: live internships with filters. Uses the same job list as the Jobs page.
const Internships = () => {
  const [jobs, setJobs] = useState(null);
  const [f, setF] = useState({ category: '', city: '', pay: '', mode: '', duration: '' });
  useEffect(() => { axios.get(`${API}/jobs`).then((r) => setJobs((Array.isArray(r.data) ? r.data : r.data.jobs || []).filter((j) => j.jobType === 'Internship'))).catch(() => setJobs([])); }, []);

  const list = useMemo(() => (jobs || []).filter((j) => {
    const i = j.internship || {};
    if (f.category && j.category !== f.category) return false;
    if (f.city && !String(j.location || '').toLowerCase().includes(f.city.trim().toLowerCase())) return false;
    if (f.pay && i.stipendType !== f.pay) return false;
    if (f.mode && i.mode !== f.mode) return false;
    if (f.duration && i.durationMonths > Number(f.duration)) return false;
    return true;
  }), [jobs, f]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

      <SEOHead title="Internships in Tamil Nadu, free to apply | Velaivaaipu" description="Paid and unpaid internships from verified companies, with certificates. Apply free on Velaivaaipu." path="/internships" />      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><GraduationCap className="text-emerald-600" /> Internships</h1>
        <p className="text-sm text-slate-500 mt-1">Real internships from verified companies. You never pay to apply.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <select className={sel} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}><option value="">All fields</option>{JOB_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
        <input className={sel} placeholder="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
        <select className={sel} value={f.pay} onChange={(e) => setF({ ...f, pay: e.target.value })}><option value="">Paid or unpaid</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select>
        <select className={sel} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}><option value="">Any place</option>{Object.entries(MODE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className={sel} value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })}><option value="">Any length</option><option value="1">Up to 1 month</option><option value="3">Up to 3 months</option><option value="6">Up to 6 months</option></select>
      </div>
      {!jobs ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>
        : list.length === 0 ? <p className="text-center py-12 text-sm font-bold text-slate-500 bg-white rounded-2xl border border-slate-100">No internships match. Try clearing a filter.</p>
        : list.map((j) => {
          const i = j.internship || {};
          return (
            <Link key={j._id} to={`/jobs/${j._id}`} className="flex gap-3 bg-white rounded-2xl border border-slate-100 p-4 hover:border-emerald-300">
              {j.company?.logo && <img src={`${API_DOMAIN}${j.company.logo}`} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" loading="lazy" />}
              <div className="min-w-0">
                <p className="font-black text-slate-900">{j.title}</p>
                <p className="text-xs text-slate-500">{j.company?.name} · {j.location}</p>
                <p className="text-sm text-slate-700 mt-1">{i.durationMonths} {i.durationMonths === 1 ? 'month' : 'months'} · {i.stipendType === 'paid' ? `₹${Number(i.stipendAmount).toLocaleString('en-IN')} per month` : 'Unpaid'} · {MODE[i.mode] || ''}</p>
                <p className="text-xs text-emerald-700 mt-1">{[i.certificate && 'Certificate', i.ppo && 'Job offer possible'].filter(Boolean).join(' · ')}</p>
              </div>
            </Link>
          );
        })}
    </div>
  );
};
export default Internships;
