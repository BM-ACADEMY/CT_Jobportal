import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Search, Clock, X } from 'lucide-react';
import { BLOGS } from '../data/blogs';
import SEOHead from '../components/seo/SEOHead';
import { useAdminBlogCards } from '../data/useBlogPosts';
import WaveLines from '@/components/common/WaveLines';
import Footer from '@/components/home/Footer';

const EASE = [0.22, 1, 0.36, 1];
const ALL = 'All';

const Meta = ({ blog, light = false }) => (
  <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold m-0 ${light ? 'text-white/80' : 'text-zinc-500'}`}>
    <span className={light ? 'text-white' : 'text-[#34B678]'}>{blog.category}</span>
    <span aria-hidden="true">·</span>
    <span className="inline-flex items-center gap-1"><Clock size={12} /> {blog.readTime}</span>
  </p>
);

const Byline = ({ blog }) => (
  <div className="flex items-center gap-3">
    <span className="w-9 h-9 shrink-0 rounded-full bg-[#34B678] text-white text-sm font-bold flex items-center justify-center" aria-hidden="true">V</span>
    <span className="min-w-0">
      <span className="block truncate text-sm font-bold text-[#10213D]">{blog.author || 'Velai Vaaipu'}</span>
      <time dateTime={blog.date} className="block text-xs text-zinc-500">{blog.date}</time>
    </span>
  </div>
);

// Newest post, shown wide above the grid when no filter or search is active.
const FeaturedPost = ({ blog }) => (
  <Link
    to={`/blog/${blog.slug}`}
    className="group grid lg:grid-cols-2 rounded-[2rem] overflow-hidden bg-white ring-1 ring-zinc-200 shadow-[0_30px_70px_-40px_rgba(16,33,61,0.45)] transition hover:ring-[#34B678]/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#34B678]/30"
  >
    <div className="relative overflow-hidden aspect-[16/10] lg:aspect-auto lg:min-h-[380px]">
      <img src={blog.image} alt={blog.imageAlt || ''} decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      <span className="absolute left-5 top-5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-[#10213D] shadow-sm">Latest</span>
    </div>
    <div className="flex flex-col p-7 md:p-10">
      <Meta blog={blog} />
      <h2 className="mt-4 text-2xl md:text-4xl font-bold tracking-tight leading-tight text-[#10213D] group-hover:text-[#1f8a57] transition-colors">{blog.title}</h2>
      <p className="mt-4 text-zinc-600 leading-relaxed line-clamp-4">{blog.excerpt}</p>
      <div className="mt-auto pt-8 flex items-center justify-between gap-4">
        <Byline blog={blog} />
        <span className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#34B678] text-white text-sm font-bold shadow-lg shadow-[#34B678]/25 transition group-hover:bg-[#2ca66b]">
          Read article <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  </Link>
);

const PostCard = ({ blog }) => (
  <Link
    to={`/blog/${blog.slug}`}
    className="group flex flex-col h-full rounded-[1.75rem] bg-white p-2 ring-1 ring-zinc-200 shadow-[0_20px_50px_-36px_rgba(16,33,61,0.4)] transition duration-300 hover:-translate-y-1 hover:ring-[#34B678]/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#34B678]/30"
  >
    <div className="relative overflow-hidden rounded-[1.35rem] aspect-[16/10]">
      <img src={blog.image} alt={blog.imageAlt || ''} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
      <span className="absolute right-3 top-3 w-9 h-9 rounded-full bg-white/95 text-[#10213D] flex items-center justify-center opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0">
        <ArrowUpRight size={16} />
      </span>
    </div>
    <div className="flex flex-1 flex-col px-4 pt-5 pb-4">
      <Meta blog={blog} />
      <h3 className="mt-3 text-lg font-bold leading-snug text-[#10213D] line-clamp-3 group-hover:text-[#1f8a57] transition-colors">{blog.title}</h3>
      <p className="mt-2 text-sm text-zinc-600 leading-relaxed line-clamp-3">{blog.excerpt}</p>
      <div className="mt-auto pt-5 border-t border-zinc-100 mt-5">
        <Byline blog={blog} />
      </div>
    </div>
  </Link>
);

const Blog = () => {
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState('');
  // Posts written in Admin come first; the older code-based posts follow. Both use the same cards.
  const newPosts = useAdminBlogCards();
  const allPosts = useMemo(() => [...newPosts, ...BLOGS.filter((b) => !newPosts.some((n) => n.slug === b.slug))], [newPosts]);
  const CATEGORIES = useMemo(() => [ALL, ...new Set(allPosts.map((b) => b.category).filter(Boolean))], [allPosts]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => allPosts.filter((b) =>
      (category === ALL || b.category === category) &&
      (!q || `${b.title} ${b.excerpt || ''} ${b.category}`.toLowerCase().includes(q))
    ),
    [allPosts, category, q]
  );

  const browsing = category === ALL && !q;
  const featured = browsing ? filtered[0] : null;
  const rest = browsing ? filtered.slice(1) : filtered;

  return (
    <div className="bg-white min-h-screen overflow-x-clip">
      <SEOHead title="Job search and hiring advice, Tamil Nadu | Velaivaaipu Blog" description="Clear advice on finding work, spotting fake job offers, growing your skills and hiring in Puducherry and Tamil Nadu." path="/blog" />
      {/* Intro */}
      <header className="relative overflow-hidden bg-[#f4faf7] border-b border-emerald-100 px-6 pt-20 md:pt-24 pb-14 md:pb-16">
        <WaveLines id="blog-hero-waves" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative max-w-6xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#34B678] mb-4">
            <span className="w-8 h-px bg-[#34B678]/50" /> Velaivaaipu blog
          </span>
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-[#10213D]">
                Ideas for your <span className="text-[#34B678]">next career move.</span>
              </h1>
              <p className="mt-5 text-zinc-600 text-base md:text-lg leading-relaxed max-w-xl">
                Clear, useful advice for finding work, growing your skills and hiring good people in Tamil Nadu and Puducherry.
              </p>
            </div>
            <div className="lg:col-span-5">
              <label htmlFor="blog-search" className="sr-only">Search articles</label>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  id="blog-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search articles…"
                  className="w-full h-14 pl-11 pr-11 rounded-2xl bg-white text-zinc-900 text-sm font-medium ring-1 ring-zinc-200 shadow-[0_16px_40px_-28px_rgba(16,33,61,0.5)] outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#34B678] [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 border-none bg-transparent cursor-pointer">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Category filter */}
      <nav aria-label="Filter by category" className="sticky top-20 z-20 bg-white/90 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={`shrink-0 h-10 px-4 rounded-xl text-sm font-semibold border cursor-pointer transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#34B678]/25 ${
                  active ? 'bg-[#10213D] border-[#10213D] text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:border-[#34B678]/60 hover:text-[#10213D]'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        {!browsing && (
          <p className="text-sm text-zinc-500 mb-8 m-0" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
            {category !== ALL && <> in <span className="font-semibold text-[#10213D]">{category}</span></>}
            {q && <> matching “<span className="font-semibold text-[#10213D]">{query.trim()}</span>”</>}
          </p>
        )}

        {featured && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="mb-14">
            <FeaturedPost blog={featured} />
          </motion.div>
        )}

        {rest.length > 0 && (
          <>
            {browsing && <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#10213D] mb-8">More articles</h2>}
            <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {rest.map((blog) => (
                  <motion.div
                    key={blog.slug}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="h-full"
                  >
                    <PostCard blog={blog} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-[1.75rem] bg-[#f4faf7] ring-1 ring-emerald-100">
            <span className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white text-[#34B678] flex items-center justify-center shadow-sm"><Search size={22} /></span>
            <p className="text-[#10213D] text-lg font-bold m-0">No articles found.</p>
            <p className="text-zinc-600 text-sm mt-2 m-0">Try a different word or category.</p>
            <button
              type="button"
              onClick={() => { setQuery(''); setCategory(ALL); }}
              className="mt-6 h-11 px-6 rounded-xl bg-[#10213D] hover:bg-[#0b1830] text-white text-sm font-bold border-none cursor-pointer"
            >
              Show all articles
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
