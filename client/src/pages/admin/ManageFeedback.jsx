import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { MessageSquareHeart, Loader2, Star } from 'lucide-react';
import EmailReportCard from '@/components/admin/EmailReportCard';

const API = import.meta.env.VITE_API_BASE_URL;
const STATUS = { new: 'New', read: 'Read', replied: 'Replied', closed: 'Closed' };

const ManageFeedback = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('new');
  const [paidOnly, setPaidOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/feedback/admin`, { params: { ...(status === 'all' ? {} : { status }), ...(paidOnly ? { source: 'payment' } : {}) } });
      setData(res.data);
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [status, paidOnly]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const setItemStatus = async (id, next) => {
    try {
      await axios.patch(`${API}/feedback/admin/${id}`, { status: next });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquareHeart size={20} className="text-emerald-600" /> Feedback
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Private feedback from signed-in users. {data?.total ? `${data.total} in total, average ${data.average} out of 5.` : 'Nothing yet.'}
        </p>
      </div>


      {data?.paymentSummary?.total > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <div>
            <p className="text-sm font-black text-slate-900">After payment: did it give what they expected?</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {data.paymentSummary.total} answers, average {data.paymentSummary.average} out of 5
              {data.paymentSummary.metPercent !== null ? `, ${data.paymentSummary.metPercent}% said yes` : ''}
              {data.paymentSummary.notMet ? `, ${data.paymentSummary.notMet} said no` : ''}. Weakest first: fix these first.
            </p>
          </div>
          <div className="divide-y divide-slate-50">
            {data.paymentSummary.items.map((it) => (
              <div key={it.item} className="py-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-800 truncate">{it.item}</span>
                <span className="text-slate-500 shrink-0">{it.average} / 5 · {it.yes} yes · {it.partly} partly · {it.no} no ({it.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <EmailReportCard />

      <div className="flex gap-2 flex-wrap">
        {['new', 'read', 'replied', 'closed', 'all'].map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)}
            className={`h-9 px-3 rounded-full text-xs font-bold border ${status === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>
            {s === 'all' ? 'All' : STATUS[s]}{s !== 'all' && data?.counts?.[s] ? ` (${data.counts[s]})` : ''}
          </button>
        ))}
        <button type="button" onClick={() => setPaidOnly((v) => !v)}
          className={`h-9 px-3 rounded-full text-xs font-bold border ${paidOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'}`}>
          Paid customers only
        </button>
      </div>

      {loading || !data ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : data.feedback.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100"><p className="text-sm font-bold text-slate-500">No feedback here.</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
          {data.feedback.map((f) => (
            <div key={f._id} className="p-4 flex flex-col md:flex-row md:items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex" aria-label={`${f.rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />)}
                  </span>
                  {f.met && <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${f.met === 'yes' ? 'bg-emerald-50 text-emerald-700' : f.met === 'partly' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{f.met === 'yes' ? 'Got what expected' : f.met === 'partly' ? 'Partly' : 'Not met'}</span>}
                  {f.item && <span className="text-[10px] font-bold text-slate-500">{f.item}</span>}
                  {f.role && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{f.role}</span>}
                  <span className="text-[10px] text-slate-400">{new Date(f.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                {f.text && <p className="text-sm text-slate-800 mt-1 break-words">{f.text}</p>}
                <p className="text-[11px] text-slate-400 mt-1 truncate">{[f.name, f.email, f.page].filter(Boolean).join(' · ')}</p>
              </div>
              <select value={f.status} onChange={(e) => setItemStatus(f._id, e.target.value)} className="h-9 rounded-lg border border-slate-200 text-xs font-bold px-2 bg-white shrink-0" aria-label="Status">
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageFeedback;
