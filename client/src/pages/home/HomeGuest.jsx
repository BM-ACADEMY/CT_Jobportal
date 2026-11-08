import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, MotionConfig } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Search, Briefcase, Building2, Users, Star, ArrowRight, MapPin, CheckCircle2,
  BadgeCheck, ClipboardCheck, GraduationCap,
} from 'lucide-react';

import BackToTop from '@/components/home/BackToTop';
import Footer from '@/components/home/Footer';
import HeroShell from '@/components/home/HeroShell';
import StatBento from '@/components/home/StatBento';
import JobCarousel from '@/components/home/JobCarousel';
import TestimonialCarousel from '@/components/home/TestimonialCarousel';
import StepStory from '@/components/home/StepStory';
import ExplainerTabs from '@/components/home/ExplainerTabs';
import Reveal from '@/components/home/Reveal';
import TrendingSearches from '@/components/home/TrendingSearches';
import SkillAssessment from '@/components/home/SkillAssessment';
import MotionIcon from '@/components/home/MotionIcon';
import CategoryCards from '@/components/home/CategoryCards';
import { popularTerms, MIN_POPULAR_TERMS } from '@/utils/popularSearches';
import { trackEvent } from '@/utils/analytics';

// A number below this is not worth showing on a public page.
const MIN_STAT = 10;

