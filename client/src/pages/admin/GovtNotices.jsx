import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Landmark, Loader2, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API = import.meta.env.VITE_API_BASE_URL;
const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'not yet');

// Official pages are checked every morning. New recruitment notices wait here: open the notice, then post it as a job or dismiss it.
const GovtNotices = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ sources: [], notices: [] });
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try { const r = await axios.get(`${API}/admin/govt-notices`); setData(r.data); }
    catch { toast.error('Could not load government notices'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setAdding(true);
    try { await axios.post(`${API}/admin/govt-notices/sources`, { name, url }); setName(''); setUrl(''); toast.success('Page added and checked once'); load(); }
    catch (err) { toast.error(err.response?.data?.msg || 'Could not add the page'); }
    finally { setAdding(false); }
  };
  const toggle = async (s) => { try { await axios.patch(`${API}/admin/govt-notices/sources/${s._id}`, { active: !s.active }); load(); } catch { toast.error('Failed'); } };
  const mark = async (n, status) => { try { await axios.patch(`${API}/admin/govt-notices/${n._id}`, { status }); load(); } catch { toast.error('Failed'); } };
  const post = async (n) => {
    await mark(n, 'posted');
    const q = new URLSearchParams({ title: n.title, url: n.url, source: n.source?.name || 'Government notice' });
    navigate(`/admin/web-jobs?${q.toString()}`);
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
  const fresh = data.notices.filter((n) => n.status === 'new');
  const rest = data.notices.filter((n) => n.status !== 'new');

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 m-0 flex items-center gap-2"><Landmark size={28} /> Government jobs</h1>
        <p className="text-slate-500 mt-1 m-0">We check the official pages below every morning. New recruitment notices appear here. Nothing is posted until you approve it.</p>
      </div>

      <form onSubmit={add} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 grid gap-3 md:grid-cols-[1fr_2fr_auto] items-end" data-testid="govt-add">
        <label className="grid gap-1 text-sm font-bold text-slate-700">Name<Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="TNPSC recruitment" /></label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">Official page (https)<Input required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></label>
        <Button type="submit" disabled={adding} className="h-10 gap-1">{adding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Watch</Button>
      </form>

      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5" data-testid="govt-new">
        <h2 className="text-lg font-bold text-slate-900 mt-0">New notices ({fresh.length})</h2>
        {fresh.length === 0 ? <p className="text-slate-500 text-sm m-0">Nothing new. The next check is tomorrow morning. Notices already on a page when you add it are not shown.</p> : (
          <ul className="list-none p-0 m-0 divide-y divide-slate-50">
            {fresh.map((n) => (
              <li key={n._id} className="py-3 grid gap-2">
                <p className="m-0 font-semibold text-slate-900">{n.title}</p>
                <p className="m-0 text-xs text-slate-400">{n.source?.name} · found {when(n.createdAt)}</p>
                <div className="flex flex-wrap gap-2">
                  <a href={n.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 no-underline"><ExternalLink size={13} /> Open notice</a>
                  <button type="button" onClick={() => post(n)} className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold">Post as job</button>
                  <button type="button" onClick={() => mark(n, 'ignored')} className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold">Ignore</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5" data-testid="govt-sources">
        <h2 className="text-lg font-bold text-slate-900 mt-0">Pages we watch ({data.sources.length})</h2>
        {data.sources.length === 0 ? <p className="text-slate-500 text-sm m-0">None yet. Add the "Recruitment" or "Notifications" page of a department above.</p> : (
          <ul className="list-none p-0 m-0 divide-y divide-slate-50">
            {data.sources.map((s) => (
              <li key={s._id} className="py-2 flex flex-wrap justify-between gap-2 text-sm">
                <span><b>{s.name}</b><span className="block text-xs text-slate-400 break-all">{s.url}</span>{s.lastError ? <span className="block text-xs text-rose-600">Last check failed: {s.lastError}</span> : <span className="block text-xs text-slate-400">Last checked {when(s.lastScanAt)}</span>}</span>
                <button type="button" onClick={() => toggle(s)} className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold self-start">{s.active ? 'Pause' : 'Resume'}</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {rest.length > 0 && (
        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-900 mt-0">Earlier</h2>
          <ul className="list-none p-0 m-0 divide-y divide-slate-50 text-sm">
            {rest.slice(0, 40).map((n) => <li key={n._id} className="py-2 flex justify-between gap-3"><span>{n.title}</span><span className="text-xs font-bold text-slate-500">{n.status === 'posted' ? 'Posted' : 'Ignored'}</span></li>)}
          </ul>
        </section>
      )}
    </div>
  );
};

export default GovtNotices;
