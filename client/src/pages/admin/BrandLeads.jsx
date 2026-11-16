import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Loader2, MessageCircle, Phone } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const STATUS = { new: 'New', called: 'Called', interested: 'Interested', not_interested: 'Not interested' };
const BRANDS = [['academy', 'BM Academy'], ['coretalents', 'CoreTalents']];
const todayIST = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
const dayOf = (d) => (d ? new Date(new Date(d).getTime() + 5.5 * 3600000).toISOString().slice(0, 10) : '');
const showDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');

// First message for each brand. Only people who agreed to be contacted are in this list.
const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || 'there';
const MESSAGE = {
  academy: (r) => `Hi ${firstName(r.name)}, this is BM Academy, a sister brand of Velaivaaipu. You agreed to hear from us about training. We teach AI Digital Marketing and Data Analytics with Power BI. Can we book a free one-to-one demo for you?`,
  coretalents: (r) => `Hi ${firstName(r.name)}, this is CoreTalents, a sister brand of Velaivaaipu. We help companies hire faster. We saw your openings on Velaivaaipu. Can we help you get more good applicants?`,
};
const digits = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length === 10 ? `91${d}` : d.length >= 11 && d.length <= 13 ? d : ''; };

// Super Admin: people who agreed to be contacted, best leads first, with one-tap WhatsApp and call and a follow-up date.
const BrandLeads = () => {
  const [brand, setBrand] = useState('academy');
  const [rows, setRows] = useState(null);
  const [city, setCity] = useState('');
  const [filter, setFilter] = useState('all');
  const load = useCallback(() => { setRows(null); setFilter('all'); axios.get(`${API}/admin/brand-leads`, { params: { brand } }).then((r) => setRows(r.data.leads)).catch(() => setRows([])); }, [brand]);
  useEffect(() => { load(); }, [load]);

  const save = async (id, patch) => {
    try {
      const { data } = await axios.patch(`${API}/admin/brand-leads/${id}`, { brand, ...patch });
      const local = { ...patch };
      delete local.contacted;
      if (patch.contacted) { local.lastContactedAt = new Date().toISOString(); if (data.status) local.status = data.status; }
      setRows((p) => p.map((r) => (r.id === id ? { ...r, ...local } : r)));
    } catch { /* keep old value */ }
  };
  const download = async () => {
    const r = await axios.get(`${API}/admin/brand-leads`, { params: { brand, format: 'csv' }, responseType: 'blob' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = `${brand}-leads.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  const today = todayIST();
  const isDue = (r) => r.followUpAt && dayOf(r.followUpAt) <= today && r.status !== 'not_interested' && r.status !== 'interested';
  const counts = useMemo(() => {
    const c = { all: 0, due: 0, new: 0, called: 0, interested: 0, not_interested: 0 };
    (rows || []).forEach((r) => { c.all += 1; c[r.status] = (c[r.status] || 0) + 1; if (isDue(r)) c.due += 1; });
    return c;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  const shown = (rows || [])
    .filter((r) => !city.trim() || r.city.toLowerCase().includes(city.trim().toLowerCase()))
    .filter((r) => filter === 'all' || (filter === 'due' ? isDue(r) : r.status === filter));
  // Due follow-ups first, then the order the server gave (highest priority first).
  const ordered = filter === 'all' ? [...shown].sort((a, b) => Number(isDue(b)) - Number(isDue(a))) : shown;

  const tabs = [['all', 'All'], ['due', 'Follow up today'], ['new', 'New'], ['called', 'Called'], ['interested', 'Interested'], ['not_interested', 'Not interested']];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4" data-testid="brand-leads">
      <h1 className="text-xl font-black text-slate-900">Brand leads</h1>
      <p className="text-xs text-slate-500">Only people who ticked "allow sister brands to contact me" appear here, best leads first. Do not share this list outside the team.</p>
      <div className="flex flex-wrap gap-2 items-center">
        {BRANDS.map(([k, l]) => (
          <button key={k} onClick={() => setBrand(k)} className={`px-4 py-2 rounded-xl text-sm font-bold ${brand === k ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>{l}</button>
        ))}
        <input className="h-10 px-3 rounded-xl border border-slate-200 text-sm" placeholder="Filter by city" value={city} onChange={(e) => setCity(e.target.value)} />
        <button onClick={download} className="ml-auto px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 bg-white">Download</button>
      </div>
      {rows && (
        <div className="flex flex-wrap gap-2" data-testid="lead-filters">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${filter === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'} ${k === 'due' && counts.due ? 'ring-2 ring-amber-300' : ''}`}>{l} ({counts[k] || 0})</button>
          ))}
        </div>
      )}
      {!rows ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" /></div>
        : ordered.length === 0 ? <p className="text-sm text-slate-500 bg-white rounded-2xl border border-slate-100 p-6 text-center">{counts.all ? 'No leads in this view.' : 'No leads yet. They appear as people agree and match a reason.'}</p>
        : ordered.map((r) => {
          const wa = digits(r.phone);
          return (
            <div key={r.id} className={`bg-white rounded-2xl border p-4 space-y-2 ${isDue(r) ? 'border-amber-300' : 'border-slate-100'}`} data-testid="lead-card">
              <div className="flex justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <p className="font-black text-slate-900">{r.name} <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5">Priority {r.score}</span></p>
                  <p className="text-xs text-slate-500 break-all">{r.email} {r.phone && `· ${r.phone}`} {r.city && `· ${r.city}`}</p>
                </div>
                <select className="h-9 px-2 rounded-lg border border-slate-200 text-sm" value={r.status} onChange={(e) => save(r.id, { status: e.target.value })}>
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <p className="text-sm text-slate-700">{r.reason}</p>
              <div className="flex flex-wrap items-center gap-2">
                {wa ? (
                  <a href={`https://wa.me/${wa}?text=${encodeURIComponent(MESSAGE[brand](r))}`} target="_blank" rel="noopener noreferrer" onClick={() => save(r.id, { contacted: true })} className="inline-flex items-center gap-1 px-3 h-9 rounded-lg bg-emerald-600 text-white text-xs font-bold" data-testid="lead-whatsapp"><MessageCircle size={14} /> WhatsApp</a>
                ) : null}
                {r.phone ? (
                  <a href={`tel:${String(r.phone).replace(/[^\d+]/g, '')}`} onClick={() => save(r.id, { contacted: true })} className="inline-flex items-center gap-1 px-3 h-9 rounded-lg border border-slate-200 text-xs font-bold text-slate-700"><Phone size={14} /> Call</a>
                ) : <span className="text-xs text-slate-400">No phone number</span>}
                <label className="inline-flex items-center gap-1 text-xs text-slate-500 ml-auto">Follow up on
                  <input type="date" className="h-9 px-2 rounded-lg border border-slate-200 text-sm" value={dayOf(r.followUpAt)} onChange={(e) => save(r.id, { followUpAt: e.target.value || null })} />
                </label>
              </div>
              {r.lastContactedAt && <p className="text-[11px] text-slate-400">Last contacted {showDate(r.lastContactedAt)}</p>}
              <input className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm" placeholder="Note" defaultValue={r.note} maxLength={300} onBlur={(e) => e.target.value !== r.note && save(r.id, { note: e.target.value })} />
            </div>
          );
        })}
    </div>
  );
};
export default BrandLeads;
