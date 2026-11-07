import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Download, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API = import.meta.env.VITE_API_BASE_URL;
const RANGES = [7, 30, 90];

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const SkillTests = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/admin/skill-tests?days=${days}`, { headers: { Authorization: `Bearer ${token}` } });
        if (alive) setData(res.data);
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Failed to load skill test numbers');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [days]);

  const exportCsv = () => {
    if (!data?.recent?.length) return;
    const rows = [['Name', 'Email', 'Phone', 'Skill', 'Score %', 'Passed', 'Date']]
      .concat(data.recent.map((r) => [r.name, r.email, r.phone, r.skill, r.percentage, r.passed ? 'Yes' : 'No', new Date(r.createdAt).toLocaleDateString('en-IN')]));
    const blob = new Blob([rows.map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-test-results-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const t = data?.totals;
  const cards = t ? [
    { label: 'Tests taken', value: t.attempts },
    { label: 'Pass rate', value: `${t.passRate}%` },
    { label: 'Average score', value: `${t.averagePercentage}%` },
    { label: 'Saved on an account', value: t.savedResults, note: `${t.savedShare}% of tests` },
  ] : [];
  const maxDay = Math.max(1, ...(data?.byDay || []).map((d) => d.attempts));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><ClipboardList size={20} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Skill tests</h1>
            <p className="text-sm text-slate-500">Free skill test numbers. A person appears below only after saving the result to an account.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${days === d ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? <p className="text-slate-500">Loading…</p> : null}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cards.map((c) => (
              <div key={c.label} className="bg-white border border-slate-200 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{c.label}</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{c.value}</p>
                {c.note ? <p className="text-xs text-slate-500 mt-1">{c.note}</p> : null}
              </div>
            ))}
          </div>

          <section className="bg-white border border-slate-200 rounded-2xl p-4">
            <h2 className="font-black text-slate-900 mb-3">Tests per day</h2>
            {data.byDay.length === 0 ? <p className="text-sm text-slate-500">No tests in this period.</p> : (
              <div className="flex items-end gap-1 h-32">
                {data.byDay.map((d) => (
                  <div key={d.date} className="flex-1 min-w-[6px] flex flex-col items-center justify-end h-full" title={`${d.date}: ${d.attempts}`}>
                    <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${(d.attempts / maxDay) * 100}%` }} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-4 overflow-x-auto">
            <h2 className="font-black text-slate-900 mb-3">By skill</h2>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500"><th className="py-2 pr-4">Skill</th><th className="py-2 pr-4">Tests</th><th className="py-2 pr-4">Pass rate</th><th className="py-2">Average</th></tr></thead>
              <tbody>
                {data.bySkill.map((s) => (
                  <tr key={s.skill} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-semibold capitalize">{s.skill}</td>
                    <td className="py-2 pr-4">{s.attempts}</td>
                    <td className="py-2 pr-4">{s.passRate}%</td>
                    <td className="py-2">{s.averagePercentage}%</td>
                  </tr>
                ))}
                {data.bySkill.length === 0 && <tr><td className="py-3 text-slate-500" colSpan={4}>No tests in this period.</td></tr>}
              </tbody>
            </table>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-slate-900">People who saved a result</h2>
              <Button variant="outline" onClick={exportCsv} disabled={!data.recent.length} className="gap-2 rounded-xl"><Download size={16} /> Download CSV</Button>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500"><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Phone</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Skill</th><th className="py-2 pr-4">Score</th><th className="py-2">Date</th></tr></thead>
              <tbody>
                {data.recent.map((r) => (
                  <tr key={r._id} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-semibold">{r.name || '—'}</td>
                    <td className="py-2 pr-4">{r.phone || '—'}</td>
                    <td className="py-2 pr-4">{r.email || '—'}</td>
                    <td className="py-2 pr-4 capitalize">{r.skill}</td>
                    <td className="py-2 pr-4">{r.percentage}% {r.passed ? '✓' : ''}</td>
                    <td className="py-2">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
                {data.recent.length === 0 && <tr><td className="py-3 text-slate-500" colSpan={6}>No saved results in this period.</td></tr>}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
};

export default SkillTests;
