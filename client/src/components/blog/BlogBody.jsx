import React from 'react';
import { parseBody } from '../../data/blogBody';

const API_DOMAIN = import.meta.env.VITE_API_DOMAIN || '';
const imgSrc = (src) => (src.startsWith('/uploads/') ? `${API_DOMAIN}${src}` : src);

const Inline = ({ parts }) => parts.map((p, i) => {
  if (p.t === 'bold') return <strong key={i} className="font-bold text-slate-900">{p.text}</strong>;
  if (p.t === 'link') return <a key={i} href={p.href} className="text-emerald-700 underline underline-offset-2" {...(p.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{p.text}</a>;
  return <React.Fragment key={i}>{p.text}</React.Fragment>;
});

// Shows an admin-written post. Everything is built from the parsed blocks, never from raw HTML.
const BlogBody = ({ body }) => (
  <div className="space-y-5 text-[17px] leading-8 text-slate-700">
    {parseBody(body).map((b, i) => {
      if (b.type === 'h2') return <h2 key={i} className="pt-4 text-2xl font-black tracking-tight text-slate-900"><Inline parts={b.inline} /></h2>;
      if (b.type === 'h3') return <h3 key={i} className="pt-2 text-xl font-bold text-slate-900"><Inline parts={b.inline} /></h3>;
      if (b.type === 'quote') return <blockquote key={i} className="border-l-4 border-emerald-500 bg-emerald-50/50 py-2 pl-4 italic"><Inline parts={b.inline} /></blockquote>;
      if (b.type === 'img') return <img key={i} src={imgSrc(b.src)} alt={b.alt} loading="lazy" className="w-full rounded-2xl" />;
      if (b.type === 'ul') return <ul key={i} className="list-disc space-y-2 pl-6">{b.items.map((it, j) => <li key={j}><Inline parts={it} /></li>)}</ul>;
      if (b.type === 'ol') return <ol key={i} className="list-decimal space-y-2 pl-6">{b.items.map((it, j) => <li key={j}><Inline parts={it} /></li>)}</ol>;
      return <p key={i}><Inline parts={b.inline} /></p>;
    })}
  </div>
);

export default BlogBody;
