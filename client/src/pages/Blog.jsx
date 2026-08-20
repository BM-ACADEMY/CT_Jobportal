import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BLOGS } from '../data/blogs';

const Blog = () => (
  <div className="bg-slate-50 min-h-screen">
    <header className="bg-slate-950 px-6 py-20 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400 mb-4">Velaivaaipu Blog</p>
      <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Ideas for your next career move</h1>
      <p className="text-slate-400 max-w-2xl mx-auto">Clear, useful advice for finding work, growing your skills, and hiring great people.</p>
    </header>
    <main className="max-w-7xl mx-auto px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
      {BLOGS.map((blog) => (
        <article key={blog.slug} className="flex flex-col rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all">
          <img src={blog.image} alt="" className="h-48 w-full object-cover" />
          <div className="flex flex-1 flex-col p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-3">{blog.category} · {blog.readTime}</p>
            <h2 className="text-xl font-bold text-slate-900 leading-snug mb-3">{blog.title}</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-5 line-clamp-4">{blog.excerpt}</p>
            <Link to={`/blog/${blog.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 mb-6">Read more <ArrowRight size={15} /></Link>
            <div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white shadow-sm ring-4 ring-emerald-50" aria-hidden="true">V</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{blog.author || 'Velai Vaaipu'}</p>
                <time dateTime={blog.date} className="mt-0.5 block text-xs text-slate-500">{blog.date}</time>
              </div>
            </div>
          </div>
        </article>
      ))}
    </main>
  </div>
);

export default Blog;
