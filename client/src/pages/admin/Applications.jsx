import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, FileText } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
// Today's date in India, as YYYY-MM-DD.
const todayIst = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const when = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// Who applied to which job. Today by default; pick other days to look back.
const Applications = () => {
  const [from, setFrom] = useState(todayIst());
  const [to, setTo] = useState(todayIst());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    axios.get(`${API}/admin/applications`, { params: { from, to } })
      .then((r) => { if (live) setData(r.data); })
      .catch(() => toast.error('Could not load applications'))
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [from, to]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-emerald-700" />
        <h1 className="text-xl font-bold text-slate-900">Applications</h1>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-600">From
          <input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className="block border border-slate-300 rounded-md px-2 py-1 mt-1" />
        </label>
        <label className="text-sm text-slate-600">To
          <input type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} className="block border border-slate-300 rounded-md px-2 py-1 mt-1" />
        </label>
        {data && <p className="text-sm text-slate-600 pb-1">{data.total} application{data.total === 1 ? '' : 's'}{data.total > data.shown ? `, showing the latest ${data.shown}` : ''}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-emerald-700" /></div>
      ) : !data || data.applications.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No applications in this period.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {data.applications.map((a) => (
            <div key={a._id} className="p-3 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">{a.applicant?.name || 'Deleted user'}</p>
                <p className="text-xs text-slate-500 truncate">{[a.applicant?.email, a.applicant?.phone].filter(Boolean).join(' · ')}</p>
                <p className="text-sm text-slate-700 mt-1">
                  Applied to{' '}
                  {a.job ? <Link to={`/admin/jobs/${a.job._id}/applicants`} className="text-emerald-700 hover:underline">{a.job.title}</Link> : 'a deleted job'}
                  {a.job?.company ? ` at ${a.job.company}` : ''}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 shrink-0">
                <p>{when(a.at)}</p>
                <p className="capitalize">{a.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applications;
