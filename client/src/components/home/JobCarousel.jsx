import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, ArrowUpRight, MapPin, IndianRupee, Clock, Briefcase, Loader2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const formatSalary = (salary) => {
  if (!salary || salary.isRangeHidden) return 'Not Disclosed';
  if (salary.min && salary.max) return `₹${(salary.min / 100000).toFixed(1)}–${(salary.max / 100000).toFixed(1)} LPA`;
  if (salary.min) return `₹${(salary.min / 100000).toFixed(1)}+ LPA`;
  return 'Competitive';
};

const JobCarousel = ({
  jobs,
  loading,
  eyebrow = 'Fresh Listings',
  title = 'Recent Opportunities',
  subtitle = 'The latest roles posted on the platform.',
  badgeText = 'Just Posted',
  emptyText = 'No jobs posted yet — check back soon.',
  viewAllLink = '/jobs',
}) => {
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const activeIndex = jobs.length ? activeSlide % jobs.length : 0;

  useEffect(() => {
    if (paused || jobs.length <= 1) return;
    const id = setInterval(() => setActiveSlide(prev => (prev + 1) % jobs.length), 5000);
    return () => clearInterval(id);
  }, [paused, jobs.length]);

  const nextSlide = () => setActiveSlide(prev => (prev + 1) % jobs.length);
  const prevSlide = () => setActiveSlide(prev => (prev - 1 + jobs.length) % jobs.length);

  const activeJob = jobs[activeIndex];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-3">
              <span className="w-8 h-px bg-emerald-300" /> {eyebrow}
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{title}</h2>
            <p className="text-slate-500 mt-2 font-medium">{subtitle}</p>
          </div>
          <Link to={viewAllLink}>
            <Button variant="outline" className="h-11 px-7 rounded-xl border-slate-200 text-slate-700 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all shrink-0">
              View All <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-400 font-semibold text-sm">Loading opportunities...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <Briefcase className="w-10 h-10 text-slate-300 mb-4" />
            <p className="text-slate-400 font-semibold text-sm">{emptyText}</p>
          </div>
        ) : (
          <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <div className="relative min-h-[260px]">
              <AnimatePresence mode="wait">
                {activeJob && (
                  <motion.div
                    key={activeJob._id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    <Link
                      to={`/job/${activeJob._id}`}
                      className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-slate-950 rounded-3xl p-8 border-2 border-slate-950 hover:border-emerald-500 transition-all duration-300"
                    >
                      <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/5 overflow-hidden shrink-0">
                        {activeJob.company?.logo ? (
                          <img src={`${API_DOMAIN}${activeJob.company.logo}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-2xl">
                            {activeJob.company?.name?.[0] || 'J'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-none text-[10px] font-bold uppercase tracking-widest mb-3">
                          {badgeText}
                        </Badge>
                        <h3 className="font-bold text-white text-xl group-hover:text-emerald-400 transition-colors">{activeJob.title}</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1 mb-4">{activeJob.company?.name}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-white/10 text-slate-300 border-none text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-white/10">
                            <MapPin size={11} className="mr-1" />{activeJob.location || 'Remote'}
                          </Badge>
                          {activeJob.jobType && (
                            <Badge className="bg-white/10 text-slate-300 border-none text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-white/10">
                              {activeJob.jobType}
                            </Badge>
                          )}
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-none text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-emerald-500/15">
                            <IndianRupee size={11} className="mr-0.5" />{formatSalary(activeJob.salary)}
                          </Badge>
                          <Badge className="bg-white/10 text-slate-300 border-none text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-white/10">
                            <Clock size={11} className="mr-1" />{new Date(activeJob.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-all">
                        <ArrowUpRight size={18} />
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {jobs.length > 1 && (
              <div className="flex items-center justify-center gap-5 mt-8">
                <button
                  onClick={prevSlide}
                  aria-label="Previous job"
                  className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-2">
                  {jobs.map((j, i) => (
                    <button
                      key={j._id}
                      onClick={() => setActiveSlide(i)}
                      aria-label={`Go to job ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${i === activeIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200 hover:bg-slate-300'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={nextSlide}
                  aria-label="Next job"
                  className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default JobCarousel;
