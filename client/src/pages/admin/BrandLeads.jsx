import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const STATUS = { new: 'New', called: 'Called', interested: 'Interested', not_interested: 'Not interested' };

// Super Admin: people who agreed to be contacted, with the reason each is a fit for BM Academy or CoreTalents.
const BrandLeads = () => {
  const [brand, setBrand] = useState('academy');
  const [rows, setRows] = useState(null);
  const [city, setCity] = useState('');
  const load = useCallback(() => { setRows(null); axios.get(`${API}/admin/brand-leads`, { params: { brand } }).then((r) => setRows(r.data.leads)).catch(() => setRows([])); }, [brand]);
  useEffect(() => { load(); }, [load]);

  const save = async (id, patch) => {
    try { await axios.patch(`${API}/admin/brand-leads/${id}`, { brand, ...patch }); setRows((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r))); } catch { /* keep old value */ }
  };
  const download = async () => {
    const r = await axios.get(`${API}/admin/brand-leads`, { params: { brand, format: 'csv' }, responseType: 'blob' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = `${brand}-leads.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  const shown = (rows || []).filter((r) => !city.trim() || r.city.toLowerCase().includes(city.trim().toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-black text-slate-900">Brand leads</h1>
      <p className="text-xs text-slate-500">Only people who ticked "allow sister brands to contact me" appear here. Do not share this list outside the team.</p>
      <div className="flex flex-wrap gap-2 items-center">
        {[['academy', 'BM Academy'], ['coretalents', 'CoreTalents']].map(([k, l]) => (
          <button key={k} onClick={() => setBrand(k)} className={`px-4 py-2 rounded-xl text-sm font-bold ${brand === k ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>{l}</button>
        ))}
        <input className="h-10 px-3 rounded-xl border border-slate-200 text-sm" placeholder="Filter by city" value={city} onChange={(e) => setCity(e.target.value)} />
        <button onClick={download} className="ml-auto px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 bg-white">Download</button>
      </div>
      {!rows ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" /></div>
        : shown.length === 0 ? <p className="text-sm text-slate-500 bg-white rounded-2xl border border-slate-100 p-6 text-center">No leads yet. They appear as people agree and match a reason.</p>
        : shown.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
            <div className="flex justify-between gap-2">
              <div><p className="font-black text-slate-900">{r.name}</p><p className="text-xs text-slate-500">{r.email} {r.phone && `· ${r.phone}`} {r.city && `· ${r.city}`}</p></div>
              <select className="h-9 px-2 rounded-lg border border-slate-200 text-sm" value={r.status} onChange={(e) => save(r.id, { status: e.target.value })}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <p className="text-sm text-slate-700">{r.reason}</p>
            <input className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm" placeholder="Note" defaultValue={r.note} maxLength={300} onBlur={(e) => e.target.value !== r.note && save(r.id, { note: e.target.value })} />
          </div>
        ))}
    </div>
  );
};
export default BrandLeads;
