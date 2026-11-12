import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import {
  MapPin, Briefcase, IndianRupee, Clock, Loader2, ArrowLeft, Building2, Globe, Users,
  Calendar, ChevronRight, Share2, Bookmark, Sparkles, TrendingUp, ShieldCheck, Laptop, CalendarClock, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasFeature } from '../components/subscription/FeatureGate';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import JobApplicationModal from '../components/jobs/JobApplicationModal';
import ShareModal from '../components/jobs/ShareModal';
import SEOHead from '../components/seo/SEOHead';
import { jobIdFromParam, jobPath } from '../utils/jobUrl';
import { trackEvent } from '../utils/analytics';
import WaveLines from '@/components/common/WaveLines';
import Footer from '@/components/home/Footer';

const EASE = [0.22, 1, 0.36, 1];

const formatSalary = (salary) => {
  if (!salary || salary.isRangeHidden) return "Not Disclosed";
  if (salary.min && salary.max) {
    return `₹${(salary.min / 100000).toFixed(1)}-${(salary.max / 100000).toFixed(1)} LPA`;
  }
  if (salary.min) return `₹${(salary.min / 100000).toFixed(1)}+ LPA`;
  return "Competitive";
};

const formatExperience = (exp) => {
  if (!exp || (exp.min == null && exp.max == null)) return 'Not specified';
  if (!exp.min && !exp.max) return 'Fresher';
  if (exp.max == null || exp.max === exp.min) return `${exp.min}+ Yrs`;
  return `${exp.min ?? 0}–${exp.max} Yrs`;
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

// Concentric rings used as a quiet corner decoration on brand panels.
const Rings = ({ opacity = 0.18, className = '-right-16 -top-16 w-48 h-48' }) => (
  <svg className={`absolute pointer-events-none ${className}`} viewBox="0 0 200 200" fill="none" aria-hidden="true">
    {[40, 60, 80, 100].map((r) => <circle key={r} cx="100" cy="100" r={r} stroke="#34B678" strokeOpacity={opacity} />)}
  </svg>
);

// Recruiters paste descriptions as plain text. Turn it into blocks so it reads like a page:
// "Key Responsibilities:" -> heading, "1. Lead Generation" -> numbered sub-heading,
// runs of short lines -> a bullet list, long lines -> a paragraph.
const BULLET_RE = /^[-•*–·▪●✓✔]\s*/;
const NUMBERED_HEADING_RE = /^(\d{1,2})[.)]\s+(.{2,60})$/;
const isHeading = (line) => {
  const t = line.replace(BULLET_RE, '');
  if (t.length > 60) return false;
  if (/:$/.test(t)) return true;
  // Short Title Case line with no sentence punctuation, e.g. "Preferred Skills & Experience".
  const words = t.split(/\s+/);
  return words.length >= 2 && words.length <= 6 && !/[.,;!?]$/.test(t) &&
    words.every((w) => /^[A-Z&/(]/.test(w) || /^(and|of|to|for|the|in|with|&)$/i.test(w));
};

const parseDescription = (text) => {
  const blocks = [];
  let list = null;
  const flushList = () => {
    if (!list) return;
    if (list.length === 1) blocks.push({ type: 'p', text: list[0] });
    else blocks.push({ type: 'ul', items: list });
    list = null;
  };
  String(text || '').split(/\r?\n/).forEach((raw) => {
    const line = raw.trim();
    if (!line) { flushList(); return; }
    const numbered = line.match(NUMBERED_HEADING_RE);
    if (numbered && !/[.]$/.test(numbered[2])) {
      flushList();
      blocks.push({ type: 'h4', num: numbered[1], text: numbered[2].replace(/:$/, '') });
      return;
    }
    if (isHeading(line)) {
      flushList();
      blocks.push({ type: 'h3', text: line.replace(BULLET_RE, '').replace(/:$/, '') });
      return;
    }
    if (line.length > 220) {
      flushList();
      blocks.push({ type: 'p', text: line });
      return;
    }
    (list ||= []).push(line.replace(BULLET_RE, ''));
  });
  flushList();
  return blocks;
};

const FormattedDescription = ({ text }) => {
  const blocks = parseDescription(text);
  return (
    <div className="space-y-4 text-zinc-700 text-[15px] md:text-base leading-[1.8] break-words">
      {blocks.map((b, i) => {
        if (b.type === 'h3') {
          return <h3 key={i} className={`m-0 text-lg font-bold text-[#10213D] ${i ? 'pt-4' : ''}`}>{b.text}</h3>;
        }
        if (b.type === 'h4') {
          return (
            <h4 key={i} className="m-0 pt-2 flex items-center gap-3 text-base font-bold text-[#10213D]">
              <span className="w-7 h-7 shrink-0 rounded-lg bg-[#34B678]/10 text-[#1f8a57] text-xs font-bold flex items-center justify-center">{b.num}</span>
              {b.text}
            </h4>
          );
        }
        if (b.type === 'ul') {
          return (
            <ul key={i} className="m-0 p-0 list-none space-y-2.5">
              {b.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="mt-[0.7em] w-1.5 h-1.5 shrink-0 rounded-full bg-[#34B678]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="m-0">{b.text}</p>;
      })}
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#10213D] m-0 mb-5">{children}</h2>
);

const CompanyLogo = ({ logo, name, size = 'w-20 h-20', fontSize = 30 }) => (
  <div className={`${size} rounded-2xl bg-white ring-1 ring-zinc-200 overflow-hidden shrink-0 flex items-center justify-center shadow-sm`}>
    {logo ? (
      <img src={logo} alt={`${name} logo`} className="w-full h-full object-cover" />
    ) : (
      <span className="w-full h-full bg-[#34B678]/10 text-[#1f8a57] font-bold flex items-center justify-center" style={{ fontSize }}>
        {name?.[0] || 'J'}
      </span>
    )}
  </div>
);

const JobDetails = () => {
  const { id: routeParam } = useParams();
  const id = jobIdFromParam(routeParam);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [matchAnalysis, setMatchAnalysis] = useState(null);
  const [isCalculatingMatch, setIsCalculatingMatch] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get(`${API_BASE_URL}/jobs/${id}`, config);
        setJob(response.data);
        if (!response.data.closed) trackEvent('view_job', { content_name: response.data.title, content_ids: [response.data._id] });
      } catch (error) {
        console.error('Error fetching job details:', error);
        if (error.response?.status === 404) {
          toast.error(error.response.data.msg || "Job not found or is no longer active");
          navigate('/jobs');
        } else {
          toast.error("Failed to load job details");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL, navigate]);

  const [showProfileNudge, setShowProfileNudge] = useState(false);

  // Job found on the web: the candidate applies on the employer's own site (no login needed).
  const externalUrl = job?.externalApply?.url || '';
  const handleApply = () => {
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
      axios.post(`${API_BASE_URL}/jobs/${job._id}/apply-click`).catch(() => {});
      trackEvent && trackEvent('external_apply_click', { job_id: job._id });
      return;
    }
    if (!user) {
      toast.error("Please login to apply for this job");
      navigate('/login');
      return;
    }

    if (user.role === 'company') {
      toast.error("Companies cannot apply for jobs");
      return;
    }

    if (user.id === job.recruiter) {
      toast.error("You cannot apply for a job you have posted");
      return;
    }

    // Gentle nudge, never a block: a thin profile lowers the chance of being shortlisted.
    if (user.role === 'jobseeker' && (user.profile?.profileCompletion ?? 100) < 60) {
      setShowProfileNudge(true);
      return;
    }

    setIsApplyModalOpen(true);
  };

  const handleSaveJob = async () => {
    if (!user) {
      toast.error("Please login to save this job");
      navigate('/login');
      return;
    }

    setIsSaving(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/user/save-job/${id}`);
      updateUser({ savedJobs: response.data.savedJobs });
      toast.success(response.data.msg);
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error("Failed to save job");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalculateMatch = async () => {
    if (!user || user.role !== 'jobseeker') {
      toast.error("Only candidates can check their match score");
      return;
    }

    if (!hasFeature(user, 'hasJobMatchAnalysis')) {
      toast.error("Premium Feature: Please upgrade your plan or purchase Job Match Analysis to use this.");
      navigate('/candidate/pay-per-features');
      return;
    }

    setIsCalculatingMatch(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/jobs/${id}/pre-match`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatchAnalysis(res.data.matchAnalysis);
      toast.success("Match score calculated!");
    } catch (error) {
      console.error('Error calculating match:', error);
      toast.error("Failed to calculate AI match score");
    } finally {
      setIsCalculatingMatch(false);
    }
  };

  const handleSalaryBenchmarking = () => {
    if (!user || user.role !== 'jobseeker') {
      toast.error("Only candidates can use salary benchmarking");
      return;
    }

    if (!hasFeature(user, 'hasSalaryBenchmarking')) {
      toast.error("Premium Feature: Please upgrade your plan or purchase Salary Benchmarking to use this.");
      navigate('/candidate/pay-per-features');
      return;
    }

    navigate('/candidate/salary-benchmarking', {
      state: { jobRole: job.title, companyName: job.company?.name || '' }
    });
  };

  const handleShareJob = () => setIsShareModalOpen(true);

  const isJobSaved = user?.savedJobs?.some(savedId => String(savedId) === String(id));

  if (loading) {
    return (
      <div className="min-h-screen bg-white" role="status" aria-label="Loading job">
        <div className="bg-[#f4faf7] border-b border-emerald-100 px-6 pt-28 pb-12">
          <div className="max-w-6xl mx-auto animate-pulse">
            <div className="h-4 w-48 rounded bg-emerald-100 mb-8" />
            <div className="flex gap-5">
              <div className="w-20 h-20 rounded-2xl bg-emerald-100 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-2/3 rounded-lg bg-emerald-100" />
                <div className="h-4 w-1/3 rounded bg-emerald-100" />
              </div>
            </div>
            <div className="mt-9 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-emerald-100/70" />)}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8 animate-pulse">
          <div className="lg:col-span-2 h-80 rounded-[1.75rem] bg-zinc-100" />
          <div className="h-64 rounded-[1.75rem] bg-zinc-100" />
        </div>
      </div>
    );
  }

  if (!job) return null;

  // Closed / filled jobs keep a live page instead of bouncing the visitor to a 404.
  if (job.closed) {
    return (
      <div className="min-h-screen bg-white">
        <SEOHead title={`${job.title || 'Job'} — position filled | Velaivaaipu`} description="This position has been filled. Browse the latest jobs on Velaivaaipu." path={jobPath(job)} robots="noindex, follow" />
        <div className="relative overflow-hidden bg-[#f4faf7] border-b border-emerald-100 px-6 pt-36 pb-24 text-center">
          <WaveLines id="job-closed-waves" />
          <div className="relative max-w-2xl mx-auto">
            <span className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white text-[#34B678] flex items-center justify-center shadow-sm"><Briefcase size={24} /></span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#10213D] tracking-tight">This position has been filled</h1>
            <p className="text-zinc-600 mt-3">
              {job.title ? `${job.title}${job.company?.name ? ` at ${job.company.name}` : ''} is no longer accepting applications.` : 'This job is no longer accepting applications.'}
            </p>
            <Link to="/jobs" className="inline-flex items-center gap-2 mt-8 px-7 h-12 rounded-xl bg-[#34B678] hover:bg-[#2ca66b] text-white font-bold text-sm shadow-lg shadow-[#34B678]/25 transition-colors">
              Browse similar jobs <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const companyName = job.externalApply?.employerName || job.company?.name || 'Velaivaaipu';
  const city = job.location || 'Tamil Nadu';
  const fullJobTitle = `${job.title} Job in ${city} – ${companyName} | Velaivaaipu`;
  const seoTitle = fullJobTitle.length <= 60 ? fullJobTitle : `${job.title} Job in ${city} | Velaivaaipu`;
  const seoDescription = `${companyName} is hiring ${job.title} in ${city}. ${job.vacancies || 1} opening${job.vacancies === 1 ? '' : 's'}${job.jobType ? `, ${String(job.jobType).toLowerCase()}` : ''}. ${job.externalApply?.url ? 'Check the details and apply on the employer site.' : 'Check the job details and apply online free on Velaivaaipu.'}`;
  const jobSchema = {
    '@context': 'https://schema.org', '@type': 'JobPosting',
    title: job.title, description: job.description,
    identifier: { '@type': 'PropertyValue', name: 'Velaivaaipu', value: job.display_id || job._id },
    datePosted: job.createdAt, validThrough: job.validThrough,
    employmentType: String(job.jobType || 'FULL_TIME').toUpperCase().replace(/[ -]/g, '_'),
    hiringOrganization: { '@type': 'Organization', name: companyName, sameAs: job.externalApply?.url ? undefined : job.company?.website },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: city, addressRegion: 'Tamil Nadu', addressCountry: 'IN' } },
    directApply: !job.externalApply?.url,
    ...(job.workMode === 'Remote' ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'IN' } } : {}),
    ...(!job.salary?.isRangeHidden && job.salary?.min ? { baseSalary: { '@type': 'MonetaryAmount', currency: job.salary.currency || 'INR', value: { '@type': 'QuantitativeValue', minValue: job.salary.min, maxValue: job.salary.max || job.salary.min, unitText: 'YEAR' } } } : {}),
  };

  const canApply = user?.role !== 'recruiter' && user?.role !== 'company';
  const salaryText = formatSalary(job.salary);
  const salaryShown = salaryText.startsWith('₹');
  const logoUrl = job.company?.logo ? `${API_DOMAIN}${job.company.logo}` : null;
  const aboutCompany = job.company?.about_us || job.company?.description || job.company?.tagline;
  const companySize = job.company?.company_size_range || job.company?.employeeCount;

  const facts = [
    { label: 'Job type', value: job.jobType || 'Not specified', icon: Briefcase },
    { label: 'Experience', value: formatExperience(job.experience), icon: Clock },
    { label: 'Salary', value: salaryText, icon: IndianRupee },
    { label: 'Work mode', value: job.workMode || 'In-office', icon: Laptop },
  ];
  const overview = [
    { label: 'Openings', value: `${job.vacancies || 1} ${job.vacancies === 1 ? 'position' : 'positions'}`, icon: Users },
    job.timings && { label: 'Timings', value: job.timings, icon: Clock },
    job.shifts && { label: 'Shift', value: job.shifts, icon: Calendar },
    { label: 'Posted', value: formatDate(job.createdAt), icon: CalendarClock },
    job.validThrough && { label: 'Apply before', value: formatDate(job.validThrough), icon: CalendarClock },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-white overflow-x-clip pb-24 lg:pb-0">
      <SEOHead title={seoTitle} description={seoDescription} path={jobPath(job)} schema={jobSchema} />

      {/* Header */}
      <header className="relative overflow-hidden bg-[#f4faf7] border-b border-emerald-100 px-6 pt-24 md:pt-28 pb-10 md:pb-12">
        <WaveLines id="job-detail-waves" />
        <div className="relative max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 shrink-0 rounded-xl bg-white ring-1 ring-zinc-200 text-zinc-500 hover:text-[#10213D] flex items-center justify-center border-none cursor-pointer transition">
              <ArrowLeft size={16} />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 min-w-0">
              <Link to="/" className="hover:text-[#1f8a57] transition-colors">Home</Link>
              <ChevronRight size={14} className="shrink-0" />
              <Link to="/jobs" className="hover:text-[#1f8a57] transition-colors">Jobs</Link>
              <ChevronRight size={14} className="shrink-0" />
              <span className="text-[#10213D] font-semibold truncate">{job.title}</span>
            </nav>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-8"
          >
            <div className="flex items-start gap-5 min-w-0">
              <CompanyLogo logo={logoUrl} name={companyName} size="w-16 h-16 md:w-20 md:h-20" />
              <div className="min-w-0">
                {job.company?.industry && (
                  <span className="inline-block rounded-lg bg-[#34B678]/10 text-[#1f8a57] px-3 py-1 text-xs font-semibold mb-3">{job.company.industry}</span>
                )}
                <h1 className="text-3xl md:text-[2.6rem] font-bold tracking-tight leading-tight text-[#10213D] m-0">{job.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm md:text-base">
                  <span className="inline-flex items-center gap-2 font-semibold text-[#10213D]">
                    <Building2 size={17} className="text-zinc-400" /> {companyName}
                    {!externalUrl && job.company?.website && (
                      <a href={job.company.website} target="_blank" rel="noopener noreferrer" aria-label="Company website" className="text-zinc-400 hover:text-[#1f8a57] transition-colors">
                        <Globe size={15} />
                      </a>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-2 font-medium text-zinc-600"><MapPin size={17} className="text-zinc-400" /> {job.location || 'Remote'}</span>
                  <span className="inline-flex items-center gap-2 font-medium text-zinc-500"><CalendarClock size={17} className="text-zinc-400" /> Posted {formatDate(job.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {canApply && (
                <button
                  type="button"
                  onClick={handleSaveJob}
                  disabled={isSaving}
                  aria-label={isJobSaved ? 'Remove from saved jobs' : 'Save job'}
                  aria-pressed={!!isJobSaved}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border-none cursor-pointer transition ring-1 ${isJobSaved ? 'bg-[#34B678]/10 ring-[#34B678]/40 text-[#1f8a57]' : 'bg-white ring-zinc-200 text-zinc-500 hover:text-[#10213D]'}`}
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Bookmark size={19} className={isJobSaved ? 'fill-[#34B678]' : ''} />}
                </button>
              )}
              <button
                type="button"
                onClick={handleShareJob}
                aria-label="Share job"
                className="w-12 h-12 rounded-xl bg-white ring-1 ring-zinc-200 text-zinc-500 hover:text-[#10213D] flex items-center justify-center border-none cursor-pointer transition"
              >
                <Share2 size={19} />
              </button>
              {canApply && (
                <button
                  type="button"
                  onClick={handleApply}
                  className="hidden lg:inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-[#34B678] hover:bg-[#2ca66b] text-white text-sm font-bold border-none cursor-pointer shadow-lg shadow-[#34B678]/30 transition"
                >
                  {externalUrl ? 'Apply on company site' : 'Apply for this job'} <ArrowRight size={16} />
                </button>
              )}
            </div>
          </motion.div>

          {/* Key facts */}
          <div className="mt-9 grid grid-cols-2 md:grid-cols-4 gap-3">
            {facts.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl bg-white ring-1 ring-zinc-200/80 p-4 md:p-5">
                <p className="m-0 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <Icon size={15} className="text-[#34B678]" /> {label}
                </p>
                <p className={`m-0 mt-2 font-bold text-sm md:text-base ${label === 'Salary' && !salaryShown ? 'text-zinc-500' : 'text-[#10213D]'}`}>{value}</p>
                {label === 'Salary' && user?.role === 'jobseeker' && (
                  <button type="button" onClick={handleSalaryBenchmarking} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#1f8a57] hover:underline bg-transparent border-none p-0 cursor-pointer">
                    <TrendingUp size={13} /> Compare salary
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-10 md:py-14 grid lg:grid-cols-3 gap-8 lg:gap-10 items-start">
        <main className="lg:col-span-2 space-y-8 min-w-0">
          {/* AI match (jobseekers only) */}
          {user && user.role === 'jobseeker' && (
            <section className="relative overflow-hidden rounded-[1.75rem] bg-[#10213D] text-white p-6 md:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <Rings opacity={0.25} className="-right-16 -top-16 w-56 h-56" />
              <div className="relative flex-1">
                <p className="m-0 flex items-center gap-2 text-sm font-bold text-[#34B678]"><Sparkles size={16} /> AI profile match</p>
                <p className="m-0 mt-2 text-sm text-white/80 leading-relaxed">
                  {matchAnalysis ? matchAnalysis.verdict : 'See how well your skills fit this role before you apply.'}
                </p>
              </div>
              <div className="relative shrink-0">
                {matchAnalysis ? (
                  <p className="m-0 text-center">
                    <span className={`block text-4xl font-bold ${matchAnalysis.matchPercentage >= 75 ? 'text-[#34B678]' : matchAnalysis.matchPercentage >= 50 ? 'text-amber-300' : 'text-rose-300'}`}>
                      {matchAnalysis.matchPercentage}%
                    </span>
                    <span className="text-xs font-semibold text-white/60">match</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleCalculateMatch}
                    disabled={isCalculatingMatch}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#34B678] hover:bg-[#2ca66b] disabled:opacity-70 text-white text-sm font-bold border-none cursor-pointer transition"
                  >
                    {isCalculatingMatch ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {isCalculatingMatch ? 'Checking…' : 'Check my match'}
                  </button>
                )}
              </div>
            </section>
          )}

          <section className="rounded-[1.75rem] bg-white ring-1 ring-zinc-200/80 p-6 md:p-8">
            <SectionTitle>Job description</SectionTitle>
            <FormattedDescription text={job.description} />
          </section>

          {job.skillsRequired?.length > 0 && (
            <section className="rounded-[1.75rem] bg-white ring-1 ring-zinc-200/80 p-6 md:p-8">
              <SectionTitle>Skills required</SectionTitle>
              <ul className="flex flex-wrap gap-2.5 p-0 m-0 list-none">
                {job.skillsRequired.map((skill, i) => (
                  <li key={i} className="rounded-lg bg-[#f4faf7] ring-1 ring-emerald-100 px-3.5 py-2 text-sm font-semibold text-[#10213D]">{skill}</li>
                ))}
              </ul>
            </section>
          )}

          {job.additionalDetails?.length > 0 && (
            <section className="rounded-[1.75rem] bg-white ring-1 ring-zinc-200/80 p-6 md:p-8">
              <SectionTitle>More details</SectionTitle>
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5 m-0">
                {job.additionalDetails.map((detail, index) => (
                  <div key={detail._id || index} className="border-l-2 border-[#34B678] pl-4">
                    <dt className="text-xs font-semibold text-zinc-500">{detail.key}</dt>
                    <dd className="m-0 mt-1 font-semibold text-[#10213D] leading-relaxed">{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </main>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="rounded-[1.75rem] bg-white p-2 ring-1 ring-zinc-200 shadow-[0_24px_60px_-36px_rgba(16,33,61,0.4)]">
            <div className="relative overflow-hidden rounded-[1.4rem] bg-[#f4faf7] p-6">
              <Rings />
              <p className="relative m-0 text-xs font-semibold text-zinc-500">Salary</p>
              <p className={`relative m-0 mt-1 text-3xl font-bold tracking-tight ${salaryShown ? 'text-[#10213D]' : 'text-zinc-500'}`}>{salaryText}</p>
              {canApply && (
                <button
                  type="button"
                  onClick={handleApply}
                  className="relative mt-5 w-full h-12 rounded-xl bg-[#34B678] hover:bg-[#2ca66b] text-white text-sm font-bold border-none cursor-pointer shadow-lg shadow-[#34B678]/30 flex items-center justify-center gap-2 transition"
                >
                  {externalUrl ? 'Apply on company site' : 'Apply now'} <ArrowRight size={16} />
                </button>
              )}
              {externalUrl && (
                <p className="relative m-0 mt-3 text-xs font-medium text-zinc-600 leading-relaxed">
                  You will leave Velaivaaipu to apply{job.externalApply?.sourceName ? ` (${job.externalApply.sourceName})` : ''}. The employer handles your application. Never pay anyone to get a job.
                </p>
              )}
            </div>
            <dl className="px-5 py-5 space-y-4 m-0">
              {overview.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-[#34B678]/10 text-[#1f8a57] flex items-center justify-center shrink-0"><Icon size={16} /></span>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-zinc-500">{label}</dt>
                    <dd className="m-0 text-sm font-bold text-[#10213D]">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* A job found on the web shows the real employer only, not our host company. */}
          {!externalUrl && (
          <div className="rounded-[1.75rem] bg-white ring-1 ring-zinc-200/80 p-6">
            <h3 className="text-base font-bold text-[#10213D] m-0 mb-5">About the company</h3>
            <div className="flex items-center gap-4">
              <CompanyLogo logo={logoUrl} name={companyName} size="w-14 h-14" fontSize={22} />
              <div className="min-w-0">
                <p className="m-0 font-bold text-[#10213D] truncate">{companyName}</p>
                <p className="m-0 text-sm text-zinc-500 truncate">{job.company?.location || job.location || 'India'}</p>
              </div>
            </div>
            {aboutCompany && <p className="m-0 mt-5 text-sm text-zinc-600 leading-relaxed line-clamp-5">{aboutCompany}</p>}
            {(companySize || job.company?.industry) && (
              <dl className="mt-5 grid grid-cols-2 gap-3 m-0">
                {job.company?.industry && (
                  <div className="rounded-xl bg-[#f4faf7] p-3 min-w-0">
                    <dt className="text-xs text-zinc-500">Industry</dt>
                    <dd className="m-0 mt-0.5 text-sm font-bold text-[#10213D] truncate">{job.company.industry}</dd>
                  </div>
                )}
                {companySize && (
                  <div className="rounded-xl bg-[#f4faf7] p-3 min-w-0">
                    <dt className="text-xs text-zinc-500">Team size</dt>
                    <dd className="m-0 mt-0.5 text-sm font-bold text-[#10213D] truncate">{companySize}</dd>
                  </div>
                )}
              </dl>
            )}
            {job.company?.website && (
              <a
                href={job.company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-between h-11 px-4 rounded-xl ring-1 ring-zinc-200 text-sm font-semibold text-[#10213D] hover:ring-[#34B678]/60 hover:text-[#1f8a57] transition"
              >
                Visit website <Globe size={16} />
              </a>
            )}
          </div>
          )}

          <div className="rounded-[1.75rem] bg-amber-50 ring-1 ring-amber-100 p-6">
            <p className="m-0 flex items-center gap-2 text-sm font-bold text-amber-900"><ShieldCheck size={17} className="text-amber-600" /> Stay safe</p>
            <p className="m-0 mt-2 text-sm text-amber-900/80 leading-relaxed">
              Never share bank or card details when applying. Velaivaaipu never charges job seekers to apply.
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile apply bar */}
      {canApply && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-zinc-200 px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs text-zinc-500 truncate">{companyName}</p>
            <p className={`m-0 text-sm font-bold truncate ${salaryShown ? 'text-[#10213D]' : 'text-zinc-500'}`}>{salaryText}</p>
          </div>
          <button
            type="button"
            onClick={handleApply}
            className="h-12 px-6 rounded-xl bg-[#34B678] hover:bg-[#2ca66b] text-white text-sm font-bold border-none cursor-pointer shadow-lg shadow-[#34B678]/30 inline-flex items-center gap-2"
          >
            {externalUrl ? 'Apply on company site' : 'Apply now'} <ArrowRight size={16} />
          </button>
        </div>
      )}

      <Footer />

      <Dialog open={showProfileNudge} onOpenChange={setShowProfileNudge}>
        <DialogContent className="max-w-sm rounded-2xl p-6">
          <DialogTitle className="text-lg font-bold text-slate-900">Strengthen your profile first?</DialogTitle>
          <DialogDescription className="text-sm text-slate-600 mt-1">
            Your profile is {user?.profile?.profileCompletion ?? 0}% complete. A complete profile is easier for employers to assess. It takes a few minutes.
          </DialogDescription>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => { setShowProfileNudge(false); setIsApplyModalOpen(true); }}>Apply anyway</Button>
            <Button className="flex-1" onClick={() => { setShowProfileNudge(false); navigate('/candidate/settings'); }}>Complete profile</Button>
          </div>
        </DialogContent>
      </Dialog>

      <JobApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        job={job}
        user={user}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        jobTitle={job.title}
        companyName={job.company?.name}
        shareUrl={window.location.href}
      />
    </div>
  );
};

export default JobDetails;