const formatCount = (n) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr+`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
  return `${n}`;
};

const howItWorks = [
  { step: '01', title: 'Create Your Profile', desc: 'Build your professional profile in minutes. Upload your resume and showcase your skills.', icon: Users },
  { step: '02', title: 'Explore Opportunities', desc: 'Browse open jobs from employers, search by role and location.', icon: Search },
  { step: '03', title: 'Apply & Get Hired', desc: 'Apply with one click and track your applications in real-time through your dashboard.', icon: CheckCircle2 },
];

// Cards floating around the hero photo.
const heroFloatCards = [
  { title: 'Local Jobs', subtitle: 'Tamil Nadu and Puducherry', icon: BadgeCheck, iconClass: 'bg-sky-100 text-sky-600', position: 'left-0 -bottom-4', anim: 'pop' },
];

const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const SectionEyebrow = ({ children }) => (
  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] mb-4 text-[#059669]">
    <span className="w-8 h-px bg-[#00D492]/50 shrink-0" /> {children} <span className="w-8 h-px bg-[#00D492]/50 shrink-0" />
  </span>
);

const HomeGuest = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState(null);
  const [skillTestCount, setSkillTestCount] = useState(0);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    axios.get(`${API_BASE_URL}/jobs`)
      .then(res => setJobs(Array.isArray(res.data) ? res.data : []))
      .catch(() => { })
      .finally(() => setLoading(false));

    axios.get(`${API_BASE_URL}/public/stats`)
      .then(res => setPlatformStats(res.data && typeof res.data === "object" ? res.data : null))
      .catch(() => { });

    // Number of free skill tests on offer (real count from the question bank).
    axios.get(`${API_BASE_URL}/assessments/skills`)
      .then(res => setSkillTestCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => { });
  }, [API_BASE_URL]);

  const handleSearch = (e) => {
    e?.preventDefault();
    navigate(`/jobs?q=${searchQuery}&loc=${locationQuery}`);
  };

  // Real company names only. With few companies the strip simply shows fewer names.
  const companyStrip = useMemo(
    () => [...new Set(jobs.map(j => j.company?.name).filter(Boolean))],
    [jobs]
  );

  // Popular searches come from the open jobs, so every chip leads to results.
  const trendingSearches = useMemo(() => popularTerms(jobs), [jobs]);

  const recentJobs = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3),
    [jobs]
  );

  // Only real numbers are ever shown. Until they load (or if the API is down) nothing is shown,
  // and any stat under MIN_STAT is left out rather than advertising a tiny number.
  const hasStats = !!platformStats;

  const statCards = !hasStats ? [] : [
    { label: 'Open Jobs', raw: platformStats.openJobs ?? platformStats.activeJobsCount, icon: Briefcase },
    { label: 'Companies Hiring', raw: platformStats.companiesHiring ?? platformStats.companiesCount, icon: Building2, invert: true },
    { label: 'Colleges', raw: platformStats.collegesOnboardedCount, icon: GraduationCap },
    { label: 'Students', raw: platformStats.students ?? platformStats.jobseekersCount, icon: Users },
    { label: 'Free Skill Tests', raw: skillTestCount, icon: ClipboardCheck },
    { label: 'Avg Rating', raw: platformStats.reviewsCount, icon: Star, display: `${Number(platformStats.avgRating || 0).toFixed(1)}\u2605` },
  ]
    .filter((c) => Number(c.raw) >= MIN_STAT)
    .map((c) => ({ label: c.label, value: c.display || formatCount(Number(c.raw)), icon: c.icon, invert: c.invert }));

  // The small proof line under the search box: same data, same rule.
  const heroStats = !hasStats ? [] : [
    { label: 'Companies Hiring', raw: platformStats.companiesHiring },
    { label: 'Open Jobs', raw: platformStats.openJobs },
    { label: 'Colleges', raw: platformStats.collegesOnboardedCount },
    { label: 'Students', raw: platformStats.students },
    { label: 'Free Skill Tests', raw: skillTestCount },
  ]
    .filter((c) => Number(c.raw) >= MIN_STAT)
    .map((c) => ({ label: c.label, value: formatCount(Number(c.raw)) }));

  return (
    <MotionConfig reducedMotion="user">
      <div className="w-full overflow-x-clip bg-white">

        <HeroShell>
          <div className="grid lg:grid-cols-12 gap-12 items-center">

            {/* Left Column */}
            <motion.div
              variants={heroStagger}
              initial="hidden"
              animate="show"
              className="lg:col-span-7 space-y-7"
            >
              {/* Headline */}
              <motion.h1 variants={heroItem} className="text-4xl md:text-5xl lg:text-[4.2rem] font-bold text-zinc-900 tracking-tight leading-[1.1]">
                Your{' '}
                <span className="relative inline-block">
                  <span className="home-gradient-text">Dream</span>
                  <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                    <motion.path
                      d="M2 9 C 50 2, 150 2, 198 8"
                      fill="none"
                      stroke="#00D492"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.9, delay: 0.7, ease: 'easeInOut' }}
                    />
                  </svg>
                </span>{' '}
                Job Is<br />
                Waiting For You
              </motion.h1>

              <motion.p variants={heroItem} className="text-zinc-600 text-base max-w-lg leading-relaxed">
                Find jobs from employers in Puducherry, Tamil Nadu and beyond. Discover openings that match your skills, location, and career aspirations.
              </motion.p>

              {/* Search card */}
              <motion.form
                variants={heroItem}
                onSubmit={handleSearch}
                role="search"
                className="bg-white border border-zinc-200/70 rounded-2xl p-2 flex flex-col md:flex-row gap-2 max-w-3xl shadow-[0_20px_50px_-20px_rgba(0,212,146,0.35)] transition-shadow duration-300 focus-within:shadow-[0_24px_60px_-18px_rgba(0,212,146,0.5)] focus-within:border-emerald-300"
              >
                <label className="flex items-center gap-3 flex-1 px-4 py-3 group rounded-xl transition-colors focus-within:bg-emerald-50/60 cursor-text">
                  <MotionIcon icon={Search} animation="wiggle" trigger="hover" size={18} className="text-[#059669] shrink-0" />
                  <span className="sr-only">Job title or keywords</span>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Job Title, Keywords"
                    className="flex-1 min-w-0 bg-transparent outline-none text-zinc-800 font-medium placeholder:text-zinc-400 text-sm"
                  />
                </label>

                <div className="w-px bg-zinc-200 hidden md:block my-2" />

                <label className="flex items-center gap-3 flex-1 px-4 py-3 group rounded-xl transition-colors focus-within:bg-emerald-50/60 cursor-text">
                  <MotionIcon icon={MapPin} animation="bounce" trigger="hover" size={18} className="text-[#059669] shrink-0" />
                  <span className="sr-only">Location</span>
                  <input
                    value={locationQuery}
                    onChange={e => setLocationQuery(e.target.value)}
                    placeholder="City, e.g. Puducherry, or Remote"
                    className="flex-1 min-w-0 bg-transparent outline-none text-zinc-800 font-medium placeholder:text-zinc-400 text-sm"
                  />
                </label>

                <Button type="submit" className="group home-shine relative overflow-hidden h-12 rounded-xl px-8 text-sm font-bold bg-[#059669] hover:bg-[#047857] text-white shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] shrink-0 cursor-pointer">
                  <MotionIcon icon={Search} animation="wiggle" trigger="hover" size={16} /> Find Job
                </Button>
              </motion.form>

              {/* Popular searches */}
              {trendingSearches.length > 0 && (
              <motion.div variants={heroItem} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-zinc-500 mr-1">Popular:</span>
                {trendingSearches.slice(0, 4).map(term => (
                  <Link
                    key={term}
                    to={`/jobs?q=${encodeURIComponent(term)}`}
                    className="px-3 py-1.5 rounded-full bg-white/70 border border-zinc-200 font-medium text-zinc-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </motion.div>
              )}

              {/* Free skill test and a way in for each audience, always visible, no pop-up */}
              <motion.div variants={heroItem} className="flex flex-col gap-3">
                <Link
                  to="/free-assessment"
                  onClick={() => trackEvent('audience_click', { audience: 'skill_test' })}
                  className="inline-flex w-full sm:w-fit items-center justify-center gap-2 h-11 px-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-bold hover:bg-emerald-100 transition-colors"
                >
                  <BadgeCheck size={16} /> Take a free skill test
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-xs" aria-label="Choose how you want to use Velaivaaipu">
                  {[
                    { label: "I'm looking for a job", to: '/jobs', audience: 'job_seeker' },
                    { label: "I'm hiring", to: '/company-login', audience: 'company' },
                    { label: "I'm a college", to: '/for-colleges', audience: 'college' },
                  ].map(item => (
                    <Link
                      key={item.audience}
                      to={item.to}
                      onClick={() => trackEvent('audience_click', { audience: item.audience })}
                      className="px-3.5 py-2 rounded-full bg-white border border-zinc-200 font-semibold text-zinc-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Live numbers (hidden until there is something real to say) */}
              {heroStats.length > 0 && (
                <motion.div variants={heroItem} className="flex items-center gap-6 flex-wrap pt-6 border-t border-zinc-200">
                  {heroStats.map((st, i) => (
                    <React.Fragment key={st.label}>
                      {i > 0 && <div className="h-8 w-px bg-zinc-200" />}
                      <div>
                        <p className="text-zinc-900 font-bold text-sm leading-none">{st.value}</p>
                        <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mt-1.5">{st.label}</p>
                      </div>
                    </React.Fragment>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {/* Right Column */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="lg:col-span-5 relative mt-10 lg:mt-0"
            >
              <div className="relative w-full max-w-[420px] mx-auto">
                {/* Glow halo behind the photo */}
                <div className="absolute inset-6 rounded-[2rem] bg-gradient-to-tr from-[#00D492]/40 to-teal-200/40 blur-2xl" aria-hidden="true" />
                <picture>
                  <source srcSet="images/homepage.webp" type="image/webp" />
                  <img
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    src="images/homepage.png"
                    alt="Professional ready for a new role"
                    width="900"
                    height="1055"
                    className="home-float relative z-10 w-full h-auto object-cover rounded-2xl"
                  />
                </picture>

                {/* Floating glass cards */}
                {heroFloatCards.map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.2, type: 'spring', stiffness: 220, damping: 18 }}
                    className={`absolute z-20 hidden sm:block ${card.position}`}
                  >
                    <div
                      className="home-float-sm flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-[0_15px_40px_-15px_rgba(15,23,42,0.25)]"
                      style={{ animationDelay: `${i * 0.8}s` }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconClass}`}>
                        <MotionIcon icon={card.icon} animation={card.anim} delay={i * 0.5} size={18} />
                      </div>
                      <div className="leading-tight">
                        <p className="text-sm font-bold text-zinc-900">{card.title}</p>
                        <p className="text-[11px] font-medium text-zinc-500">{card.subtitle}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </HeroShell>

        <ExplainerTabs />

        {trendingSearches.length >= MIN_POPULAR_TERMS && (
          <TrendingSearches terms={trendingSearches} companies={companyStrip} />
        )}

        {/* The quote shows only until real company or college numbers are big enough to show instead. */}
        {statCards.length > 0 && (
          <StatBento
            cards={statCards}
            quote={statCards.some((c) => c.label === 'Companies Hiring' || c.label === 'Colleges') ? undefined : 'Your next opportunity is just one application away.'}
          />
        )}

        <StepStory title="Get Hired in 3 Simple Steps" steps={howItWorks} />

        <SkillAssessment />

        <JobCarousel jobs={recentJobs} loading={loading} />

        {/* Job categories */}
        <section className="py-24 bg-gradient-to-b from-white via-[#fafafa] to-[#fafafa] overflow-hidden">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal className="text-center mb-16">
              <SectionEyebrow>Browse by Domain</SectionEyebrow>
              <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight">Find Work in Every Field</h2>
              <p className="text-zinc-600 mt-3 font-medium text-sm md:text-base">Healthcare, hotels, shops, factories, offices and more. Pick your field and see who is hiring.</p>
            </Reveal>
            <CategoryCards />
          </div>
        </section>

        <TestimonialCarousel subtitle="Join our growing community of professionals who found their career path through us." />

        {/* Recruiter CTA */}
        {/* Brand-green banner; the cut-out photo breaks out of the top edge */}
        <section className="pt-16 lg:pt-32 pb-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-[2rem] bg-gradient-to-br from-[#3CC283] via-[#34B678] to-[#249a62] shadow-2xl shadow-[#34B678]/30"
            >
              {/* Decoration stays clipped to the card; the photo is not */}
              <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                {/* Wave lines: sweep in from the top-left behind the photo, then bundle into a band
                    that runs just under the button row (buttons sit at ~66–82% of card height) */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 300" preserveAspectRatio="none" fill="none">
                  <defs>
                    <linearGradient id="cta-wave-fade" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0" stopColor="#fff" stopOpacity="0.15" />
                      <stop offset="0.35" stopColor="#fff" stopOpacity="0.55" />
                      <stop offset="0.75" stopColor="#fff" stopOpacity="0.35" />
                      <stop offset="1" stopColor="#fff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {Array.from({ length: 12 }, (_, i) => (
                    <path
                      key={i}
                      d={`M0 ${30 + i * 9} C 150 ${-20 + i * 7}, 290 ${110 + i * 6}, 420 ${262 + i * 1.6} S 760 ${266 + i * 1.6}, 1000 ${252 + i * 2}`}
                      stroke="url(#cta-wave-fade)"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </svg>
                <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-white/10" />
              </div>

              <div className="relative lg:pl-[40%]">
                {/* Card height comes from the text. On desktop the photo is pinned to the card's
                    bottom and sized off that height, so only the head rises above the top edge */}
                <motion.img
                  src="/images/ads.png"
                  alt="Happy candidate pointing to the call to action"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="hidden lg:block absolute bottom-0 left-[4%] w-auto h-[120%] select-none [mask-image:linear-gradient(to_bottom,#000_72%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_72%,transparent)]"
                  draggable="false"
                />

                <div className="px-8 sm:px-12 py-12 lg:pl-0 lg:pr-14 lg:py-14 text-left">
                  <p className="text-[#10213D] text-sm font-bold mb-3">For Recruiters & Companies</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight leading-tight">
                    Ready to Hire India's <span className="text-[#10213D]">Best Talent?</span>
                  </h2>
                  <p className="text-white/90 text-base font-medium mb-8 max-w-xl leading-relaxed">
                    Post a job in minutes and reach job seekers across Tamil Nadu and Puducherry.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-start">
                    <Link to="/register">
                      <Button className="group home-shine relative overflow-hidden h-12 px-8 rounded-xl bg-[#10213D] hover:bg-[#0b1830] text-white font-bold text-base shadow-lg shadow-[#10213D]/30 transition-all hover:-translate-y-0.5 cursor-pointer">
                        Post a Job Free <MotionIcon icon={ArrowRight} animation="nudge" trigger="hover" size={18} />
                      </Button>
                    </Link>
                    <Link to="/company-login">
                      <Button variant="outline" className="h-12 px-8 rounded-xl bg-white text-[#10213D] border-white hover:bg-white/90 hover:text-[#10213D] font-bold text-base cursor-pointer">
                        Company Login
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
        <BackToTop />
      </div>
    </MotionConfig>
  );
};

export default HomeGuest;
