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
    <div className="bg-white rounded-2xl ring-1 ring-zinc-200/80 p-4">
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="w-4 h-4 mt-0.5 shrink-0 accent-[#34B678]" checked={on} onChange={(e) => change(e.target.checked)} />
        <span className="text-[13px] leading-relaxed text-zinc-600">Allow Velaivaaipu and its sister brands (BM Academy, CoreTalents) to contact me about training and hiring services. Optional. Untick any time.</span>
      </label>
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
    </div>
  );
};
export default BrandConsent;
