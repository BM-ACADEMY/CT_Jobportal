import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';
import BlogBody from '../components/blog/BlogBody';

const API = import.meta.env.VITE_API_BASE_URL;
const API_DOMAIN = import.meta.env.VITE_API_DOMAIN || '';
const SITE_URL = 'https://velaivaaipu.in';
export const coverUrl = (src) => (src && src.startsWith('/uploads/') ? `${API_DOMAIN}${src}` : src || '');

// A post written in the admin panel (older posts are the code-based ones in BlogDetails).
const DynamicBlogPost = ({ slug }) => {
  const [state, setState] = useState({ loading: true, post: null });
  useEffect(() => {
    let live = true;
    axios.get(`${API}/blogs/${encodeURIComponent(slug)}`)
      .then((r) => live && setState({ loading: false, post: r.data.post }))
      .catch(() => live && setState({ loading: false, post: null }));
    return () => { live = false; };
  }, [slug]);

  if (state.loading) return <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm">Loading…</div>;
  const post = state.post;
  if (!post) return <Navigate to="/blog" replace />;

  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = coverUrl(post.coverImage);
  const schema = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt || undefined,
    image: image || undefined, datePublished: post.publishedAt, dateModified: post.updatedAt || post.publishedAt,
    author: { '@type': 'Organization', name: post.authorName || 'Velai Vaaipu' },
    publisher: { '@type': 'Organization', name: 'Velaivaaipu' }, mainEntityOfPage: url
  };

  return (
    <article className="bg-white min-h-screen">
      <SEOHead title={post.seoTitle || `${post.title} | Velaivaaipu`} description={post.seoDescription || post.excerpt} path={`/blog/${post.slug}`} type="article" image={image || undefined} imageAlt={post.coverAlt} schema={schema} />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><ArrowLeft size={15} /> All posts</Link>
        <p className="mt-8 text-[11px] font-bold uppercase tracking-widest text-emerald-600">{post.category} · {post.readMinutes} min read</p>
        <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">{post.title}</h1>
        <p className="mt-4 text-sm text-slate-500">{post.authorName} · <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</time></p>
        {image && <img src={image} alt={post.coverAlt || ''} className="mt-8 w-full rounded-3xl object-cover" />}
        <div className="mt-10"><BlogBody body={post.body} /></div>
        {(post.tags || []).length > 0 && <p className="mt-10 text-xs text-slate-400">{post.tags.map((t) => `#${t}`).join('  ')}</p>}
      </div>
    </article>
  );
};

export default DynamicBlogPost;
