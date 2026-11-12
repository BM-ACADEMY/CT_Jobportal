import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API = import.meta.env.VITE_API_BASE_URL;
const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
const img = (src) => (src && src.startsWith('/uploads/') ? `${API_DOMAIN}${src}` : src || '');
const empty = { imageUrl: '', linkUrl: '', altText: '', startsAt: '', endsAt: '', placement: 'home-top' };
const fmt = (d) => { try { return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

// Banner slots for the top of the Home page. Super Admin only. Nothing shows when no banner is active.
const Banners = () => {
  const [form, setForm] = useState(empty);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = async () => {
    try { const r = await axios.get(`${API}/admin/banners`); setRows(r.data.banners || []); }
    catch { toast.error('Could not load banners'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const r = await axios.post(`${API}/admin/blog-images`, fd);
      setForm((f) => ({ ...f, imageUrl: r.data.url }));
    } catch (err) { toast.error(err.response?.data?.msg || 'Could not upload the picture'); }
    finally { setUploading(false); }
  };
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/admin/banners`, { ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString() });
      toast.success('Banner saved');
      setForm(empty);
      load();
    } catch (err) { toast.error(err.response?.data?.msg || 'Could not save the banner'); }
    finally { setSaving(false); }
  };
  const remove = async (id) => {
    try { await axios.delete(`${API}/admin/banners/${id}`); load(); }
    catch (err) { toast.error(err.response?.data?.msg || 'Could not delete'); }
  };

  const field = 'w-full rounded-md border border-slate-200 px-3 py-2 text-sm';
  const now = Date.now();
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Home banners</h1>
        <p className="text-sm text-slate-500 mt-1">One banner shows at the top of the Home page between its start and end time. If none is active, nothing shows.</p>
      </div>
      <Card className="p-4 md:p-6">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2 flex items-center gap-3 flex-wrap">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
            <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Uploading...' : form.imageUrl ? 'Change picture' : 'Upload picture'}</Button>
            <span className="text-xs text-slate-500">or paste an https image link below</span>
          </div>
          <Input required className="md:col-span-2" placeholder="Image link (https://... or the uploaded /uploads/ path)" value={form.imageUrl} onChange={set('imageUrl')} />
          {form.imageUrl && <img src={img(form.imageUrl)} alt="" className="md:col-span-2 max-h-40 rounded-lg border border-slate-200 object-contain" />}
          <Input required className="md:col-span-2" placeholder="Link when tapped (https://... or /jobs)" value={form.linkUrl} onChange={set('linkUrl')} />
          <Input className="md:col-span-2" placeholder="Short description of the picture (for screen readers)" value={form.altText} onChange={set('altText')} />
          <label className="text-xs font-semibold text-slate-500">Starts<input required type="datetime-local" className={`${field} mt-1`} value={form.startsAt} onChange={set('startsAt')} /></label>
          <label className="text-xs font-semibold text-slate-500">Ends<input required type="datetime-local" className={`${field} mt-1`} value={form.endsAt} onChange={set('endsAt')} /></label>
          <div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : 'Save banner (home-top)'}</Button></div>
        </form>
      </Card>
      <Card className="p-4 md:p-6">
        {loading ? <Loader2 className="animate-spin text-slate-400" /> : rows.length === 0 ? <p className="text-sm text-slate-500">No banners yet.</p> : (
          <ul className="divide-y divide-slate-100">
            {rows.map((b) => {
              const live = b.active !== false && new Date(b.startsAt) <= now && new Date(b.endsAt) >= now;
              return (
                <li key={b._id} className="py-3 flex items-center gap-3 flex-wrap">
                  <img src={img(b.imageUrl)} alt="" className="h-12 w-24 object-cover rounded border border-slate-200" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 break-all">{b.linkUrl}</p>
                    <p className="text-xs text-slate-500">{fmt(b.startsAt)} to {fmt(b.endsAt)} · {live ? 'Showing now' : new Date(b.startsAt) > now ? 'Scheduled' : 'Ended'}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => remove(b._id)}>Delete</Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default Banners;
