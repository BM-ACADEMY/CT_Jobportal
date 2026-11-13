import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

// Lets a TPO download a one-page quote (with 18% GST) for any paid plan, to show the principal.
const PlanQuotes = () => {
  const [plans, setPlans] = useState([]);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    axios.get(`${API}/subscriptions`)
      .then((r) => setPlans((r.data || []).filter((p) => p.role === 'college' && p.isActive && p.price > 0).sort((a, b) => a.price - b.price)))
      .catch(() => setPlans([]));
  }, []);

  const [pack, setPack] = useState(null);
  useEffect(() => { axios.get(`${API}/college/public/student-pack-info`).then((r) => setPack(r.data)).catch(() => setPack(null)); }, []);

  if (!plans.length && !pack) return null;

  const askCustom = async () => {
    try {
      const token = localStorage.getItem('token');
      const r = await axios.post(`${API}/college/me/upgrade-call`, { interest: 'custom' }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(r.data?.msg || 'Request sent');
    } catch (e) { toast.error(e.response?.data?.msg || 'Could not send the request'); }
  };

  const downloadPack = async (n) => {
    setBusy(`pack${n}`);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/college/me/quote-pack/${n}`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `quote-student-pack-${n}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { toast.error('Could not make the quote. Please try again.'); }
    finally { setBusy(''); }
  };

  const download = async (plan) => {
    setBusy(plan._id);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/college/me/quote/${plan._id}`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `quote-${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { toast.error('Could not make the quote. Please try again.'); }
    finally { setBusy(''); }
  };

  return (
    <div className="border border-slate-200 bg-white p-5">
      <p className="m-0 font-black text-slate-800 text-sm uppercase tracking-wider">Need your principal's approval?</p>
      <p className="m-0 mt-1 text-xs text-slate-500">Download a one-page price quote with GST for any plan. Hand it to your principal or accounts office.</p>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {plans.map((p) => (
          <button key={p._id} type="button" onClick={() => download(p)} disabled={busy === p._id}
            className="flex items-center justify-between gap-3 border border-slate-200 bg-slate-50 px-3 py-2.5 text-left cursor-pointer hover:border-[#1b496d] disabled:opacity-60">
            <span>
              <span className="block text-sm font-bold text-slate-800">{p.name}</span>
              <span className="block text-xs text-slate-500">{rupees(p.price)} a year + GST</span>
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-[#1b496d]"><FileText size={14} /> {busy === p._id ? '...' : 'Quote'}</span>
          </button>
        ))}
        {pack?.price > 0 && Array.from({ length: pack.maxPacks || 1 }, (_, i) => i + 1).map((n) => (
          <button key={`pack${n}`} type="button" onClick={() => downloadPack(n)} disabled={busy === `pack${n}`}
            className="flex items-center justify-between gap-3 border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-left cursor-pointer hover:border-[#1b496d] disabled:opacity-60">
            <span>
              <span className="block text-sm font-bold text-slate-800">{n === 1 ? 'Student pack' : `${n} student packs`}</span>
              <span className="block text-xs text-slate-500">+{pack.students * n} students · {rupees(pack.price * n)} + GST</span>
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-[#1b496d]"><FileText size={14} /> {busy === `pack${n}` ? '...' : 'Quote'}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="m-0 text-xs text-slate-500">Need something customised, such as more students or several campuses? Tell us and our team will contact you.</p>
        <button type="button" onClick={askCustom} className="text-xs font-bold text-[#1b496d] bg-transparent border-0 cursor-pointer whitespace-nowrap">Ask us to call me</button>
      </div>
    </div>
  );
};

export default PlanQuotes;
