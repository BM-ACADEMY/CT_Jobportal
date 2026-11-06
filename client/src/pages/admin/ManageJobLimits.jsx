import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Briefcase, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Admin: see employers' active-job limits and raise them without a payment. Every raise is recorded (who, when, why).
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ManageJobLimits = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [limit, setLimit] = useState(150);
  const [days, setDays] = useState(365);
  const [note, setNote] = useState('');
  const [confirmAll, setConfirmAll] = useState('');
  const [busy, setBusy] = useState(false);
  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/job-limits`, { headers: headers(), params: { page, search } });
      setRows(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to load employer accounts');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const chosen = Object.keys(selected).filter((id) => selected[id]);

  const grant = async (allEmployers) => {
    if (busy) return;
    if (!allEmployers && !chosen.length) return toast.error('Tick at least one account first.');
    if (note.trim().length < 3) return toast.error('Please write a short note saying why.');
    if (allEmployers && confirmAll !== 'ALL') return toast.error('Type ALL to confirm raising every employer account.');
    setBusy(true);
    try {
      const body = { limit: Number(limit), days: Number(days), note: note.trim(), ...(allEmployers ? { allEmployers: true, confirm: 'ALL' } : { userIds: chosen }) };
      const res = await axios.post(`${API}/admin/job-limits/grant`, body, { headers: headers() });
      const r = res.data;
      toast.success(`Raised ${r.raised}. Already enough: ${r.alreadyEnough}. Unlimited plans: ${r.unlimited}. Skipped: ${r.skipped}.`);
      setSelected({});
      setConfirmAll('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not raise the limit');
    } finally {
      setBusy(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Briefcase className="w-6 h-6 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job posting limits</h1>
          <p className="text-sm text-slate-500">Raise how many active jobs an employer account may have, without a payment. The plan itself does not change.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="grid md:grid-cols-4 gap-3">
          <label className="text-xs font-semibold text-slate-500">Total active jobs allowed
            <input type="number" min="1" max="1000" value={limit} onChange={(e) => setLimit(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900" />
          </label>
          <label className="text-xs font-semibold text-slate-500">Lasts (days)
            <input type="number" min="1" max="730" value={days} onChange={(e) => setDays(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900" />
          </label>
          <label className="text-xs font-semibold text-slate-500 md:col-span-2">Why (saved with your name and the time)
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: CoreTalents, about 150 openings" className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => grant(false)} disabled={busy || !chosen.length}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : `Raise ${chosen.length} selected`}
          </Button>
          <span className="text-xs text-slate-400">Accounts that already allow this many are left alone.</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <span className="text-sm font-semibold text-slate-700">Every employer account:</span>
          <input type="text" value={confirmAll} onChange={(e) => setConfirmAll(e.target.value)} placeholder="Type ALL" className="h-10 w-28 rounded-lg border border-slate-200 px-3 text-sm" />
          <Button variant="outline" onClick={() => grant(true)} disabled={busy || confirmAll !== 'ALL'}>Raise all recruiter and company accounts</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 p-4 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or email" className="flex-1 text-sm outline-none" />
          <span className="text-xs text-slate-400">{total} accounts</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-400">
                <tr><th className="p-3 w-10"></th><th className="p-3">Account</th><th className="p-3">Role</th><th className="p-3">Plan</th><th className="p-3">Plan limit</th><th className="p-3">Extra</th><th className="p-3">Total</th><th className="p-3">Active jobs</th></tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u._id} className="border-t border-slate-100">
                    <td className="p-3"><input type="checkbox" checked={!!selected[u._id]} onChange={(e) => setSelected((s) => ({ ...s, [u._id]: e.target.checked }))} /></td>
                    <td className="p-3"><p className="font-medium text-slate-900">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></td>
                    <td className="p-3 capitalize">{u.role}</td>
                    <td className="p-3">{u.plan}</td>
                    <td className="p-3">{u.unlimited ? 'Unlimited' : u.planLimit}</td>
                    <td className="p-3">{u.extra || 0}</td>
                    <td className="p-3 font-semibold">{u.unlimited ? 'Unlimited' : u.total}</td>
                    <td className="p-3">{u.activeJobs}</td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={8} className="p-8 text-center text-slate-400">No employer accounts found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between p-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageJobLimits;
