import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const defaultTestimonials = [
  { user: { name: 'Priya Sharma', role: { name: 'jobseeker' } }, comment: 'Found my dream job in just 2 weeks. The AI-powered recommendations were incredibly accurate for my skill set!', rating: 5, avatar: 'PS' },
  { user: { name: 'Rahul Mehta', role: { name: 'recruiter' } }, comment: 'The platform\'s reach is unmatched. I received 20+ interview calls within days of uploading my resume.', rating: 5, avatar: 'RM' },
  { user: { name: 'Sneha Patel', role: { name: 'jobseeker' } }, comment: 'Super easy to use. The detailed job filters helped me find exactly what I was looking for in just days.', rating: 5, avatar: 'SP' },
];

// roleFilter: 'jobseeker' | 'recruiter' | 'company' | 'college' | null.
// Falls back to the unfiltered list when fewer than 3 reviews match the filter.
const TestimonialCarousel = ({
  roleFilter = null,
  eyebrow = 'Real Stories',
  title = 'Success Stories',
  subtitle = 'Join thousands of professionals who found their path through us.',
}) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
  const [reviews, setReviews] = useState(defaultTestimonials);
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/reviews/approved`)
      .then(res => {
        if (res.data && res.data.length > 0) setReviews(res.data);
      })
      .catch(() => {});
  }, [API_BASE_URL]);

  const filtered = roleFilter
    ? reviews.filter(r => r.user?.role?.name === roleFilter)
    : reviews;
  const list = (filtered.length >= 3 ? filtered : reviews).slice(0, 6);

  const activeIndex = list.length ? activeSlide % list.length : 0;

  useEffect(() => {
    if (paused || list.length <= 1) return;
    const id = setInterval(() => setActiveSlide(prev => (prev + 1) % list.length), 5000);
    return () => clearInterval(id);
  }, [paused, list.length]);

  const next = () => setActiveSlide(prev => (prev + 1) % list.length);
  const prev = () => setActiveSlide(prev => (prev - 1 + list.length) % list.length);
  const active = list[activeIndex];

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <span className="w-8 h-px bg-emerald-500/40" /> {eyebrow} <span className="w-8 h-px bg-emerald-500/40" />
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">{title}</h2>
          <p className="text-slate-400 mt-3 font-medium">{subtitle}</p>
        </div>
        <div
          className="max-w-3xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative min-h-[300px] md:min-h-[260px]">
            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10"
                >
                  <Quote size={32} className="text-emerald-400/30 mb-4" />
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14} className={j < (active.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'} />
                    ))}
                  </div>
                  <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-8 font-medium">"{active.comment}"</p>
                  <div className="flex items-center gap-4 pt-5 border-t border-white/10">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-900 font-bold text-sm shrink-0 overflow-hidden">
                      {active.user?.avatar ? (
                        <img src={active.user.avatar.startsWith('http') ? active.user.avatar : `${API_DOMAIN}${active.user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <img src={`https://ui-avatars.com/api/?name=${active.user?.name}&background=0D8ABC&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{active.user?.name}</p>
                      <p className="text-emerald-400 text-[11px] font-semibold mt-0.5 capitalize">{active.user?.role?.name || 'User'}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {list.length > 1 && (
            <div className="flex items-center justify-center gap-5 mt-8">
              <button
                onClick={prev}
                aria-label="Previous testimonial"
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-2">
                {list.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                      i === activeIndex ? 'border-emerald-400 scale-110' : 'border-white/10 opacity-50 hover:opacity-80'
                    }`}
                  >
                    {t.user?.avatar ? (
                      <img src={t.user.avatar.startsWith('http') ? t.user.avatar : `${API_DOMAIN}${t.user.avatar}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img src={`https://ui-avatars.com/api/?name=${t.user?.name}&background=0D8ABC&color=fff`} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={next}
                aria-label="Next testimonial"
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialCarousel;
