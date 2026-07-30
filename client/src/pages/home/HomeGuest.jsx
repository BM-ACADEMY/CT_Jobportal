import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search, Briefcase, Building2, Users, Star, ArrowRight,
  MapPin, Code2, Stethoscope, BarChart2, Palette, ShoppingBag, GraduationCap,
  Cpu, HeartHandshake, Zap, Shield, Award, Sparkles, Flame, CheckCircle2,
} from 'lucide-react';

import ScrollProgressBar from '@/components/home/ScrollProgressBar';
import BackToTop from '@/components/home/BackToTop';
import Footer from '@/components/home/Footer';
import HeroShell from '@/components/home/HeroShell';
import StatBento from '@/components/home/StatBento';
import JobCarousel from '@/components/home/JobCarousel';
import TestimonialCarousel from '@/components/home/TestimonialCarousel';
import StepFlow from '@/components/home/StepFlow';
import ExplainerTabs from '@/components/home/ExplainerTabs';

const fallbackStats = [
  { label: 'Jobs Posted', value: '2L+', icon: Briefcase },
  { label: 'Companies', value: '10K+', icon: Building2, invert: true },
  { label: 'Job Seekers', value: '50L+', icon: Users },
  { label: 'Avg Rating', value: '4.8★', icon: Star },
];

