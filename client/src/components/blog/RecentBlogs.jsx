import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { RECENT_BLOGS } from '../../data/blogs';

const RecentBlogs = ({ compact = false }) => (
  <section className={compact ? '' : 'max-w-7xl mx-auto px-6 py-14'} aria-labelledby="recent-blogs-title">
    <div className={compact ? 'mb-4' : 'flex items-end justify-between gap-4 mb-7'}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Career insights</p>
        <h2 id="recent-blogs-title" className={compact ? 'text-base font-bold text-slate-900' : 'text-2xl font-bold text-slate-900'}>Latest from our blog</h2>
      </div>
      {!compact && <Link to="/blog" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">View all articles</Link>}
    </div>

    <div className={compact ? 'space-y-4' : 'grid md:grid-cols-2 gap-6'}>
      {RECENT_BLOGS.map((blog) => (
        <article key={blog.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow">
          <img src={blog.image} alt="" className={`${compact ? 'h-24' : 'h-40'} w-full object-cover`} />
          <div className={compact ? 'p-4' : 'p-6'}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">{blog.category} · {blog.readTime}</p>
            <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-slate-900 leading-snug mb-2`}>{blog.title}</h3>
            {!compact && <p className="text-sm text-slate-500 leading-relaxed mb-4">{blog.excerpt}</p>}
            <Link to={`/blog/${blog.slug}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700">
              Read more <ArrowRight size={14} />
            </Link>
            <div className={`${compact ? 'mt-3 pt-3' : 'mt-5 pt-4'} flex items-center gap-2.5 border-t border-slate-100`}>
              <div className={`${compact ? 'h-8 w-8 text-[10px]' : 'h-9 w-9 text-xs'} flex shrink-0 items-center justify-center rounded-full bg-emerald-500 font-black text-white`} aria-hidden="true">V</div>
              <div className="min-w-0">
                <p className={`${compact ? 'text-xs' : 'text-sm'} truncate font-bold text-slate-900`}>{blog.author || 'Velai Vaaipu'}</p>
                <time dateTime={blog.date} className="block text-[11px] text-slate-500">{blog.date}</time>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
    {compact && <Link to="/blog" className="mt-4 inline-flex text-xs font-bold text-emerald-600 hover:text-emerald-700">See all articles →</Link>}
  </section>
);

export default RecentBlogs;
