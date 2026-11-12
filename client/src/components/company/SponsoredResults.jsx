import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;
const fmt = (d) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch { return ''; } };

// "Sponsored results" on the company dashboard: views, clicks and applies for the company's sponsored jobs.
// Shows nothing when the company has never sponsored a job, or when the report cannot load.
const SponsoredResults = () => {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API}/jobs/sponsored-report`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      .then((r) => setRows(Array.isArray(r.data?.jobs) ? r.data.jobs : []))
      .catch(() => {});
  }, []);
  if (!rows.length) return null;
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
      <h2 className="font-bold text-slate-900 mb-1">Sponsored results</h2>
      <p className="text-xs text-slate-500 mb-3">How your sponsored jobs did while they were sponsored.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-500"><th className="py-2 pr-3">Job</th><th className="py-2 pr-3">Views</th><th className="py-2 pr-3">Clicks</th><th className="py-2">Applies</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-t border-slate-100">
                <td className="py-2 pr-3"><span className="font-semibold text-slate-900">{r.title}</span><br /><span className="text-xs text-slate-500">{r.active ? `Sponsored until ${fmt(r.sponsoredUntil)}` : 'Sponsorship ended'}</span></td>
                <td className="py-2 pr-3 font-bold">{r.views}</td>
                <td className="py-2 pr-3 font-bold">{r.clicks}</td>
                <td className="py-2 font-bold">{r.applies}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SponsoredResults;
