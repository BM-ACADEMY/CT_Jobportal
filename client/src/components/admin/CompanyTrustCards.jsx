import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_BASE_URL;
const box = 'p-8 rounded-[20px] border border-slate-100 shadow-sm bg-white space-y-3';
const area = 'w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-400';

// "Verified employer": the admin switches it on after a telecaller phoned the company. A note is required (the server checks too).
export const VerifiedByCallCard = ({ company, onChange }) => {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const on = !!company.verifiedByCall;

  const save = async (value) => {
    if (note.trim().length < 5) { toast.error('Write who called and what they confirmed (at least 5 characters).'); return; }
    setBusy(true);
    try {
      const res = await axios.patch(`${API}/admin/companies/${company._id}/verified-by-call`, { value, note });
      onChange && onChange(res.data.company);
      setNote('');
      toast.success(res.data.msg);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not update');
    } finally { setBusy(false); }
  };

  return (
    <div className={box}>
      <h3 className="text-base font-bold text-slate-900">Verified employer (by call)</h3>
      <p className="text-xs text-slate-500">Switch on only after a telecaller phoned the company and confirmed it is real. Candidates then see a "Verified employer" badge.</p>
      <p className="text-xs text-slate-600">
        Status: <b>{on ? 'Verified employer' : 'Not marked'}</b>
        {on && company.verifiedByCallAt ? ` since ${new Date(company.verifiedByCallAt).toLocaleDateString('en-IN')}` : ''}
        {company.verifiedByCallNote ? `. Note: ${company.verifiedByCallNote}` : ''}
      </p>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2} className={area}
        placeholder="Required: who called, when, and what the owner confirmed" />
      <button type="button" disabled={busy} onClick={() => save(!on)}
        className={`h-10 px-4 rounded-xl text-sm font-bold ${on ? 'border border-slate-200 text-slate-700 bg-white' : 'bg-emerald-600 text-white'}`}>
        {busy ? 'Saving...' : on ? 'Remove the mark' : 'Mark as verified employer'}
      </button>
    </div>
  );
};

// Proofs sent by free-email companies. Approving verifies the company (with the note); rejecting leaves it unverified.
export const ProofQueue = ({ onDone }) => {
  const [rows, setRows] = useState([]);
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    try { const res = await axios.get(`${API}/admin/company-proofs`); setRows(Array.isArray(res.data) ? res.data : []); } catch { setRows([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const decide = async (id, action) => {
    const note = (notes[id] || '').trim();
    if (note.length < 5) { toast.error('Write what you checked first (at least 5 characters).'); return; }
    try {
      const res = await axios.post(`${API}/admin/company-proofs/${id}/${action}`, { note });
      toast.success(res.data.msg);
      await load();
      onDone && onDone();
    } catch (err) { toast.error(err.response?.data?.msg || 'Could not save'); }
  };

  if (!rows.length) return null;
  const apiRoot = String(import.meta.env.VITE_API_DOMAIN || '').replace(/\/$/, '');
  return (
    <div className={box}>
      <h3 className="text-base font-bold text-slate-900">Proofs waiting ({rows.length})</h3>
      <p className="text-xs text-slate-500">Sent by companies on a free email. Check the proof, write what you checked, then approve or reject.</p>
      {rows.map((r) => (
        <div key={r._id} className="border border-slate-100 rounded-xl p-4 space-y-2">
          <p className="text-sm font-bold text-slate-900">{r.company?.name || 'Company'} <span className="text-xs font-medium text-slate-500">{r.email}</span></p>
          <p className="text-xs text-slate-600">
            {String(r.proofType).toUpperCase()}: {/^https?:\/\//.test(r.proofValue)
              ? <a href={r.proofValue} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline break-all">{r.proofValue}</a>
              : (r.proofValue || 'see file')}
            {r.proofFile ? <> · <a href={`${apiRoot}${r.proofFile}`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">Open PDF</a></> : null}
          </p>
          <textarea value={notes[r._id] || ''} onChange={(e) => setNotes((n) => ({ ...n, [r._id]: e.target.value }))} maxLength={300} rows={2} className={area} placeholder="What did you check?" />
          <div className="flex gap-2">
            <button type="button" onClick={() => decide(r._id, 'approve')} className="h-9 px-4 rounded-xl text-sm font-bold bg-emerald-600 text-white">Approve and verify</button>
            <button type="button" onClick={() => decide(r._id, 'reject')} className="h-9 px-4 rounded-xl text-sm font-bold border border-slate-200 bg-white text-slate-700">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
};
