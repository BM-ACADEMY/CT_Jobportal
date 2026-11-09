import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;

// Optional tick: allow sister brands to contact about training and hiring. Used in the job seeker and company settings.
const BrandConsent = () => {
  const [on, setOn] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { axios.get(`${API}/user/brand-consent`).then((r) => setOn(!!r.data.contact)).catch(() => setOn(false)); }, []);
  const change = async (v) => {
    setErr('');
    try { await axios.put(`${API}/user/brand-consent`, { contact: v }); setOn(v); } catch { setErr('Could not save. Try again.'); }
  };
  if (on === null) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="w-5 h-5 mt-0.5 rounded-md border-slate-300 text-emerald-600" checked={on} onChange={(e) => change(e.target.checked)} />
        <span className="text-sm text-slate-700">Allow Velaivaaipu and its sister brands (BM Academy, CoreTalents) to contact me about training and hiring services. Optional. Untick any time.</span>
      </label>
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
    </div>
  );
};
export default BrandConsent;