const formatCount = (n) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr+`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
  return `${n}`;
};

const categories = [
  { label: 'IT & Software', count: '45K Jobs', icon: Code2, big: true },
  { label: 'Healthcare', count: '15K Jobs', icon: Stethoscope },
  { label: 'Finance', count: '18K Jobs', icon: BarChart2 },
  { label: 'Design', count: '9K Jobs', icon: Palette },
  { label: 'Sales', count: '22K Jobs', icon: ShoppingBag },
  { label: 'Engineering', count: '30K Jobs', icon: Cpu, wide: true },
  { label: 'Education', count: '8K Jobs', icon: GraduationCap },
  { label: 'Non-Profit', count: '5K Jobs', icon: HeartHandshake },
];

const howItWorks = [
  { step: '01', title: 'Create Your Profile', desc: 'Build your professional profile in minutes. Upload your resume and showcase your skills.', icon: Users },
  { step: '02', title: 'Explore Opportunities', desc: 'Browse thousands of curated jobs from top companies across India and abroad.', icon: Search },
  { step: '03', title: 'Apply & Get Hired', desc: 'Apply with one click and track your applications in real-time through your dashboard.', icon: CheckCircle2 },
];

const trendingSearches = [
  'Software Engineer', 'Product Manager', 'Data Analyst', 'UI/UX Designer',
  'Sales Executive', 'HR Manager', 'Digital Marketing', 'DevOps Engineer',
  'Business Analyst', 'Content Writer',
];

const fallbackCompanies = [
  'Tata Consultancy', 'Infosys', 'Wipro', 'HCL Technologies', 'Accenture',
  'Reliance Industries', 'Flipkart', 'Zomato', 'Swiggy', 'Byju\'s',
];

const HomeGuest = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    axios.get(`${API_BASE_URL}/jobs`)
      .then(res => setJobs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    axios.get(`${API_BASE_URL}/public/stats`)
      .then(res => setPlatformStats(res.data))
      .catch(() => {});
  }, [API_BASE_URL]);

  const handleSearch = (e) => {
    e?.preventDefault();
    navigate(`/jobs?q=${searchQuery}&loc=${locationQuery}`);
  };

  const companyStrip = useMemo(() => {
    const names = [...new Set(jobs.map(j => j.company?.name).filter(Boolean))];
    return names.length >= 6 ? names : fallbackCompanies;
  }, [jobs]);

  const recentJobs = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3),
    [jobs]
  );

  const useFallbackStats = !platformStats || (
    platformStats.activeJobsCount < 1000 &&
    platformStats.companiesCount < 1000 &&
    platformStats.jobseekersCount < 1000
  );

  const statCards = useFallbackStats ? fallbackStats : [
    { label: 'Active Jobs', value: formatCount(platformStats.activeJobsCount), icon: Briefcase },
    { label: 'Companies', value: formatCount(platformStats.companiesCount), icon: Building2, invert: true },
    { label: 'Job Seekers', value: formatCount(platformStats.jobseekersCount), icon: Users },
    {
      label: platformStats.reviewsCount ? 'Avg Rating' : 'Reviews',
      value: platformStats.reviewsCount ? `${platformStats.avgRating.toFixed(1)}★` : '0',
      icon: Star,
    },
  ];

  const heroRatingValue = (!useFallbackStats && platformStats.reviewsCount > 0)
    ? platformStats.avgRating.toFixed(1)
    : '4.8';
  const heroJobsLabel = useFallbackStats ? '10K+' : formatCount(platformStats.activeJobsCount);
  const heroCompaniesLabel = useFallbackStats ? '10K+' : formatCount(platformStats.companiesCount);

  const heroBadgeText = platformStats?.jobsPostedToday > 0
    ? `${platformStats.jobsPostedToday} new jobs posted today`
    : platformStats?.newJobsThisWeek > 0
      ? `${platformStats.newJobsThisWeek} new jobs this week`
      : 'New jobs added regularly';

  const liveTickerText = platformStats?.applicationsToday > 0
    ? <><span className="text-white font-bold">{platformStats.applicationsToday}</span> applications submitted today</>
    : platformStats?.jobsPostedToday > 0
      ? <><span className="text-white font-bold">{platformStats.jobsPostedToday} new jobs</span> posted today</>
      : <>New opportunities added <span className="text-white font-bold">every day</span></>;

  return (
    <div className="w-full overflow-x-hidden bg-white">
      <ScrollProgressBar />

      <HeroShell>
        {({ tiltX, tiltY }) => (
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">{heroBadgeText}</span>
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-[5.2rem] font-black text-white leading-[0.98] mb-8 tracking-tighter">
                Find Your{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                    Dream Job
                  </span>
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full" />
                </span>
                <br />in India's Top Companies
              </h1>

              <p className="text-slate-400 text-lg md:text-xl font-normal mb-10 max-w-xl leading-relaxed">
                Connect with world-class employers. Discover opportunities that match your skills, location, and career aspirations.
              </p>

              <form onSubmit={handleSearch} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col md:flex-row gap-2 mb-10 shadow-2xl shadow-black/30">
                <div className="flex items-center gap-3 flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/5">
                  <Search size={20} className="text-emerald-400 shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Job title or keywords..."
                    className="flex-1 bg-transparent outline-none text-white font-medium placeholder:text-slate-500 text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/5">
                  <MapPin size={20} className="text-slate-500 shrink-0" />
                  <input
                    value={locationQuery}
                    onChange={e => setLocationQuery(e.target.value)}
                    placeholder="City or Remote..."
                    className="flex-1 bg-transparent outline-none text-white font-medium placeholder:text-slate-500 text-sm"
                  />
                </div>
                <Button type="submit" className="h-12 rounded-xl px-8 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/25 transition-all shrink-0">
                  Search Jobs
                </Button>
              </form>

              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex -space-x-2.5">
                  {[11, 12, 13, 14].map(i => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-slate-900 bg-slate-700 overflow-hidden ring-1 ring-white/10">
                      <img src={`https://i.pravatar.cc/100?img=${i}`} alt="" />
                    </div>
                  ))}
                  <div className="w-9 h-9 rounded-full border-2 border-slate-900 bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-slate-900 ring-1 ring-white/10">+10k</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <p className="text-white font-bold text-lg leading-none">{heroRatingValue} / 5</p>
                  <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest mt-0.5">Candidate Rating</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <p className="text-white font-bold text-lg leading-none">{heroCompaniesLabel}</p>
                  <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest mt-0.5">Companies Hiring</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className="lg:col-span-5 hidden lg:grid grid-cols-2 grid-rows-[1fr_1fr_auto] gap-4 h-[480px]"
            >
              <motion.div
                style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1200 }}
                className="row-span-2 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 relative"
              >
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"
                  alt="Professional"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#f59e0b" className="text-amber-400" />)}
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xl shadow-black/20 flex flex-col justify-center"
              >
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white mb-3"><Star size={18} /></div>
                <p className="text-2xl font-black text-slate-900 leading-none">{heroRatingValue}★</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-1.5">Avg Rating</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="bg-slate-900 rounded-2xl p-5 border border-white/10 shadow-xl shadow-black/30 flex flex-col justify-center"
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 mb-3"><Briefcase size={18} /></div>
                <p className="text-2xl font-black text-white leading-none">{heroJobsLabel}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-1.5">Live Job Openings</p>
              </motion.div>

              <div className="col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                <p className="text-slate-300 text-sm font-semibold flex-1">{liveTickerText}</p>
                <Zap size={16} className="text-emerald-400 shrink-0" />
              </div>
            </motion.div>
          </div>
        )}
      </HeroShell>

      <ExplainerTabs />

      {/* Trending marquee */}
      <section className="relative overflow-hidden py-5 bg-white border-b border-slate-100 -mt-px">
        <div className="flex items-center gap-2 px-6 mb-3 max-w-6xl mx-auto">
          <Flame size={14} className="text-emerald-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trending Searches</span>
        </div>
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <motion.div className="flex gap-3 w-max px-6" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
            {[...trendingSearches, ...trendingSearches].map((term, i) => (
              <Link key={i} to={`/jobs?q=${encodeURIComponent(term)}`} className="shrink-0 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-600 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                {term}
              </Link>
            ))}
          </motion.div>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <motion.div className="flex gap-3 w-max px-6" animate={{ x: ['-50%', '0%'] }} transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}>
            {[...companyStrip, ...companyStrip].map((name, i) => (
              <span key={i} className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold text-slate-400 uppercase tracking-wider border border-transparent">{name}</span>
            ))}
          </motion.div>
        </div>
      </section>

      <StatBento cards={statCards} />

      <StepFlow title="Get Hired in 3 Simple Steps" steps={howItWorks} />

      {/* Free Assessment CTA */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 bg-white border-2 border-slate-900 rounded-3xl p-10 md:p-16">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-slate-950 text-emerald-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles size={14} /> AI-Powered
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-4">Test Your Skills for Free</h2>
              <p className="text-slate-500 text-lg max-w-xl mb-8 leading-relaxed">
                Take a quick skill assessment and prove your expertise. Earn verified badges to make your profile stand out to recruiters instantly!
              </p>
              <Link to="/free-assessment">
                <Button className="h-14 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 transition-transform hover:scale-105">
                  Take Free Assessment <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
            <div className="flex-1 w-full flex justify-center relative">
              <div className="relative bg-white p-6 rounded-2xl border-2 border-slate-200 w-full max-w-sm transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-950 text-emerald-400 rounded-lg flex items-center justify-center">
                      <Code2 size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">React.js</p>
                      <p className="text-xs font-semibold text-slate-400">Medium Difficulty</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">Passed</Badge>
                </div>
                <div className="space-y-3">
                  <div className="h-2.5 bg-slate-100 rounded-full w-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '85%' }} viewport={{ once: true }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-emerald-500 rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Score: 85%</span>
                    <span className="text-emerald-600">Top 15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <JobCarousel jobs={recentJobs} loading={loading} />

      {/* Categories bento */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-4">
              <span className="w-8 h-px bg-emerald-300" /> Browse by Domain <span className="w-8 h-px bg-emerald-300" />
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Explore Job Categories</h2>
            <p className="text-slate-500 mt-3 font-medium">Find opportunities across diverse industries and domains.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[150px] gap-5">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`${cat.big ? 'col-span-2 row-span-2' : cat.wide ? 'col-span-2' : 'col-span-1'}`}
              >
                <Link
                  to={`/jobs?category=${cat.label}`}
                  className={`flex flex-col justify-between h-full p-6 rounded-2xl border-2 cursor-pointer group transition-all duration-300 hover:-translate-y-1 ${cat.big ? 'bg-slate-950 border-slate-950 hover:border-emerald-500' : 'bg-white border-slate-200 hover:border-slate-900'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${cat.big ? 'w-14 h-14 bg-emerald-500 text-slate-900' : 'w-12 h-12 bg-slate-950 text-emerald-400'}`}>
                      <cat.icon size={cat.big ? 26 : 20} />
                    </div>
                    {cat.big && <Flame size={16} className="text-emerald-400" />}
                  </div>
                  <div>
                    <h3 className={`font-bold mb-1 ${cat.big ? 'text-2xl text-white' : 'text-base text-slate-900'}`}>{cat.label}</h3>
                    <p className={`text-[11px] font-semibold uppercase tracking-wider ${cat.big ? 'text-emerald-400' : 'text-slate-400'}`}>{cat.count}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialCarousel subtitle="Join our growing community of professionals who found their career path through us." />

      {/* Recruiter CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl overflow-hidden p-12 md:p-20 text-center shadow-2xl shadow-emerald-500/20"
          >
            <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-[60px] -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-black/10 rounded-full blur-[60px] -ml-16 -mb-16" />
            <div className="relative z-10">
              <Badge className="bg-white/20 text-white border-white/30 text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 mb-8 rounded-full">
                For Recruiters & Companies
              </Badge>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tighter">Ready to Hire India's Best Talent?</h2>
              <p className="text-emerald-50 text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                Post a job in minutes and reach millions of qualified candidates. Leverage our AI-powered matching to find the perfect fit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button className="h-14 px-12 rounded-2xl bg-white text-emerald-700 hover:bg-white/90 font-bold text-base shadow-xl shadow-black/10 transition-all hover:scale-105">
                    Post a Job Free
                  </Button>
                </Link>
                <Link to="/company-login">
                  <Button variant="outline" className="h-14 px-12 rounded-2xl bg-transparent border-white/30 text-white hover:bg-white/10 font-bold text-base">
                    Company Login
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-white/20">
                {[{ icon: Zap, text: 'Post in 5 minutes' }, { icon: Shield, text: 'Verified candidates' }, { icon: Award, text: 'Top employer badge' }].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/80">
                    <item.icon size={16} />
                    <span className="text-sm font-semibold">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default HomeGuest;
