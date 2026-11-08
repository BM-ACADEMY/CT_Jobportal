import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, QrCode } from 'lucide-react';
import { API, fmtDate, inputCls } from './driveUi';

// One drive: details, share, and the registration form.
const DriveDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [missing, setMissing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', slot: '', answers: [] });
  const [busy, setBusy] = useState(false);

  useEffect(() => { axios.get(`${API}/drives/${slug}`).then((r) => setD(r.data)).catch(() => setMissing(true)); }, [slug]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await axios.post(`${API}/drives/${slug}/register`, form);
      toast.success(r.data.already ? 'You are already registered' : 'You are registered');
      navigate(`/drive-pass/${r.data.code}`);
    } catch (err) { toast.error(err.response?.data?.msg || 'Could not register'); } finally { setBusy(false); }
  };

  if (missing) return <div className="max-w-xl mx-auto px-4 py-16 text-center"><p className="font-bold text-slate-600">This drive is not available.</p><Link className="text-emerald-700 text-sm font-bold" to="/drives">See all drives</Link></div>;
  if (!d) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-600" /></div>;
  const closed = d.status === 'closed' || new Date(d.date) < new Date(Date.now() - 864e5);
  const full = d.spotsLeft === 0;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-5">
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <h1 className="text-xl font-black text-slate-900">{d.title}</h1>
        <p className="text-xs text-slate-500">{d.organiserName}</p>
        <p className="text-sm text-slate-800 font-semibold">{fmtDate(d.date)}</p>
        <p className="text-sm text-slate-700">{[d.venue?.name, d.venue?.address].filter(Boolean).join(', ')}</p>
        {d.venue?.mapUrl && <a href={d.venue.mapUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-emerald-700">Open in Maps</a>}
        <div>{d.roles.map((r) => <p key={r.title} className="text-sm text-slate-700">• {r.title}{r.vacancies ? ` (${r.vacancies})` : ''}{r.pay ? ` · ${r.pay}` : ''}</p>)}</div>
        {d.documents?.length > 0 && <p className="text-sm text-slate-700"><b>Bring:</b> {d.documents.join(', ')}</p>}
        {d.description && <p className="text-sm text-slate-600 whitespace-pre-line">{d.description}</p>}
        <div className="flex gap-2 flex-wrap">
          <a className="h-10 px-4 inline-flex items-center rounded-xl bg-emerald-600 text-white text-sm font-bold" href={`https://wa.me/?text=${encodeURIComponent(d.shareText)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
        </div>
        <img src={`${API}/drives/${slug}/qr.png`} alt="QR code for this drive" className="w-32 h-32" />
      </div>

      {closed ? <p className="text-center text-sm font-bold text-slate-500">Registration is closed.</p>
        : full ? <p className="text-center text-sm font-bold text-rose-600">Registrations are full.</p> : (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <h2 className="font-black text-slate-900 flex items-center gap-2"><QrCode size={16} className="text-emerald-600" /> Register free</h2>
          <input className={inputCls} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputCls} placeholder="Mobile number" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <input className={inputCls} placeholder="Email (for your pass and reminders)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select className={inputCls} value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} required>
            <option value="">Choose a time slot</option>
            {d.slots.map((s) => <option key={s.label} value={s.label} disabled={s.left === 0}>{s.label}{s.left === 0 ? ' (full)' : ` (${s.left} left)`}</option>)}
          </select>
          {d.screeningQuestions.map((q, i) => (
            <input key={q} className={inputCls} placeholder={q} value={form.answers[i] || ''} onChange={(e) => { const a = [...form.answers]; a[i] = e.target.value; setForm({ ...form, answers: a }); }} />
          ))}
          <button disabled={busy} className="w-full h-12 rounded-xl bg-emerald-600 text-white font-black disabled:opacity-60">{busy ? 'Please wait…' : 'Register'}</button>
        </form>
      )}
    </div>
  );
};
export default DriveDetail;
