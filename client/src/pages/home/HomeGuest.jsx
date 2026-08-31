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
      .catch(() => { })
      .finally(() => setLoading(false));

    axios.get(`${API_BASE_URL}/public/stats`)
      .then(res => setPlatformStats(res.data))
      .catch(() => { });
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

      <HeroShell>
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Live Jobs Stat Badge */}
            <p className="text-sm font-semibold text-[#00D492] tracking-wide">
              New jobs added regularly
            </p>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-[4.2rem] font-bold text-zinc-900 tracking-tight leading-[1.12]">
              Your <span className="text-[#34b678]">Dream</span> Job Is<br />
              Waiting For You
            </h1>

            {/* Mini Instruction */}
            <p className="text-zinc-500 text-sm font-normal max-w-md leading-relaxed">
              Connect with world-class employers. Discover opportunities that match your skills, location, and career aspirations.
            </p>

            {/* Custom rounded search card */}
            <form onSubmit={handleSearch} className="bg-white border border-zinc-100 rounded-2xl p-2 flex flex-col md:flex-row gap-2 max-w-3xl shadow-xl shadow-[#00D492]/10">
              <div className="flex items-center gap-3 flex-1 px-4 py-3">
                <Search size={18} className="text-[#00D492] shrink-0" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Job Title, Keywords"
                  className="flex-1 bg-transparent outline-none text-zinc-800 font-medium placeholder:text-zinc-400 text-sm"
                />
              </div>

              <div className="w-px bg-zinc-200 hidden md:block my-2" />

              <div className="flex items-center gap-3 flex-1 px-4 py-3">
                <MapPin size={18} className="text-[#00D492] shrink-0" />
                <input
                  value={locationQuery}
                  onChange={e => setLocationQuery(e.target.value)}
                  placeholder="City or Remote"
                  className="flex-1 bg-transparent outline-none text-zinc-800 font-medium placeholder:text-zinc-400 text-sm"
                />
              </div>

              <Button type="submit" className="h-12 rounded-xl px-8 text-sm font-bold bg-[#34b678] hover:bg-[#00b87d] text-white shadow-sm transition-all shrink-0 cursor-pointer">
                Find Job
              </Button>
            </form>


            {/* Stats Indicators */}
            <div className="flex items-center gap-6 flex-wrap pt-6 border-t border-zinc-300">
              <div className="flex -space-x-2">
                {[11, 12, 13, 14].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-250 overflow-hidden ring-1 ring-zinc-100 shadow-sm">
                    <img src={`https://i.pravatar.cc/100?img=${i}`} alt="" />
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-[#00D492] flex items-center justify-center text-[9px] font-bold text-white shadow-sm">+10k</div>
              </div>
              <div className="h-6 w-px bg-zinc-300" />
              <div>
                <p className="text-zinc-800 font-bold text-sm leading-none">{heroRatingValue} / 5</p>
                <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider mt-1.5">Candidate Rating</p>
              </div>
              <div className="h-6 w-px bg-zinc-300" />
              <div>
                <p className="text-zinc-800 font-bold text-sm leading-none">{heroCompaniesLabel}</p>
                <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider mt-1.5">Companies Hiring</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="lg:col-span-5 block relative mt-10 lg:mt-0"
          >
            {/* Professional Man Image wrapper */}
            <div className="relative z-10 w-full max-w-[420px] mx-auto">
              <img
                loading="eager"
                decoding="async"
                src="images/homepage.png"
                alt="Find Dream Jobs"
                className="w-full h-auto object-cover rounded-2xl"
              />
            </div>
          </motion.div>
        </div>
      </HeroShell>

      <ExplainerTabs />

      {/* Trending marquee */}
      <section className="relative overflow-hidden py-10 bg-white -mt-px">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] mb-4 text-[#00D492]">
              <span className="w-8 h-px bg-[#00D492] shrink-0" /> Top Queries <span className="w-8 h-px bg-[#00D492] shrink-0" />
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900">Trending Searches</h2>
          </div>
          <div className="relative mb-6 overflow-hidden rounded-xl">
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <motion.div className="flex gap-3 w-max" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
              {[...trendingSearches, ...trendingSearches].map((term, i) => (
                <Link key={i} to={`/jobs?q=${encodeURIComponent(term)}`} className="shrink-0 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-650 hover:border-[#00D492] hover:text-[#00b87d] hover:bg-[#00D492]/5 transition-all">
                  {term}
                </Link>
              ))}
            </motion.div>
          </div>
          <div className="relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <motion.div className="flex gap-3 w-max" animate={{ x: ['-50%', '0%'] }} transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}>
              {[...companyStrip, ...companyStrip].map((name, i) => (
                <span key={i} className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold text-slate-400 uppercase tracking-wider border border-transparent">{name}</span>
              ))}
            </motion.div>
          </div>
        </div>
        {/* Shortened bottom divider line */}
        <div className="max-w-5xl mx-auto border-b border-zinc-200 mt-10" />
      </section>

      <StatBento cards={statCards} />

      <StepFlow title="Get Hired in 3 Simple Steps" steps={howItWorks} />

      {/* Free Assessment CTA (Styled like the reference design) */}
      <section className="py-28 bg-white relative overflow-hidden">
        {/* Soft green splash on the left background */}
        <div
          className="absolute -left-24 top-10 w-[450px] h-[450px] rounded-full opacity-[0.08] pointer-events-none blur-[130px]"
          style={{ backgroundColor: '#34b678' }}
        />

        {/* Slanted/curved green background shape touching the rightmost screen edge */}
        <div
          className="absolute right-[-100px] top-[15%] bottom-[15%] left-[55%] lg:left-[60%] rounded-l-[4rem] transform -skew-x-12 shadow-2xl pointer-events-none"
          style={{ backgroundColor: '#34b678', boxShadow: '0 25px 50px -12px rgba(52, 182, 120, 0.25)' }}
        />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16 w-full">

            {/* Left Column: Text & CTA */}
            <div className="flex-1 text-center lg:text-left space-y-6">
              <span className="text-sm font-bold uppercase tracking-wider block" style={{ color: '#34b678' }}>
                AI-Powered
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-5xl font-bold text-zinc-900 tracking-tight leading-[1.15]">
                Test Your Skills for Free
              </h2>
              <p className="text-zinc-500 text-base md:text-lg max-w-xl leading-relaxed">
                Take a quick skill assessment and prove your expertise. Earn verified badges to make your profile stand out to recruiters instantly!
              </p>
              <div className="pt-2">
                <Link to="/free-assessment">
                  <Button
                    className="h-12 px-8 rounded-[4px] text-white font-bold gap-2 transition-all cursor-pointer shadow-lg"
                    style={{
                      backgroundColor: '#138060',
                      boxShadow: '0 10px 15px -3px rgba(52, 182, 120, 0.3)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d9e68'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#34b678'}
                  >
                    Take Free Assessment <ArrowRight size={18} />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Girl Image */}
            <div className="flex-1 w-full flex justify-center items-end relative min-h-[420px] lg:min-h-[480px]">
              {/* Girl image pointing to left */}
              <img
                src="images/gir-large.png"
                alt="Free Assessment"
                className="relative z-10 h-[450px] lg:h-[520px] w-auto object-contain select-none pointer-events-none transform translate-y-6 -translate-x-16 lg:-translate-x-8 scale-x-[-1]"
              />
            </div>

          </div>
        </div>
      </section>

      <JobCarousel jobs={recentJobs} loading={loading} />

      {/* Categories bento */}
      <section className="py-24 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-[#00D492] text-xs font-bold uppercase tracking-[0.25em] mb-4">
              <span className="w-8 h-px bg-[#00D492]/40" /> Browse by Domain <span className="w-8 h-px bg-[#00D492]/40" />
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight">Explore Job Categories</h2>
            <p className="text-zinc-500 mt-3 font-medium text-sm md:text-base">Find opportunities across diverse industries and domains.</p>
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
                  className={`flex flex-col justify-between h-full p-6 rounded-2xl border cursor-pointer group transition-all duration-300 hover:-translate-y-1 ${
                    cat.big
                      ? 'bg-[#00D492] border-transparent hover:shadow-xl hover:shadow-[#00D492]/15 text-white'
                      : 'bg-white border-zinc-200 hover:border-[#00D492] hover:shadow-lg hover:shadow-zinc-200/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${
                      cat.big
                        ? 'w-14 h-14 bg-zinc-950 text-white'
                        : 'w-11 h-11 bg-[#00D492]/10 text-[#00D492]'
                    }`}>
                      <cat.icon size={cat.big ? 26 : 20} />
                    </div>
                    {cat.big && <Flame size={16} className="text-white animate-pulse" />}
                  </div>
                  <div>
                    <h3 className={`font-bold mb-1 ${cat.big ? 'text-2xl text-white' : 'text-base text-zinc-800'}`}>{cat.label}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${cat.big ? 'text-white/80' : 'text-zinc-400'}`}>{cat.count}</p>
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
            className="relative bg-gradient-to-br from-[#00D492] to-[#00b87d] rounded-3xl overflow-hidden p-12 md:p-20 text-center shadow-2xl shadow-[#00D492]/20"
          >
            <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-[60px] -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-black/10 rounded-full blur-[60px] -ml-16 -mb-16" />
            <div className="relative z-10">
              <Badge className="bg-white/10 text-white border-white/20 text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 mb-8 rounded-full">
                For Recruiters & Companies
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Ready to Hire India's Best Talent?</h2>
              <p className="text-white/90 text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                Post a job in minutes and reach millions of qualified candidates. Leverage our AI-powered matching to find the perfect fit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button className="h-14 px-12 rounded-2xl bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-base shadow-xl shadow-black/10 transition-all hover:scale-105 cursor-pointer border border-zinc-900">
                    Post a Job Free
                  </Button>
                </Link>
                <Link to="/company-login">
                  <Button variant="outline" className="h-14 px-12 rounded-2xl bg-transparent border-white/30 text-white hover:bg-white/10 font-bold text-base cursor-pointer">
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
