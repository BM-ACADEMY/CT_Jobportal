import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BLOGS } from '../data/blogs';

const Blog = () => (
  <div className="bg-slate-50 min-h-screen">
    <header className="relative bg-slate-950 px-6 py-16 md:py-20 text-center overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#34b678]/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#34b678]/10 border border-[#34b678]/20 rounded-full px-4 py-1.5 mb-6 md:mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34b678] animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#34b678]">Velaivaaipu Blog</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 md:mb-6 tracking-tighter leading-[1.1]">
          Ideas for your <span className="text-[#34b678]">next career move</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
          Clear, useful advice for finding work, growing your skills, and hiring great people.
        </p>
      </div>
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
