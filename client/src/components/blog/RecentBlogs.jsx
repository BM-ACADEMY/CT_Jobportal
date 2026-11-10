import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Calendar, Clock } from 'lucide-react';
import { BLOGS, RECENT_BLOGS } from '../../data/blogs';

const EASE = [0.22, 1, 0.36, 1];

// Title underline that draws in on hover of its card (needs a `group` parent).
const DRAW = 'bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[length:0%_2px] bg-[position:0_100%] transition-[background-size] duration-500 ease-out group-hover:bg-[length:100%_2px]';

const Meta = ({ blog, light = false }) => (
  <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium ${light ? 'text-zinc-500' : 'text-zinc-500'}`}>
    <time dateTime={blog.date} className="inline-flex items-center gap-1.5"><Calendar size={13} className="text-zinc-400" />{blog.date}</time>
    {blog.readTime && <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-zinc-400" />{blog.readTime}</span>}
  </div>
);

// Small sidebar version used inside dashboards (unchanged layout).
const Compact = () => (
  <section aria-labelledby="recent-blogs-title">
    <div className="mb-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Career insights</p>
      <h2 id="recent-blogs-title" className="text-base font-bold text-slate-900">Latest from our blog</h2>
    </div>
    <div className="space-y-4">
      {RECENT_BLOGS.map((blog) => (
        <article key={blog.slug} className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow">
          <img src={blog.image} alt="" className="h-24 w-full object-cover" />
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">{blog.category} · {blog.readTime}</p>
            <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2">{blog.title}</h3>
            <Link to={`/blog/${blog.slug}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700">
              Read more <ArrowRight size={14} />
            </Link>
            <div className="mt-3 pt-3 flex items-center gap-2.5 border-t border-slate-100">
              <div className="h-8 w-8 text-[10px] flex shrink-0 items-center justify-center rounded-none bg-emerald-500 font-black text-white" aria-hidden="true">V</div>
              <div className="min-w-0">
                <p className="text-xs truncate font-bold text-slate-900">{blog.author || 'Velai Vaaipu'}</p>
                <time dateTime={blog.date} className="block text-[11px] text-slate-500">{blog.date}</time>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
    <Link to="/blog" className="mt-4 inline-flex text-xs font-bold text-emerald-600 hover:text-emerald-700">See all articles →</Link>
  </section>
);

// Magazine layout: one featured story with a revealing photo, and a reading list beside it.
const RecentBlogs = ({ compact = false }) => {
  if (compact) return <Compact />;
  const [featured, ...rest] = BLOGS.slice(0, 3);
  if (!featured) return null;

  return (
    <section className="relative py-24 bg-gradient-to-b from-white to-emerald-50/40" aria-labelledby="recent-blogs-title">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] mb-4 text-[#059669]">
              <span className="w-8 h-px bg-[#00D492]/50 shrink-0" /> Career insights
            </span>
            <h2 id="recent-blogs-title" className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight">Latest from our blog</h2>
            <p className="text-zinc-600 mt-3 font-medium text-sm md:text-base max-w-lg">Practical guides on finding work and hiring well in Tamil Nadu and Puducherry.</p>
          </div>
          <Link
            to="/blog"
            className="group inline-flex items-center gap-2 self-start sm:self-auto h-11 pl-5 pr-2 rounded-full border border-zinc-300 bg-white text-sm font-bold text-zinc-800 hover:border-[#059669] hover:text-[#059669] transition-colors"
          >
            Read all articles
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-[#059669] transition-all duration-300 group-hover:bg-[#059669] group-hover:text-white group-hover:rotate-45">
              <ArrowUpRight size={15} />
            </span>
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Featured */}
          <motion.article
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="group lg:col-span-7"
          >
            <Link to={`/blog/${featured.slug}`} className="block rounded-[24px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#059669]">
              <motion.div
                variants={{ hidden: { clipPath: 'inset(18% 0 0 0 round 24px)', opacity: 0.4 }, show: { clipPath: 'inset(0% 0 0 0 round 24px)', opacity: 1, transition: { duration: 0.9, ease: EASE } } }}
                className="relative aspect-[16/10] overflow-hidden rounded-[24px] bg-zinc-100"
              >
                <img src={featured.image} alt="" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                                <span className="absolute left-5 bottom-5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-bold text-[#047857] shadow-sm">{featured.category}</span>
                <span className="absolute right-5 bottom-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg transition-all duration-300 group-hover:bg-[#059669] group-hover:text-white group-hover:rotate-45">
                  <ArrowUpRight size={20} />
                </span>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: 0.25 } } }} className="pt-6">
                <Meta blog={featured} />
                <h3 className="mt-3 text-2xl md:text-[1.75rem] font-bold leading-tight tracking-tight text-zinc-900">
                  <span className={DRAW}>{featured.title}</span>
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-zinc-600 line-clamp-3 max-w-2xl">{featured.excerpt}</p>
              </motion.div>
            </Link>
          </motion.article>

          {/* Reading list */}
          <motion.ol
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } } }}
            className="lg:col-span-5 flex flex-col divide-y divide-zinc-200 border-t border-zinc-200 lg:border-t-0"
          >
            {rest.map((blog) => (
              <motion.li
                key={blog.slug}
                variants={{ hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } } }}
                className="first:lg:pt-0"
              >
                <Link to={`/blog/${blog.slug}`} className="group flex gap-5 py-6 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#059669]">
                  <div className="relative h-24 w-28 sm:h-28 sm:w-36 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
                    <img src={blog.image} alt="" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#059669]">{blog.category}</p>
                    <h3 className="mt-1.5 text-base sm:text-lg font-bold leading-snug text-zinc-900 line-clamp-3">
                      <span className={DRAW}>{blog.title}</span>
                    </h3>
                    <div className="mt-2"><Meta blog={blog} /></div>
                  </div>
                </Link>
              </motion.li>
            ))}
            <li className="pt-6">
              <Link to="/blog" className="group flex items-center justify-between rounded-2xl bg-emerald-50 px-6 py-5 ring-1 ring-emerald-100 transition-colors hover:bg-emerald-100/70">
                <span>
                  <span className="block text-base font-bold text-zinc-900">More guides on the blog</span>
                  <span className="block text-sm text-zinc-600">Interview prep, salaries, hiring and job safety</span>
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#059669] text-white transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight size={18} />
                </span>
              </Link>
            </li>
          </motion.ol>
        </div>
      </div>
    </section>
  );
};

export default RecentBlogs;
