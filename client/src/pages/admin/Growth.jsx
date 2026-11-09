import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const PAGES = [['/', 'Home page'], ['/register?role=jobseeker', 'Job seeker sign-up'], ['/register?role=company', 'Company sign-up'], ['/jobs', 'Jobs'], ['/drives', 'Walk-in drives']];
const tag = (v) => String(v).toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

// Super Admin: which channel each new account came from, plus a small link maker for the SMM team.
const Growth = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [src, setSrc] = useState('instagram');
  const [med, setMed] = useState('social');
  const [camp, setCamp] = useState('');
  const [page, setPage] = useState(PAGES[1][0]);
  const [copied, setCopied] = useState(false);
  const [ai, setAi] = useState(null);
  useEffect(() => { axios.get(`${API}/admin/free-ai`).then((r) => setAi(r.data)).catch(() => setAi(null)); }, []);

  useEffect(() => { setData(null); axios.get(`${API}/admin/growth/sources`, { params: { days } }).then((r) => setData(r.data)).catch(() => setData({ rows: [], total: 0 })); }, [days]);

  const base = window.location.origin;
  const q = [`utm_source=${tag(src)}`, `utm_medium=${tag(med)}`, camp && `utm_campaign=${tag(camp)}`].filter((x) => x && !x.endsWith('=')).join('&');
  const link = `${base}${page}${page.includes('?') ? '&' : '?'}${q}`;
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* user can select the text */ } };

  return (
    <div className="max-w-4xl mx-auto py-6 px-3 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Signup sources</h1>
        <p className="text-sm text-slate-500 mt-1">Where new accounts came from. Only links made with the tags below are counted. Everything else shows as direct or unknown. Test accounts are left out.</p>
      </div>

      <div className="flex gap-2">
        {[7, 30, 60, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`px-4 h-10 rounded-xl text-sm font-bold border ${days === d ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>{d} days</button>
        ))}
      </div>

      {!data ? <Loader2 className="animate-spin text-emerald-600" /> : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
          <p className="px-4 pt-4 text-sm text-slate-600"><b>{data.total}</b> new accounts in the last {days} days.</p>
          <table className="w-full text-sm mt-2">
            <thead><tr className="text-left text-[11px] uppercase tracking-widest text-slate-400"><th className="p-3">Channel</th><th className="p-3">Signups</th><th className="p-3">Verified email</th><th className="p-3">Job seekers</th><th className="p-3">Companies</th><th className="p-3">Colleges</th></tr></thead>
            <tbody>
              {data.rows.length === 0 && <tr><td className="p-4 text-slate-500" colSpan={6}>No new accounts in this time.</td></tr>}
              {data.rows.map((r) => (
                <tr key={r.channel} className="border-t border-slate-50"><td className="p-3 font-semibold text-slate-800">{r.channel}</td><td className="p-3">{r.signups}</td><td className="p-3">{r.verified}</td><td className="p-3">{r.jobseekers}</td><td className="p-3">{r.companies}</td><td className="p-3">{r.colleges}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ai && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <h2 className="font-bold text-slate-800">Free AI given to candidates</h2>
          <p className="text-sm text-slate-600">Counted as marketing spend. Only the resume builder and resume checker are limited, and only for free-plan people. Job match checks and skill tests are not limited. {ai.limited ? <>Each free use comes back after <b>{ai.windowDays} days</b>.</> : <b>All limits are switched off.</b>}</p>
          <p className="text-sm text-slate-700">Today: <b>{ai.today}</b> free uses{ai.ceiling > 0 ? <> of a daily ceiling of <b>{ai.ceiling}</b>. Free AI pauses when it is reached and opens again tomorrow.</> : '. No daily ceiling is set.'} This month: <b>{ai.month}</b>{ai.estimatedCost != null && <>, about <b>₹{ai.estimatedCost}</b> at ₹{ai.costPerCall} a use</>}.</p>
          <ul className="text-sm text-slate-700 space-y-1">
            {ai.features.map((f) => <li key={f.kind}>{f.label}: <b>{f.used}</b> used this month, {f.perPerson} free per person every {ai.windowDays} days</li>)}
          </ul>
          <p className="text-xs text-slate-500">Settings: FREE_AI_RESUME_BUILD, FREE_AI_RESUME_CHECK, FREE_AI_WINDOW_DAYS, FREE_AI_DAILY_CEILING, FREE_AI_LIMITS (off switches everything off) and FREE_AI_COST_PER_CALL.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <h2 className="font-bold text-slate-800">Make a tracked link</h2>
        <p className="text-sm text-slate-500">Give this link to the SMM team to use in a post, bio or ad. Use the same words each time.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs font-bold text-slate-500">Where the link goes
            <select value={page} onChange={(e) => setPage(e.target.value)} className="mt-1 w-full h-11 rounded-lg border border-slate-200 px-3 text-sm bg-white">{PAGES.map(([p, l]) => <option key={p} value={p}>{l}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-500">Source (instagram, facebook, whatsapp, google)
            <input value={src} onChange={(e) => setSrc(e.target.value)} className="mt-1 w-full h-11 rounded-lg border border-slate-200 px-3 text-sm" /></label>
          <label className="text-xs font-bold text-slate-500">Type (social, paid, bio, broadcast)
            <input value={med} onChange={(e) => setMed(e.target.value)} className="mt-1 w-full h-11 rounded-lg border border-slate-200 px-3 text-sm" /></label>
          <label className="text-xs font-bold text-slate-500">Campaign name (optional, for example drive-nov)
            <input value={camp} onChange={(e) => setCamp(e.target.value)} className="mt-1 w-full h-11 rounded-lg border border-slate-200 px-3 text-sm" /></label>
        </div>
        <p className="text-xs break-all bg-slate-50 rounded-lg p-3 text-slate-700">{link}</p>
        <button onClick={copy} className="h-11 px-5 rounded-xl bg-emerald-600 text-white text-sm font-bold">{copied ? 'Copied' : 'Copy link'}</button>
      </div>
    </div>
  );
};

export default Growth;
