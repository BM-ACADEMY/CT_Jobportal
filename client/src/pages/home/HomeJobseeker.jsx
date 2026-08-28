import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Search, Briefcase, Building2, Users, MapPin, Sparkles, ArrowRight,
  FileText, Wand2, CheckCircle2, Award, Zap, Star,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProfileCompletionPrompt } from '../../hooks/useProfileCompletionPrompt';

import ScrollProgressBar from '@/components/home/ScrollProgressBar';
import BackToTop from '@/components/home/BackToTop';
import Footer from '@/components/home/Footer';
import HeroShell from '@/components/home/HeroShell';
import StatBento from '@/components/home/StatBento';
import JobCarousel from '@/components/home/JobCarousel';
import TestimonialCarousel from '@/components/home/TestimonialCarousel';
import StepFlow from '@/components/home/StepFlow';
import CompanyRecruiterList from '@/components/home/CompanyRecruiterList';
import SkillScoreBento from '@/components/home/SkillScoreBento';
import PlacementHighlights from '@/components/home/PlacementHighlights';
import ProfileCompletionDialog from '@/components/home/ProfileCompletionDialog';

const formatCount = (n) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr+`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
  return `${n}`;
};

const howItWorks = [
  { step: '01', title: 'Polish Your Profile', desc: 'Add skills, resume and preferences so recruiters find you first.', icon: Users },
  { step: '02', title: 'Get Matched', desc: 'We surface roles that fit your skills, not just keywords.', icon: Search },
  { step: '03', title: 'Apply & Get Hired', desc: 'Apply with one click and track every application live.', icon: CheckCircle2 },
];

const HomeJobseeker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const firstName = user?.name?.split(' ')[0] || 'there';

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [platformStats, setPlatformStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [personalized, setPersonalized] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [resumeReview, setResumeReview] = useState(null);

  const { show: showProfileDialog, completion, dismiss } = useProfileCompletionPrompt(user);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/public/stats`).then(res => setPlatformStats(res.data)).catch(() => {});

    axios.get(`${API_BASE_URL}/requests/my-ai-resume-reviews`)
      .then(res => setResumeReview(res.data?.[0] || null))
      .catch(() => {});
  }, [API_BASE_URL]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setJobsLoading(true);
      if (user?.profile?.skills?.length) {
        try {
          const res = await axios.get(`${API_BASE_URL}/jobs/matching`);
          const matched = (res.data || []).slice(0, 3);
          if (!cancelled && matched.length) {
            setRecentJobs(matched);
            setPersonalized(true);
            setJobsLoading(false);
            return;
          }
        } catch {
          // fall through to latest-jobs branch
        }
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/jobs`);
        const latest = [...(res.data || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (!cancelled) {
          setRecentJobs(latest.slice(0, 3));
          setPersonalized(false);
        }
      } catch {
        // no jobs available
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user, API_BASE_URL]);

  const handleSearch = (e) => {
    e?.preventDefault();
    navigate(`/jobs?q=${searchQuery}&loc=${locationQuery}`);
  };

  const useFallback = !platformStats || (platformStats.activeJobsCount < 1000 && platformStats.companiesCount < 1000);
  const statCards = useFallback ? [
    { label: 'Companies Hiring', value: '10K+', icon: Building2, invert: true },
    { label: 'Active Jobs', value: '2L+', icon: Briefcase },
    { label: 'New This Week', value: '5K+', icon: Sparkles },
  ] : [
    { label: 'Companies Hiring', value: formatCount(platformStats.companiesCount), icon: Building2, invert: true },
    { label: 'Active Jobs', value: formatCount(platformStats.activeJobsCount), icon: Briefcase },
    { label: 'New This Week', value: formatCount(platformStats.newJobsThisWeek), icon: Sparkles },
  ];

  return (
    <div className="w-full overflow-x-hidden bg-white">
      <ScrollProgressBar />

      <HeroShell>
        {({ tiltX, tiltY }) => (
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
                  {completion < 100 ? `Your profile is ${completion}% complete` : 'Your profile is ready'}
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl xl:text-[4.6rem] font-black text-white leading-[0.98] mb-8 tracking-tighter">
                Welcome back,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{firstName}</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-xl font-normal mb-10 max-w-xl leading-relaxed">
                Your next opportunity is a search away. Explore roles matched to your skills.
              </p>

              <form onSubmit={handleSearch} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl shadow-black/30">
                <div className="flex items-center gap-3 flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/5">
                  <Search size={20} className="text-emerald-400 shrink-0" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Job title or keywords..." className="flex-1 bg-transparent outline-none text-white font-medium placeholder:text-slate-500 text-sm" />
                </div>
                <div className="flex items-center gap-3 flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/5">
                  <MapPin size={20} className="text-slate-500 shrink-0" />
                  <input value={locationQuery} onChange={e => setLocationQuery(e.target.value)} placeholder="City or Remote..." className="flex-1 bg-transparent outline-none text-white font-medium placeholder:text-slate-500 text-sm" />
                </div>
                <Button type="submit" className="h-12 rounded-xl px-8 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/25 transition-all shrink-0">
                  Search Jobs
                </Button>
              </form>
            </motion.div>

            {/* Right — bento visual cluster */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className="lg:col-span-5 grid grid-cols-2 grid-rows-[1fr_1fr_auto] gap-4 h-[400px] md:h-[480px] mt-10 lg:mt-0"
            >
              <motion.div
                style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1200 }}
                className="row-span-2 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 relative"
              >
                <img
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800"
                  alt="Job seeker celebrating an offer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-sm font-bold leading-snug">Your dream role is closer than you think.</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xl shadow-black/20 flex flex-col justify-center"
              >
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white mb-3"><Award size={18} /></div>
                <p className="text-2xl font-black text-slate-900 leading-none">{completion}%</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-1.5">Profile Score</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="bg-slate-900 rounded-2xl p-5 border border-white/10 shadow-xl shadow-black/30 flex flex-col justify-center"
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 mb-3"><Star size={18} /></div>
                <p className="text-2xl font-black text-white leading-none">{personalized ? recentJobs.length : 'AI'}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-1.5">{personalized ? 'Jobs Matched' : 'Powered Matching'}</p>
              </motion.div>

              <div className="col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                <p className="text-slate-300 text-sm font-semibold flex-1">
                  <span className="text-white font-bold">New roles</span> matched to your skills every day
                </p>
                <Zap size={16} className="text-emerald-400 shrink-0" />
              </div>
            </motion.div>
          </div>
        )}
      </HeroShell>

      <StatBento cards={statCards} />

      <CompanyRecruiterList type="company" eyebrow="Top Employers" title="Companies Hiring Now" subtitle="Explore verified companies actively posting roles." />
      <CompanyRecruiterList type="recruiter" eyebrow="Meet Your Recruiters" title="Recruiters On The Platform" subtitle="Connect with the people reviewing applications." />

      <StepFlow title="Get Hired in 3 Simple Steps" steps={howItWorks} />

      <SkillScoreBento />

      {/* Resume section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-4">
              <span className="w-8 h-px bg-emerald-300" /> Stand Out <span className="w-8 h-px bg-emerald-300" />
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Your Resume, Perfected</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Link to="/candidate/ai-resume-review" className="group flex flex-col p-8 rounded-3xl border-2 border-slate-200 hover:border-slate-900 bg-white transition-all">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 text-emerald-400 flex items-center justify-center mb-6"><Sparkles size={24} /></div>
              <h3 className="font-bold text-slate-900 text-xl mb-2">AI Resume Review</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">Get expert feedback on strengths, weaknesses and keyword gaps.</p>
              {resumeReview ? (
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-xs font-bold">
                  <span className="text-slate-500">Latest review status</span>
                  <span className="capitalize text-emerald-600">{resumeReview.status}</span>
                </div>
              ) : (
                <span className="text-emerald-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">Request a review <ArrowRight size={14} /></span>
              )}
            </Link>
            <Link to="/candidate/resume-builder" className="group flex flex-col p-8 rounded-3xl border-2 border-slate-200 hover:border-slate-900 bg-white transition-all">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 text-emerald-400 flex items-center justify-center mb-6"><Wand2 size={24} /></div>
              <h3 className="font-bold text-slate-900 text-xl mb-2">Build Your Resume</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">Create a polished, recruiter-ready resume in minutes.</p>
              <span className="text-emerald-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                <FileText size={14} /> Open Resume Builder
              </span>
            </Link>
          </div>
        </div>
      </section>

      <JobCarousel
        jobs={recentJobs}
        loading={jobsLoading}
        eyebrow={personalized ? 'Matched To Your Skills' : 'Fresh Listings'}
        subtitle={personalized ? 'Roles picked based on the skills on your profile.' : 'The latest roles posted on the platform.'}
        badgeText={personalized ? 'Matched For You' : 'Just Posted'}
      />

      <TestimonialCarousel roleFilter="jobseeker" subtitle="Real stories from job seekers who found their next role here." />

      <PlacementHighlights />

      <Footer />
      <BackToTop />

      <ProfileCompletionDialog open={showProfileDialog} onDismiss={dismiss} completion={completion} />
    </div>
  );
};

export default HomeJobseeker;
