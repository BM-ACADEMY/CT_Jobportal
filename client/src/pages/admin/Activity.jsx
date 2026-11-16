import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API = import.meta.env.VITE_API_BASE_URL;
const short = (d) => new Date(`${d}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const Tile = ({ label, today, avg7, hint }) => (
  <div className="rounded-xl border border-slate-100 bg-white p-4">
    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="text-3xl font-black text-slate-900 mt-1">{today}</p>
    <p className="text-xs text-slate-500 mt-1">Average of the last 7 days: <b>{avg7}</b></p>
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

const Funnel = ({ title, steps }) => (
  <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
    <h3 className="font-bold text-slate-800">{title}</h3>
    {steps.map((s, i) => (
      <div key={s.label}>
        <div className="flex justify-between text-sm"><span className="text-slate-700">{s.label}</span><span className="font-semibold">{s.count}{i > 0 && <span className="text-slate-400 font-normal"> · {s.pctOfPrev}% of the step before</span>}</span></div>
        <div className="h-2.5 rounded-full bg-slate-100 mt-1 overflow-hidden"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${s.pctOfFirst}%` }} /></div>
      </div>
    ))}
  </div>
);


const OtpCard = () => {
  const [o, setO] = useState(null);
  useEffect(() => { axios.get(`${API}/admin/otp-stats`).then((r) => setO(r.data)).catch(() => setO(false)); }, []);
  if (o === false) return null;
  const row = (label, k, hint) => (
    <tr key={k}><td className="py-1.5 pr-3 font-bold text-slate-800">{label}<span className="block font-normal text-slate-400">{hint}</span></td><td className="py-1.5 px-2">{o ? o.today[k] : '...'}</td><td className="py-1.5 px-2">{o ? o.week[k] : '...'}</td></tr>
  );
  const sp = o && o.mailSpeed;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4" data-testid="otp-card">
      <h3 className="font-bold text-slate-800">Verification codes</h3>
      <p className="text-xs text-slate-500 mt-0.5 mb-3">Counted from {o && o.recordingSince ? new Date(o.recordingSince).toLocaleDateString('en-IN') : 'the first code after this was added'}. Kept 45 days. No email addresses or codes are stored.</p>
      <div className="overflow-x-auto"><table className="w-full text-xs">
        <thead><tr className="text-left text-slate-500"><th className="py-1 pr-3 font-bold">What happened</th><th className="py-1 px-2 font-bold">Today</th><th className="py-1 px-2 font-bold">7 days</th></tr></thead>
        <tbody className="divide-y divide-slate-50">
          {row('Code mails sent', 'sent', 'The mail server accepted it')}
          {row('Mail failed to send', 'send_failed', 'The mail server refused or timed out')}
          {row('Codes verified', 'verified', 'Typed correctly')}
          {row('Wrong code typed', 'wrong', 'A failed attempt')}
          {row('Code expired', 'expired', 'Typed after 10 minutes')}
          {row('Locked after 5 wrong tries', 'locked', 'Needs a new code')}
          {row('No code on file', 'no_code', 'Typed with no code pending')}
        </tbody>
      </table></div>
      {sp && sp.samples > 0 && <p className="text-xs text-slate-500 mt-3">Mail server answered in a median of {(sp.medianMs / 1000).toFixed(1)}s (slowest 1 in 10: {(sp.slowestTenPercentMs / 1000).toFixed(1)}s). {sp.slowCount} of {sp.samples} took over {sp.slowMs / 1000}s in the last 7 days. This is time to hand the mail over, not time to reach the inbox.</p>}
    </div>
  );
};

// Super Admin: what happened on the site each day, from our own records.
const Activity = () => {
  const [days, setDays] = useState(14);
  const [d, setD] = useState(null);
  useEffect(() => { setD(null); axios.get(`${API}/admin/activity`, { params: { days } }).then((r) => setD(r.data)).catch(() => setD({ error: true })); }, [days]);

  const rows = d && d.days ? d.days.map((day, i) => ({ day: short(day), 'New sign-ups': d.series.signups[i], 'Verified email': d.series.verified[i], 'People who logged in': d.series.active[i], Applications: d.series.applications[i], 'Jobs posted': d.series.jobs[i] })) : [];

  return (
    <div className="max-w-5xl mx-auto py-6 px-3 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Daily activity</h1>
        <p className="text-sm text-slate-500 mt-1">From our own records, in Indian time. Test accounts are left out. It counts people with an account. Visitors who never register are only in Google Analytics.</p>
      </div>
      <div className="flex gap-2">
        {[7, 14, 30, 60].map((n) => <button key={n} onClick={() => setDays(n)} className={`px-4 h-10 rounded-xl text-sm font-bold border ${days === n ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>{n} days</button>)}
      </div>

      {!d && <Loader2 className="animate-spin text-emerald-600" />}
      {d?.error && <p className="text-sm text-red-600">Could not load. Please try again.</p>}
      {d && !d.error && (<>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="New sign-ups today" {...d.compare.signups} />
          <Tile label="People who logged in today" {...d.compare.active} />
          <Tile label="Applications today" {...d.compare.applications} />
          <Tile label="Jobs posted today" {...d.compare.jobs} />
        </div>
        <OtpCard />
        <p className="text-xs text-slate-400">For reference, the plan expects about 5 to 10 people a day in the first month and 100 or more a day after about two months.</p>

        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="font-bold text-slate-800 mb-3">People each day</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={rows}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Legend />
                <Line type="monotone" dataKey="New sign-ups" stroke="#059669" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Verified email" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="People who logged in" stroke="#d97706" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="font-bold text-slate-800 mb-3">Work done each day</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={rows}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Legend />
                <Bar dataKey="Applications" fill="#059669" /><Bar dataKey="Jobs posted" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-slate-800 mb-1">Where people drop off</h2>
          <p className="text-xs text-slate-500 mb-3">Follows the people who registered in the last {days} days.</p>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            <Funnel title="Job seekers" steps={d.funnels.jobseekers} />
            <Funnel title="Companies" steps={d.funnels.companies} />
          </div>
        </div>
      </>)}
    </div>
  );
};

export default Activity;
