import React, { useEffect, useState } from 'react';
import SEOHead from '../../components/seo/SEOHead';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, MapPin, ExternalLink, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_BASE_URL;
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' });

// One fair: details, official link, I am going, free fair-ready kit, poster card.
// Companies and recruiters can ask for a stall at our own fairs. The admin approves; any price comes from Settings and is shown only if set.
const StallRequest = ({ slug }) => {
  const [s, setS] = useState(null);
  const [form, setForm] = useState({ name: '', contactName: '', phone: '', email: '', need: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { axios.get(`${API}/job-fairs/${slug}/stall`).then((r) => setS(r.data)).catch(() => setS(null)); }, [slug]);
  const set = (k) => (e) => setForm((x) => ({ ...x, [k]: e.target.value }));
  const submit = async () => {
    setBusy(true);
    try { await axios.post(`${API}/job-fairs/${slug}/stall`, form); setS((x) => ({ ...x, mine: { name: form.name, status: 'requested', need: form.need } })); toast.success('Request sent. We will contact you.'); }
    catch (err) { toast.error(err.response?.data?.msg || 'Could not send the request'); } finally { setBusy(false); }
  };
  if (!s || !s.open) return null;
  const box = 'w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm';
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
      <p className="font-black text-slate-900 text-sm">Hiring? Ask for a stall</p>
      {s.price && <p className="text-xs text-slate-600">Stall price: {s.price}</p>}
      {s.mine ? <p className="text-sm text-slate-700">Your request for {s.mine.name} is {s.mine.status === 'approved' ? 'approved' : s.mine.status === 'declined' ? 'not accepted this time' : 'with us. We will contact you'}.</p> : (
        <div className="grid gap-2">
          <input className={box} placeholder="Company name" value={form.name} onChange={set('name')} />
          <input className={box} placeholder="Contact person" value={form.contactName} onChange={set('contactName')} />
          <input className={box} placeholder="Mobile number" inputMode="tel" value={form.phone} onChange={set('phone')} />
          <input className={box} placeholder="Email (optional)" value={form.email} onChange={set('email')} />
          <textarea className="w-full rounded-xl border border-slate-200 p-3 text-sm" rows={2} placeholder="What do you need? For example one table, 3 roles" value={form.need} onChange={set('need')} />
          <button type="button" disabled={busy} onClick={submit} className="h-11 px-5 rounded-xl bg-emerald-600 text-white font-bold text-sm">Request a stall</button>
        </div>
      )}
    </div>
  );
};

const JobFairDetail = () => {
  const { user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [f, setF] = useState(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => { axios.get(`${API}/job-fairs/${slug}`).then((r) => setF(r.data)).catch(() => setF(null)); }, [slug]);

  const going = async () => {
    setBusy(true);
    try {
      const r = await axios.post(`${API}/job-fairs/${slug}/going`);
      setF((x) => ({ ...x, mine: r.data.going, going: r.data.count ?? x.going }));
      toast.success(r.data.going ? 'Done. We will remind you before the fair.' : 'Removed');
    } catch (err) {
      if (err.response?.status === 401) { toast('Please sign in to get reminders'); navigate('/login'); }
      else toast.error('Could not save. Please try again.');
    } finally { setBusy(false); }
  };

  if (f === undefined) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-600" /></div>;
  if (!f) return <div className="max-w-xl mx-auto px-4 py-16 text-center"><p className="font-bold text-slate-600">This fair was not found.</p><Link to="/job-fairs" className="text-emerald-700 font-bold text-sm">See all fairs</Link></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <SEOHead title={`${f.title} | Job Fair | Velaivaaipu`} description={`${f.title}, ${fmt(f.date)}${f.venue?.city ? `, ${f.venue.city}` : ''}. Venue, documents to bring and the official registration link.`} />
      <Link to="/job-fairs" className="text-xs font-bold text-emerald-700">All job fairs</Link>
      <div>
        <h1 className="text-2xl font-black text-slate-900">{f.title}</h1>
        {f.organiserName && <p className="text-sm text-slate-500 mt-1">Organised by {f.organiserName}</p>}
        {f.supportedByUs && <p className="text-xs font-bold text-emerald-700 mt-1">Supported by Velaivaaipu</p>}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 text-sm text-slate-700">
        <p className="font-bold">{fmt(f.date)}{f.endDate ? ` to ${fmt(f.endDate)}` : ''}</p>
        <p className="flex items-start gap-1"><MapPin size={14} className="mt-0.5 shrink-0" /> {[f.venue?.name, f.venue?.address, f.venue?.city].filter(Boolean).join(', ')}</p>
        {f.venue?.mapUrl && <a href={f.venue.mapUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold text-xs">Open in maps</a>}
        {f.eligibility && <p><b>Who can attend:</b> {f.eligibility}</p>}
        {f.documents?.length > 0 && <p><b>Bring:</b> {f.documents.join(', ')}</p>}
        {f.description && <p className="whitespace-pre-line">{f.description}</p>}
        {f.companies?.length > 0 && <p><b>Companies listed:</b> {f.companies.join(', ')}</p>}
      </div>
      {f.closed ? <p className="text-sm font-bold text-slate-500">This fair is over.</p> : (
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={going} disabled={busy} className={`h-11 px-5 rounded-xl font-bold text-sm ${f.mine ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-emerald-600 text-white'}`}>{f.mine ? 'You are going. Tap to undo' : 'I am going. Remind me'}</button>
          {f.officialUrl && <a href={f.officialUrl} target="_blank" rel="noopener noreferrer" className="h-11 px-5 rounded-xl border border-slate-200 bg-white font-bold text-sm inline-flex items-center justify-center gap-1">Official registration <ExternalLink size={14} /></a>}
        </div>
      )}
      {f.going > 0 && <p className="text-xs text-slate-500">{f.going} job seekers are going.</p>}
      {f.kind === 'own' && !f.closed && ['company', 'recruiter'].includes(user?.role) && <StallRequest slug={f.slug} />}
      <div className="bg-emerald-50 rounded-2xl p-4 space-y-2">
        <p className="font-black text-slate-900 text-sm">Get ready for the fair (free)</p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-5">
          <li><Link to="/candidate/resume-builder" className="text-emerald-700 font-bold">Make your resume</Link> and print copies to carry</li>
          <li><Link to="/candidate/mock-interviews" className="text-emerald-700 font-bold">Practise an interview</Link></li>
          <li><Link to="/candidate/skill-tests" className="text-emerald-700 font-bold">Take a skill test</Link> and show your score</li>
        </ul>
      </div>
      <a href={`${API}/job-fairs/${f.slug}/card.svg`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600"><Download size={14} /> Open the poster card to share</a>
    </div>
  );
};
export default JobFairDetail;
