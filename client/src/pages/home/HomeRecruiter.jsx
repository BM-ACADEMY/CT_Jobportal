import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Briefcase, Users, Building2, Sparkles, ArrowRight, Zap, Shield, Award,
  FileEdit, UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import ScrollProgressBar from '@/components/home/ScrollProgressBar';
import BackToTop from '@/components/home/BackToTop';
import Footer from '@/components/home/Footer';
import HeroShell from '@/components/home/HeroShell';
import StatBento from '@/components/home/StatBento';
import StepFlow from '@/components/home/StepFlow';
import TestimonialCarousel from '@/components/home/TestimonialCarousel';
import PlacementHighlights from '@/components/home/PlacementHighlights';
import PayPerCarousel from '@/components/home/PayPerCarousel';

const formatCount = (n) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr+`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
  return `${n}`;
};

const steps = [
  { step: '01', title: 'Set Up Your Company', desc: 'Build a branded profile candidates trust at a glance.', icon: Building2 },
  { step: '02', title: 'Post Jobs', desc: 'Publish a role in minutes and reach active candidates.', icon: FileEdit },
  { step: '03', title: 'Access Candidates', desc: 'Review AI-ranked applicants and move fast on hires.', icon: UserCheck },
];

const HomeRecruiter = () => {
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
  const [platformStats, setPlatformStats] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/public/stats`).then(res => setPlatformStats(res.data)).catch(() => {});
    axios.get(`${API_BASE_URL}/jobs`).then(res => setJobs(res.data || [])).catch(() => {});
  }, [API_BASE_URL]);

  const recentCompanies = useMemo(() => {
    const sortedJobs = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const unique = [];
    const seen = new Set();
    for (const job of sortedJobs) {
      if (job.company && !seen.has(job.company._id)) {
        seen.add(job.company._id);
        unique.push(job.company);
        if (unique.length === 15) break;
      }
    }
    return unique;
  }, [jobs]);

  const useFallback = !platformStats || (platformStats.jobseekersCount < 1000 && platformStats.activeJobsCount < 1000);
  const statCards = useFallback ? [
    { label: 'Job Seekers', value: '50L+', icon: Users, invert: true },
    { label: 'Active Jobs', value: '2L+', icon: Briefcase },
    { label: 'Companies Hiring', value: '10K+', icon: Building2 },
    { label: 'New Jobs This Week', value: '5K+', icon: Sparkles },
  ] : [
    { label: 'Job Seekers', value: formatCount(platformStats.jobseekersCount), icon: Users, invert: true },
    { label: 'Active Jobs', value: formatCount(platformStats.activeJobsCount), icon: Briefcase },
    { label: 'Companies Hiring', value: formatCount(platformStats.companiesCount), icon: Building2 },
    { label: 'New Jobs This Week', value: formatCount(platformStats.newJobsThisWeek), icon: Sparkles },
  ];

  return (
    <div className="w-full overflow-x-hidden bg-white">
      <ScrollProgressBar />

      <HeroShell>
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">For Recruiters & Companies</span>
            </div>
            <h1 className="text-5xl lg:text-6xl xl:text-[4.8rem] font-black text-white leading-[0.98] mb-8 tracking-tighter">
              Hire India's{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Best Talent</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-normal mb-10 max-w-xl leading-relaxed">
              Post a job in minutes and reach millions of qualified candidates with AI-powered matching.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/company/jobs/new">
                <Button className="h-14 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-base shadow-lg shadow-emerald-500/25 transition-all hover:scale-105">
                  Post a Job <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <Link to="/company/dashboard">
                <Button variant="outline" className="h-14 px-10 rounded-2xl bg-transparent border-white/30 text-white hover:bg-white/10 font-bold text-base">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="lg:col-span-5 flex flex-col gap-4 mt-10 lg:mt-0"
          >
            {[
              { icon: Zap, text: 'Post in 5 minutes', color: 'bg-emerald-500 text-slate-900' },
              { icon: Shield, text: 'Verified candidates', color: 'bg-white/10 text-emerald-400' },
              { icon: Award, text: 'Top employer badge', color: 'bg-white/10 text-emerald-400' },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, delay: i * 0.8, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-5 flex items-center gap-4"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}><item.icon size={20} /></div>
                <span className="text-white font-bold">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </HeroShell>

      <StatBento cards={statCards} />

      {/* Recent postings + "post yours too" */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-4">
              <span className="w-8 h-px bg-emerald-300" /> Companies Are Hiring <span className="w-8 h-px bg-emerald-300" />
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">See Who's Posting Right Now</h2>
          </div>

          {recentCompanies.length > 0 && (
            <div className="relative mb-10 overflow-hidden rounded-xl">
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
              <motion.div className="flex gap-4 w-max px-4" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
                {[...recentCompanies, ...recentCompanies].map((company, i) => (
                  <div
                    key={`${company._id}-${i}`}
                    className="shrink-0 flex items-center gap-3 bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 overflow-hidden flex items-center justify-center shrink-0 font-bold text-sm">
                      {company.logo ? <img src={`${API_DOMAIN}${company.logo}`} alt="" className="w-full h-full object-cover" /> : (company.name?.[0] || 'C')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none">{company.name}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-950 rounded-3xl p-10 md:p-12"
          >
            <div>
              <p className="text-white text-xl md:text-2xl font-bold leading-snug max-w-lg">
                "Every great hire starts with a job post." Yours could be the next one candidates see.
              </p>
            </div>
            <Link to="/company/jobs/new">
              <Button className="h-14 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold shrink-0">
                Post Your Job <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <StepFlow eyebrow="Get Started" title="Get Access in 3 Simple Steps" steps={steps} />

      <TestimonialCarousel roleFilter="jobseeker" eyebrow="Candidates Love Us" title="Why Candidates Choose Us" subtitle="The talent pool you'll be hiring from." />
      <PlacementHighlights />

      {(user?.role === 'recruiter' || user?.role === 'company') && (
        <PayPerCarousel role={user.role} title="Scale Up With Pay-Per-Use Add-Ons" subtitle="Unlock extra job slots, candidate search, and more — only pay for what you use." />
      )}

      <Footer />
      <BackToTop />
    </div>
  );
};

export default HomeRecruiter;
