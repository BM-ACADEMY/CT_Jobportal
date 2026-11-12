import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { LayoutDashboard } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

// Live jobs against job seekers by field of work, as a plain table. A job seeker who picked several fields counts in each.
const BalanceBoard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API}/admin/balance-board`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setData(r.data))
      .catch((e) => { setData({ rows: [], totals: { liveJobs: 0, jobSeekers: 0 } }); toast.error(e.response?.data?.msg || 'Could not load the balance board'); });
  }, []);

  if (!data) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="w-6 h-6 text-[#1b496d]" />
        <div>
          <h1 className="text-xl font-black text-slate-900 m-0">Balance board</h1>
          <p className="text-xs text-slate-500 m-0">Where there are more job seekers than jobs, find employers. Where there are jobs and few seekers, bring in candidates.</p>
        </div>
      </div>
      <div className="overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <th className="py-2 px-4">Field of work</th>
              <th className="py-2 px-4 text-right">Live jobs</th>
              <th className="py-2 px-4 text-right">Job seekers</th>
              <th className="py-2 px-4 text-right">Seekers per job</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.key || 'none'} className="border-b border-slate-50">
                <td className="py-2 px-4 font-bold text-slate-800">{r.label}</td>
                <td className="py-2 px-4 text-right">{r.liveJobs}</td>
                <td className="py-2 px-4 text-right">{r.jobSeekers}</td>
                <td className="py-2 px-4 text-right">{r.seekersPerJob === null ? 'no jobs' : r.seekersPerJob}</td>
              </tr>
            ))}
            {data.rows.length === 0 && <tr><td colSpan={4} className="py-4 px-4 text-slate-500">Nothing to show yet.</td></tr>}
          </tbody>
          <tfoot>
            <tr className="font-black text-slate-900">
              <td className="py-2 px-4">Total</td>
              <td className="py-2 px-4 text-right">{data.totals.liveJobs}</td>
              <td className="py-2 px-4 text-right">{data.totals.jobSeekers}</td>
              <td className="py-2 px-4" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default BalanceBoard;
