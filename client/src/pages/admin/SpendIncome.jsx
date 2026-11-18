import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Wallet, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const rupees = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const todayIst = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
const prettyDate = (ymd) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });

const SpendIncome = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState(14);
  const [form, setForm] = useState({ date: todayIst(), line: 'ads', amount: '', note: '', source: '' });

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/spend`, { params: { days } });
      setData(res.data);
    } catch {
      toast.error('Failed to load spend and income');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/admin/spend`, form);
      toast.success('Saved');
      setForm((f) => ({ ...f, amount: '', note: '', source: '' }));
      await load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const voidEntry = async (id) => {
    if (!window.confirm('Void this entry? It stays on record but stops counting.')) return;
    try {
      await axios.patch(`${API}/admin/spend/${id}/void`);
      toast.success('Entry voided');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to void');
    }
  };

  if (loading || !data) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>;
  }
  const { totals, budget, daily, entries, lines } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Wallet size={20} className="text-emerald-600" /> Spend and income
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Customers pay the price plus 18% GST. The GST part is collected for the government, so it is shown on its own and is not counted as profit. Net is money in before GST, less Razorpay fees, less what you spent. It is before income tax.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: `Received from customers, ${totals.days} days`, value: rupees(totals.received) },
          { label: 'GST in it (to pay)', value: rupees(totals.gst) },
          { label: 'Money in, before GST', value: rupees(totals.moneyIn) },
          { label: 'Spent', value: rupees(totals.spent) },
          { label: 'Razorpay fees (est.)', value: rupees(totals.razorpayFee) },
          { label: 'Net profit after all spend', value: rupees(totals.net), tone: totals.net < 0 ? 'text-red-600' : 'text-emerald-600' },
        ].map((c) => (
          <div key={c.label} className="p-4 rounded-2xl border border-slate-100 shadow-sm bg-white">
            <p className={`text-2xl font-black tabular-nums ${c.tone || 'text-slate-900'}`}>{c.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <section className="p-5 rounded-2xl border border-slate-100 shadow-sm bg-white space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Marketing budget: {rupees(budget.cap)} for 90 days</h2>
          <span className={`text-xs font-black ${budget.alert ? 'text-red-600' : 'text-slate-500'}`}>{budget.pct}% used</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full ${budget.alert ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${budget.pct}%` }} />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          {rupees(budget.spent)} spent, {rupees(budget.remaining)} left. At {rupees(budget.burnPerDay)} a day
          {budget.runsOutOn ? `, it runs out on ${prettyDate(budget.runsOutOn)}.` : ', nothing has been spent yet.'}
          {budget.alert ? ' Over 80% used: slow down or decide.' : ''}
        </p>
        <p className="text-[11px] text-slate-400">Counts ads and other marketing from {prettyDate(budget.start)} to {prettyDate(budget.end)}.</p>
      </section>

      <form onSubmit={save} className="p-5 rounded-2xl border border-slate-100 shadow-sm bg-white grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date
          <input type="date" value={form.date} max={todayIst()} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-2 text-sm font-bold text-slate-800" required />
        </label>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type
          <select value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-2 text-sm font-bold text-slate-800 bg-white">
            {Object.entries(lines).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount (₹)
          <input type="number" min="1" step="0.01" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-2 text-sm font-bold text-slate-800" required />
        </label>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest col-span-2 md:col-span-1">Note
          <input type="text" maxLength={200} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Meta, reel boost" className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-2 text-sm font-medium text-slate-800" />
        </label>
        {(form.line === 'ads' || form.line === 'marketing_other') && (
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest col-span-2 md:col-span-1">Source (optional)
            <input type="text" maxLength={40} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="meta, google, whatsapp" className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-2 text-sm font-medium text-slate-800" />
          </label>
        )}
        <button type="submit" disabled={saving} className="h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold col-span-2 md:col-span-1 disabled:opacity-60">{saving ? 'Saving...' : 'Add spend'}</button>
      </form>

      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-sm font-bold text-slate-800">By day</h2>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-8 rounded-lg border border-slate-200 text-xs font-bold px-2 bg-white">
            {[7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-[10px] uppercase tracking-widest text-slate-400"><th className="px-4 py-2">Day</th><th className="px-4 py-2 text-right">In</th><th className="px-4 py-2 text-right">Spent</th><th className="px-4 py-2 text-right">Fees</th><th className="px-4 py-2 text-right">Net</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {daily.map((r) => (
                <tr key={r.date}>
                  <td className="px-4 py-2 font-bold text-slate-700">{prettyDate(r.date)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{rupees(r.moneyIn)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{rupees(r.spent)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{rupees(r.razorpayFee)}</td>
                  <td className={`px-4 py-2 text-right tabular-nums font-bold ${r.net < 0 ? 'text-red-600' : 'text-slate-800'}`}>{rupees(r.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 p-4">Entries</h2>
        {entries.length === 0 ? <p className="px-4 pb-4 text-xs text-slate-400">No spend entered yet.</p> : (
          <div className="divide-y divide-slate-50">
            {entries.map((e) => (
              <div key={e._id} className={`flex items-center justify-between gap-3 px-4 py-2 text-xs ${e.voided ? 'opacity-40 line-through' : ''}`}>
                <span className="font-bold text-slate-700 w-16 shrink-0">{prettyDate(e.date)}</span>
                <span className="flex-1 min-w-0 truncate text-slate-600">{lines[e.line] || e.line}{e.note ? `: ${e.note}` : ''}{e.source ? ` [${e.source}]` : ''}</span>
                <span className="tabular-nums font-bold text-slate-800">{rupees(e.amount)}</span>
                {!e.voided && <button type="button" onClick={() => voidEntry(e._id)} className="text-[10px] font-bold text-red-500 hover:underline">Void</button>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SpendIncome;
