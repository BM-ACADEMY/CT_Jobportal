import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { CalendarDays, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API = import.meta.env.VITE_API_BASE_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const LABEL = { pending: 'Waiting for review', published: 'Published', closed: 'Closed', draft: 'Not published' };
const COLOR = { pending: 'text-amber-700', published: 'text-emerald-700', closed: 'text-slate-500', draft: 'text-slate-500' };
const empty = { title: '', organiserName: '', date: '', endDate: '', venueName: '', city: '', address: '', description: '', eligibility: '' };

// An employer or recruiter sends in a job fair. It is reviewed by an admin before it appears on /job-fairs.
const SendJobFair = () => {
  const [form, setForm] = useState(empty);
  const [sending, setSending] = useState(false);
  const [mine, setMine] = useState([]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = () => axios.get(`${API}/job-fairs/mine`, authHeader()).then((r) => setMine(r.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const body = {
        title: form.title, organiserName: form.organiserName, date: form.date, endDate: form.endDate || undefined,
        venue: { name: form.venueName, city: form.city, address: form.address },
        description: form.description, eligibility: form.eligibility,
      };
      const { data } = await axios.post(`${API}/job-fairs/submit`, body, authHeader());
      toast.success(data.msg || 'Sent for review.');
      setForm(empty);
      load();
    } catch (err) { toast.error(err.response?.data?.msg || 'Could not send the fair.'); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 m-0 flex items-center gap-2"><CalendarDays size={28} /> Send in a job fair</h1>
        <p className="text-slate-500 mt-1 m-0">Running a hiring event? Tell us the details. We review it and, if it is free for job seekers, list it on the Job Fairs page.</p>
      </div>

      <form onSubmit={submit} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 grid gap-4" data-testid="fair-form">
        <label className="grid gap-1 text-sm font-bold text-slate-700">Fair title<Input required minLength={5} value={form.title} onChange={set('title')} placeholder="e.g. Puducherry Walk-in Hiring Day" /></label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">Organised by<Input value={form.organiserName} onChange={set('organiserName')} placeholder="Your company or organisation" /></label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm font-bold text-slate-700">Date<Input required type="date" value={form.date} onChange={set('date')} /></label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">End date (if more than a day)<Input type="date" value={form.endDate} onChange={set('endDate')} /></label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm font-bold text-slate-700">Venue name<Input value={form.venueName} onChange={set('venueName')} /></label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">City<Input value={form.city} onChange={set('city')} placeholder="Puducherry" /></label>
        </div>
        <label className="grid gap-1 text-sm font-bold text-slate-700">Address<Input value={form.address} onChange={set('address')} /></label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">What roles and what to bring
          <textarea value={form.description} onChange={set('description')} rows={4} className="rounded-md border border-slate-200 p-2 text-sm font-normal" />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">Who can attend<Input value={form.eligibility} onChange={set('eligibility')} placeholder="e.g. Any graduate, freshers welcome" /></label>
        <p className="text-xs text-slate-500 m-0">Job seekers must be able to attend free of charge. Fairs that ask for money, OTPs or private chat are not accepted.</p>
        <Button type="submit" disabled={sending} className="h-11 gap-2 justify-self-start">{sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Send for review</Button>
      </form>

      {mine.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5" data-testid="my-fairs">
          <h2 className="text-lg font-bold text-slate-900 mt-0">Your fairs</h2>
          <ul className="list-none p-0 m-0 divide-y divide-slate-50">
            {mine.map((f) => (
              <li key={f._id} className="py-2 flex justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-800">{f.title}<span className="block text-xs text-slate-400">{new Date(f.date).toLocaleDateString('en-IN')}</span></span>
                <span className={`font-bold ${COLOR[f.status] || ''}`}>{LABEL[f.status] || f.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SendJobFair;
