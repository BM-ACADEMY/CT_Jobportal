import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { BookOpen, Loader2, Plus, ImagePlus, Trash2, ExternalLink } from 'lucide-react';
import BlogBody from '../../components/blog/BlogBody';

const API = import.meta.env.VITE_API_BASE_URL;
const API_DOMAIN = import.meta.env.VITE_API_DOMAIN || '';
const img = (src) => (src && src.startsWith('/uploads/') ? `${API_DOMAIN}${src}` : src || '');

const EMPTY = { title: '', slug: '', excerpt: '', body: '', coverImage: '', coverAlt: '', category: 'Career advice', tags: '', authorName: 'Velai Vaaipu', seoTitle: '', seoDescription: '', status: 'draft' };

const HELP = `Write in plain text. A blank line starts a new paragraph.
## Big heading      ### Smaller heading
- bullet point      1. numbered point
> a quote           **bold words**
[link words](https://example.com)
![picture description](picture address)`;

const ManageBlog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);      // null = list, object = editing
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const inlineRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/blog-posts`);
      setPosts(res.data.posts || []);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ ...EMPTY }); setEditingId(null); setPreview(false); };
  const openEdit = async (id) => {
    try {
      const res = await axios.get(`${API}/admin/blog-posts/${id}`);
      const p = res.data.post;
      setForm({ ...EMPTY, ...p, tags: (p.tags || []).join(', ') });
      setEditingId(id); setPreview(false);
    } catch { toast.error('Could not open the post'); }
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const upload = async (file, kind) => {
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append('image', file);
      const res = await axios.post(`${API}/admin/blog-images`, data);
      if (kind === 'cover') setForm((f) => ({ ...f, coverImage: res.data.url }));
      else setForm((f) => ({ ...f, body: `${f.body}${f.body.endsWith('\n') || !f.body ? '' : '\n\n'}![describe the picture](${res.data.url})\n\n` }));
      toast.success('Picture added');
    } catch (err) { toast.error(err.response?.data?.msg || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const save = async (status) => {
    setSaving(true);
    try {
      const payload = { ...form, status: status || form.status };
      const res = editingId ? await axios.put(`${API}/admin/blog-posts/${editingId}`, payload) : await axios.post(`${API}/admin/blog-posts`, payload);
      toast.success(payload.status === 'published' ? 'Published' : 'Saved as draft');
      setEditingId(res.data.post._id);
      setForm({ ...EMPTY, ...res.data.post, tags: (res.data.post.tags || []).join(', ') });
      load();
    } catch (err) { toast.error(err.response?.data?.msg || 'Could not save'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!editingId || !window.confirm('Delete this post for good?')) return;
    try {
      await axios.delete(`${API}/admin/blog-posts/${editingId}`);
      toast.success('Post deleted'); setForm(null); setEditingId(null); load();
    } catch { toast.error('Could not delete'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" /></div>;

  if (!form) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 py-6 px-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><BookOpen className="text-emerald-600" /> Blog posts</h1>
            <p className="text-sm text-slate-500 mt-1">Write and publish posts here. They appear on the Blog page and in the sitemap straight away. Older posts that live in the website code are not listed here.</p>
          </div>
          <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-sm font-bold px-5 h-11 shrink-0"><Plus size={15} /> New post</button>
        </div>
        {posts.length === 0 ? <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-sm text-slate-500">No posts yet. Tap New post.</div> : (
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
            {posts.map((p) => (
              <button key={p._id} onClick={() => openEdit(p._id)} className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-50">
                <div className="min-w-0 flex-1"><p className="font-bold text-sm text-slate-900 truncate">{p.title}</p><p className="text-xs text-slate-400">/blog/{p.slug} · {new Date(p.updatedAt).toLocaleDateString('en-IN')}</p></div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${p.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{p.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const input = 'w-full rounded-lg border border-slate-200 bg-white p-3 text-sm';
  const label = 'block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1';
  return (
    <div className="max-w-3xl mx-auto space-y-5 py-6 px-2">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => { setForm(null); setEditingId(null); }} className="text-sm font-bold text-slate-500">← All posts</button>
        {form.status === 'published' && form.slug && <a href={`/blog/${form.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">View live <ExternalLink size={13} /></a>}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div><label className={label}>Title</label><input className={input} value={form.title} onChange={set('title')} maxLength={120} placeholder="How to prepare for a walk-in interview" /></div>
        <div><label className={label}>Web address (leave empty to make it from the title)</label><input className={input} value={form.slug} onChange={set('slug')} maxLength={80} placeholder="walk-in-interview-tips" /></div>
        <div><label className={label}>Short summary (shown on cards and Google)</label><textarea className={input} rows={2} maxLength={300} value={form.excerpt} onChange={set('excerpt')} /></div>

        <div>
          <label className={label}>Cover picture</label>
          {form.coverImage && <img src={img(form.coverImage)} alt="" className="mb-2 h-40 w-full rounded-xl object-cover" />}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { upload(e.target.files?.[0], 'cover'); e.target.value = ''; }} />
          <div className="flex gap-2">
            <button disabled={uploading} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 text-sm font-bold px-4 h-10"><ImagePlus size={14} /> {form.coverImage ? 'Change picture' : 'Upload picture'}</button>
            {form.coverImage && <button onClick={() => setForm((f) => ({ ...f, coverImage: '' }))} className="text-sm font-bold text-slate-400 px-2">Remove</button>}
          </div>
          <input className={`${input} mt-2`} value={form.coverAlt} onChange={set('coverAlt')} maxLength={160} placeholder="Describe the picture in a few words" />
        </div>

        <div>
          <label className={label}>Post</label>
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setPreview(false)} className={`text-xs font-bold px-3 py-1.5 rounded-full ${!preview ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>Write</button>
            <button onClick={() => setPreview(true)} className={`text-xs font-bold px-3 py-1.5 rounded-full ${preview ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>Preview</button>
            <input ref={inlineRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { upload(e.target.files?.[0], 'inline'); e.target.value = ''; }} />
            <button disabled={uploading} onClick={() => inlineRef.current?.click()} className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><ImagePlus size={13} /> Add picture</button>
          </div>
          {preview ? <div className="rounded-xl border border-slate-100 p-4"><BlogBody body={form.body} /></div> : <textarea className={`${input} font-mono`} rows={16} value={form.body} onChange={set('body')} maxLength={50000} />}
          {!preview && <pre className="mt-2 text-[11px] text-slate-400 whitespace-pre-wrap">{HELP}</pre>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={label}>Category</label><input className={input} value={form.category} onChange={set('category')} maxLength={40} /></div>
          <div><label className={label}>Tags (comma between)</label><input className={input} value={form.tags} onChange={set('tags')} placeholder="pondicherry, freshers" /></div>
          <div><label className={label}>Author name</label><input className={input} value={form.authorName} onChange={set('authorName')} maxLength={60} /></div>
          <div><label className={label}>Google title (optional)</label><input className={input} value={form.seoTitle} onChange={set('seoTitle')} maxLength={70} /></div>
        </div>
        <div><label className={label}>Google description (optional)</label><textarea className={input} rows={2} maxLength={170} value={form.seoDescription} onChange={set('seoDescription')} /></div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={saving} onClick={() => save('published')} className="rounded-xl bg-emerald-600 text-white text-sm font-bold px-6 h-11 disabled:opacity-50">{form.status === 'published' ? 'Update live post' : 'Publish'}</button>
        <button disabled={saving} onClick={() => save('draft')} className="rounded-xl border border-slate-200 text-sm font-bold px-6 h-11 disabled:opacity-50">{form.status === 'published' ? 'Move back to draft' : 'Save draft'}</button>
        {editingId && <button onClick={remove} className="ml-auto inline-flex items-center gap-2 text-sm font-bold text-red-600"><Trash2 size={14} /> Delete</button>}
      </div>
    </div>
  );
};

export default ManageBlog;
