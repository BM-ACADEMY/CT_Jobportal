import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  GraduationCap, Users, Building2, Briefcase, ArrowRight,
  UserPlus, CalendarCheck, TrendingUp, Video, HeartHandshake, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import ScrollProgressBar from '@/components/home/ScrollProgressBar';
import BackToTop from '@/components/home/BackToTop';
import Footer from '@/components/home/Footer';
import HeroShell from '@/components/home/HeroShell';
import StatBento from '@/components/home/StatBento';
import PlacementHighlights from '@/components/home/PlacementHighlights';
import CollegeList from '@/components/home/CollegeList';
import PayPerCarousel from '@/components/home/PayPerCarousel';
import TestimonialCarousel from '@/components/home/TestimonialCarousel';

const formatCount = (n) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr+`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
  return `${n}`;
};

const features = [
  { icon: UserPlus, title: 'Bulk Student Onboarding', desc: 'Import your entire batch in one go, department-wise.' },
  { icon: CalendarCheck, title: 'End-to-End Drive Management', desc: 'Invite companies, run rounds, and track every stage.' },
  { icon: TrendingUp, title: 'Real-Time Placement Reports', desc: 'Share live placement stats with your management.' },
];

const supportFeatures = [
  { icon: Video, title: 'Career Webinars', desc: 'Bring industry experts to your students with career-readiness sessions.' },
  { icon: HeartHandshake, title: 'Placement Support', desc: 'Dedicated help getting your drives set up and companies onboarded.' },
];

const HomeCollege = () => {
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [platformStats, setPlatformStats] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/public/stats`).then(res => setPlatformStats(res.data)).catch(() => {});
  }, [API_BASE_URL]);

  const useFallback = !platformStats || (platformStats.collegesOnboardedCount < 1000 && platformStats.companiesCount < 1000);
  const statCards = useFallback ? [
    { label: 'Colleges Onboard', value: '500+', icon: GraduationCap, invert: true },
    { label: 'Students Placed', value: '10K+', icon: Users },
    { label: 'Hiring Companies', value: '10K+', icon: Building2 },
    { label: 'Active Jobs', value: '2L+', icon: Briefcase },
  ] : [
    { label: 'Colleges Onboard', value: formatCount(platformStats.collegesOnboardedCount), icon: GraduationCap, invert: true },
    { label: 'Students Placed', value: formatCount(platformStats.studentsPlacedCount), icon: Users },
    { label: 'Hiring Companies', value: formatCount(platformStats.companiesCount), icon: Building2 },
    { label: 'Active Jobs', value: formatCount(platformStats.activeJobsCount), icon: Briefcase },
  ];

  return (
    <div className="w-full overflow-x-hidden bg-white">

      <HeroShell>
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-8">
              <ShieldCheck size={14} className="text-[#00D492]" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#00D492]">For Colleges & TPOs</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[4.2rem] font-bold text-zinc-900 tracking-tight leading-[1.12] mb-8">
              Empower Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D492] to-emerald-400">Campus Placements</span>
            </h1>
            <p className="text-zinc-500 text-sm md:text-base font-normal mb-10 max-w-md leading-relaxed">
              Run placement drives, manage students, and connect with hiring companies — all from one dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/college/drives">
                <Button className="h-14 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-base shadow-lg shadow-emerald-500/25 transition-all hover:scale-105">
                  Manage Drives <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <Link to="/college/dashboard">
                <Button variant="outline" className="h-14 px-10 rounded-2xl bg-transparent border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-bold text-base">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="lg:col-span-6 block relative mt-16 lg:mt-0"
          >
            <div className="relative z-10 w-full max-w-[340px] md:max-w-[380px] mx-auto ml-auto lg:mr-8">
              <img
                loading="eager"
                decoding="async"
                src="images/homepage.png"
                alt="Empower Campus Placements"
                className="w-full h-auto object-cover"
              />

              {features.map((f, i) => {
                let posClasses = '';
                // Using exact arbitrary values so Tailwind respects them without relying on standard spacing
                if (i === 0) posClasses = '-left-[20px] md:-left-[50px] lg:-left-[140px] top-[20px] md:top-[40px]';
                else if (i === 1) posClasses = '-right-[20px] md:-right-[150px] lg:-right-[140px] top-1/2 -translate-y-1/2';
                else if (i === 2) posClasses = '-right-[10px] md:-right-[100px] lg:-right-[60px] bottom-[20px] md:bottom-[40px]';

                return (
                  <motion.div
                    key={f.title}
                    animate={{ y: [0, i % 2 ? 8 : -8, 0] }}
                    transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
                    className={`absolute z-20 bg-white/95 backdrop-blur-xl border border-white shadow-xl shadow-indigo-900/10 rounded-2xl p-2.5 md:p-3 flex items-center gap-3 w-[210px] md:w-[250px] ${posClasses}`}
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-500 text-slate-900 flex items-center justify-center shrink-0">
                      <f.icon size={16} className="md:w-[18px] md:h-[18px]" />
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold text-[11px] md:text-xs leading-tight">{f.title}</p>
                      <p className="text-slate-600 text-[9px] md:text-[10px] leading-tight mt-0.5 line-clamp-2">{f.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </HeroShell>

      <StatBento cards={statCards} />

      <TestimonialCarousel roleFilter="college" eyebrow="From TPOs Like You" title="What Colleges Say" subtitle="Institutions running their placements with us." />

      <CollegeList />

      {(user?.role === 'college') && (
        <PayPerCarousel role="college" title="Pay Only For What Your Campus Needs" subtitle="Drive management, bulk exports, verified badges, and more." />
      )}

      {/* Webinars & Placement Support — qualitative, no invented stats */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-[0.25em] mb-4">
              <span className="w-8 h-px bg-emerald-500/40" /> Beyond The Platform <span className="w-8 h-px bg-emerald-500/40" />
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">We Support Your Students, Too</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {supportFeatures.map((f) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-900 flex items-center justify-center mb-5"><f.icon size={22} /></div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PlacementHighlights />

      <Footer />
      <BackToTop />
    </div>
  );
};

export default HomeCollege;
