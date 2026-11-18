import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API = import.meta.env.VITE_API_BASE_URL;
const empty = { title: '', employerName: '', applyUrl: '', sourceName: '', location: '', jobType: 'Full-time', workMode: 'On-site', vacancies: 1, description: '' };

// Jobs found on Google or an employer's careers page. Candidates apply on the employer's site, not here.
const ExternalJobs = () => {
  const [form, setForm] = useState(empty);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = async () => {
    try { const r = await axios.get(`${API}/admin/external-jobs`); setJobs(r.data.jobs || []); }
    catch { toast.error('Could not load the list'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/admin/external-jobs`, form);
      toast.success('Posted. Candidates will apply on the employer site.');
      setForm(empty);
      load();
    } catch (err) { toast.error(err.response?.data?.msg || 'Could not post the job'); }
    finally { setSaving(false); }
  };

  const field = 'w-full rounded-md border border-slate-200 px-3 py-2 text-sm';
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Web jobs</h1>
        <p className="text-sm text-slate-500 mt-1">For jobs found on Google or a careers page. The Apply button sends candidates to the employer's own link. Write the description in your own words and name the source. Never paste money-asking or WhatsApp-only jobs.</p>
      </div>
      <Card className="p-4 md:p-6">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <Input required placeholder="Job title" value={form.title} onChange={set('title')} />
          <Input required placeholder="Real employer name" value={form.employerName} onChange={set('employerName')} />
          <Input required className="md:col-span-2" placeholder="Apply link (https://...) from the employer's site" value={form.applyUrl} onChange={set('applyUrl')} />
          <Input placeholder="Source, e.g. Company careers page" value={form.sourceName} onChange={set('sourceName')} />
          <Input required placeholder="City, e.g. Puducherry" value={form.location} onChange={set('location')} />
          <select className={field} value={form.jobType} onChange={set('jobType')}>
            {['Full-time', 'Part-time', 'Contract', 'Internship'].map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className={field} value={form.workMode} onChange={set('workMode')}>
            {['On-site', 'Remote', 'Hybrid'].map((t) => <option key={t}>{t}</option>)}
          </select>
          <textarea required minLength={30} rows={5} className={`${field} md:col-span-2`} placeholder="Short description in your own words (role, who can apply, how many openings)" value={form.description} onChange={set('description')} />
          <Button type="submit" disabled={saving} className="md:col-span-2">{saving ? <Loader2 className="animate-spin" size={16} /> : 'Post web job'}</Button>
        </form>
      </Card>
      <Card className="p-4 md:p-6">
        <h2 className="font-semibold text-slate-900 mb-3">Posted web jobs</h2>
        {loading ? <Loader2 className="animate-spin" /> : jobs.length === 0 ? <p className="text-sm text-slate-500">None yet.</p> : (
          <ul className="divide-y divide-slate-100">
            {jobs.map((j) => (
              <li key={j._id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{j.title} <span className="text-slate-400 font-normal">at {j.externalApply?.employerName}</span></p>
                  <p className="text-xs text-slate-500">{j.location} · {j.status}{j.hiddenFromPublic ? ' · hidden' : ''} · closes {j.validThrough ? new Date(j.validThrough).toLocaleDateString() : 'n/a'}</p>
                  <a href={j.externalApply?.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1">Check the link still works <ExternalLink size={12} /></a>
                </div>
                <div className="text-right shrink-0"><p className="text-lg font-semibold">{j.externalApply?.clicks || 0}</p><p className="text-[10px] uppercase text-slate-400">apply clicks</p></div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default ExternalJobs;
