import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { GraduationCap, Check, Minus } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const TIER = { campus_free: 'Free', campus_lite: 'Lite', campus_pro: 'Pro', campus_elite: 'Elite' };
const NEXT_WORDS = { called: 'Call them', students: 'Help upload students', drive: 'Help create a first drive', report: 'Send a first report', paid: 'Offer a plan' };
const COLS = ['called', 'students', 'drive', 'report', 'paid'];

// One screen: how many colleges are at each step from signup to paid, and who is stuck.
const CollegeFunnel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlyStuck, setOnlyStuck] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API}/admin/college-funnel`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setData(r.data))
      .catch((e) => toast.error(e.response?.data?.msg || 'Could not load the college funnel'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  if (!data) return <div className="p-8 text-sm text-slate-500">Nothing to show.</div>;

  const top = data.steps[0]?.count || 0;
  const rows = data.colleges.filter((c) => !onlyStuck || (c.next && c.daysOld >= 7));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="w-6 h-6 text-[#1b496d]" />
        <div>
          <h1 className="text-xl font-black text-slate-900 m-0">College funnel</h1>
          <p className="text-xs text-slate-500 m-0">From signup to a paid plan. Test colleges are left out.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {data.steps.map((s) => (
          <div key={s.key} className="border border-slate-200 bg-white p-4">
            <p className="m-0 text-2xl font-black text-slate-900">{s.count}</p>
            <p className="m-0 mt-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
            {top > 0 && s.key !== 'signedUp' && <p className="m-0 mt-1 text-[11px] text-slate-400">{Math.round((s.count / top) * 100)}% of signups</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-sm font-bold text-slate-700">Colleges ({rows.length})</p>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={onlyStuck} onChange={(e) => setOnlyStuck(e.target.checked)} />
          Only colleges stuck for 7 days or more
        </label>
      </div>

      <div className="overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50">
              <th className="px-3 py-2">College</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2 text-right">Students</th>
              {COLS.map((k) => <th key={k} className="px-2 py-2 text-center">{data.labels[k]?.split(' ')[0]}</th>)}
              <th className="px-3 py-2">Next step</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <p className="m-0 font-bold text-slate-800">{c.name}</p>
                  <p className="m-0 text-[11px] text-slate-500">{c.tpo || '—'}{c.phone ? ` · ${c.phone}` : ''} · {c.daysOld}d old{c.verified ? '' : ' · not verified'}</p>
                </td>
                <td className="px-3 py-2 text-xs">{TIER[c.tier] || c.tier}</td>
                <td className={`px-3 py-2 text-right text-xs ${c.flags.nearLimit ? 'font-bold text-orange-600' : ''}`}>{c.students} / {c.limit >= 100000 ? '∞' : c.limit}</td>
                {COLS.map((k) => (
                  <td key={k} className="px-2 py-2 text-center">{c.flags[k] ? <Check size={15} className="text-emerald-600 inline" /> : <Minus size={15} className="text-slate-300 inline" />}</td>
                ))}
                <td className="px-3 py-2 text-xs font-semibold text-[#1b496d]">{c.next ? NEXT_WORDS[c.next] : 'All done'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={9} className="px-3 py-6 text-center text-sm text-slate-400">No colleges to show.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CollegeFunnel;
