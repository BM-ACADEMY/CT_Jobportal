import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API = import.meta.env.VITE_API_BASE_URL;
const empty = { title: '', department: '', lastDate: '', notificationUrl: '', location: '', vacancies: 1, description: '' };
const fmt = (d) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };

// Government jobs: the Super Admin and staff with the "government jobs" permission post these. Companies cannot.
const GovernmentJobsAdmin = () => {
  const [form, setForm] = useState(empty);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = async () => {
    try { const r = await axios.get(`${API}/admin/government-jobs`); setJobs(r.data.jobs || []); }
    catch { toast.error('Could not load the list'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/admin/government-jobs`, form);
      toast.success('Posted. It shows on the Government jobs page until the last date.');
      setForm(empty);
      load();
    } catch (err) { toast.error(err.response?.data?.msg || 'Could not post the job'); }
    finally { setSaving(false); }
  };
  const close = async (id) => {
    try { await axios.patch(`${API}/admin/government-jobs/${id}/close`); toast.success('Taken off the public page'); load(); }
    catch (err) { toast.error(err.response?.data?.msg || 'Could not close it'); }
  };

  const field = 'w-full rounded-md border border-slate-200 px-3 py-2 text-sm';
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Government jobs</h1>
        <p className="text-sm text-slate-500 mt-1">Copy the facts from the official notification and paste its link. Write the summary in your own words. The post hides itself after the last date.</p>
      </div>
      <Card className="p-4 md:p-6">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <Input required placeholder="Post name (for example Junior Assistant)" value={form.title} onChange={set('title')} />
          <Input required placeholder="Department or recruiting body" value={form.department} onChange={set('department')} />
          <label className="text-xs font-semibold text-slate-500">Last date to apply
            <input required type="date" className={`${field} mt-1`} value={form.lastDate} onChange={set('lastDate')} />
          </label>
          <Input type="number" min="1" placeholder="Vacancies" value={form.vacancies} onChange={set('vacancies')} />
          <Input required className="md:col-span-2" placeholder="Official notification link (https://...)" value={form.notificationUrl} onChange={set('notificationUrl')} />
          <Input className="md:col-span-2" placeholder="Location (default: India)" value={form.location} onChange={set('location')} />
          <textarea required rows={4} className={`${field} md:col-span-2`} placeholder="Short summary: qualification, age limit, how to apply (at least 30 characters)" value={form.description} onChange={set('description')} />
          <div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : 'Post government job'}</Button></div>
        </form>
      </Card>
      <Card className="p-4 md:p-6">
        {loading ? <Loader2 className="animate-spin text-slate-400" /> : jobs.length === 0 ? <p className="text-sm text-slate-500">Nothing posted yet.</p> : (
          <ul className="divide-y divide-slate-100">
            {jobs.map((j) => (
              <li key={j._id} className="py-3 flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{j.title} <span className="text-slate-500 font-normal">· {j.department}</span></p>
                  <p className="text-xs text-slate-500">Last date {fmt(j.lastDate)} · {j.showing ? 'Showing' : 'Hidden'}</p>
                </div>
                {j.showing && <Button variant="outline" size="sm" onClick={() => close(j._id)}>Take down</Button>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default GovernmentJobsAdmin;
