import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { trackShown, trackClick } from '../utils/recommendationEvents';
import {
  Search, MapPin, Briefcase, IndianRupee, Clock, Loader2,
  SlidersHorizontal, X, ArrowRight, ChevronDown, ChevronUp, ChevronRight, Star, Sparkles, Banknote
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { fuzzySearch, matchesForKey, tokenize } from '../utils/fuzzySearch';
import HighlightText from '../components/shared/HighlightText';
import SEOHead from '../components/seo/SEOHead';
import { jobPath } from '../utils/jobUrl';
import { getCityIntro, CITY_LINKS } from '../data/cityJobIntros';
import WaveLines from '@/components/common/WaveLines';
import Footer from '@/components/home/Footer';

const SEARCH_FIELD_LABELS = {
  title: 'Job Title',
  'company.name': 'Company',
  location: 'Location',
  description: 'Description',
  skillsRequired: 'Skills',
};

// Soft label colours for the job card tag, picked from the label text so it stays stable.
const LABEL_TONES = [
  'bg-[#34B678]/10 text-[#1f8a57]',
  'bg-[#10213D]/[0.07] text-[#10213D]',
  'bg-amber-50 text-amber-700',
  'bg-sky-50 text-sky-700',
];
// Job descriptions can hold HTML from the editor; the card shows a one-line plain-text preview.
const plainText = (html) => (html ? String(html).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '');

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Freelance'];
const SALARY_RANGES = [
  { label: 'Any', min: 0, max: Infinity },
  { label: 'Under ₹3 LPA', min: 0, max: 300000 },
  { label: '₹3–6 LPA', min: 300000, max: 600000 },
  { label: '₹6–12 LPA', min: 600000, max: 1200000 },
  { label: '₹12–20 LPA', min: 1200000, max: 2000000 },
  { label: '₹20 LPA+', min: 2000000, max: Infinity },
];
const EXPERIENCE_RANGES = [
  { label: 'Any', min: 0, max: Infinity },
  { label: 'Fresher (0 Years)', min: 0, max: 0 },
  { label: '1–3 Years', min: 1, max: 3 },
  { label: '3–5 Years', min: 3, max: 5 },
  { label: '5–10 Years', min: 5, max: 10 },
  { label: '10+ Years', min: 10, max: Infinity },
];
// Only offered on the "Matched for you" tab, where the server already ranks by relevance.
const BEST_MATCH_OPTION = { label: 'Best match', value: 'relevance' };
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Salary: High to Low', value: 'salary_desc' },
  { label: 'Salary: Low to High', value: 'salary_asc' },
];

const JOB_CORE_AREAS = [
  ['IT and software', /\b(it|software|developer|programmer|web|frontend|backend|full.?stack|python|java|react|tech support|network)\b/i],
  ['engineering', /\b(engineer|engineering|mechanical|civil|electrical|electronics|quality|production)\b/i],
  ['manufacturing', /\b(manufactur|factory|plant|machine|operator|assembly)\b/i],
  ['textiles and garments', /\b(textile|garment|apparel|knitwear|merchandis|fashion)\b/i],
  ['sales and marketing', /\b(sales|marketing|business development|seo|social media|advertis)\b/i],
  ['accounts and finance', /\b(account|finance|bank|tally|audit|billing|gst)\b/i],
  ['customer support and BPO', /\b(customer|support|bpo|voice process|call cent|telecaller)\b/i],
  ['healthcare', /\b(health|hospital|nurs|medical|pharma|clinic)\b/i],
  ['education', /\b(teacher|teaching|education|trainer|faculty|school|college)\b/i],
  ['logistics and delivery', /\b(logistic|warehouse|delivery|driver|transport|supply chain)\b/i],
  ['hospitality and tourism', /\b(hotel|restaurant|hospitality|tourism|chef|steward|front office)\b/i],
  ['HR and administration', /\b(hr|human resource|recruit|admin|office assistant)\b/i],
];

const getJobCoreAreas = (matchingJobs) => {
  const searchableJobs = matchingJobs.map(job => [
    job.title,
    job.description,
    job.company?.industry,
    ...(job.skillsRequired || []),
  ].filter(Boolean).join(' '));

  return JOB_CORE_AREAS
    .map(([label, pattern], order) => ({
      label,
      order,
      count: searchableJobs.filter(value => pattern.test(value)).length,
    }))
    .filter(area => area.count > 0)
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, 4)
    .map(area => area.label);
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { location: routeLocation } = useParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [locationTerm, setLocationTerm] = useState(searchParams.get('loc') || (routeLocation ? decodeURIComponent(routeLocation).replace(/-/g, ' ') : ''));
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSalary, setSelectedSalary] = useState(0);
  const [selectedExperience, setSelectedExperience] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'matched' ? 'matched' : 'all'); // 'all' or 'matched'
  
  const { user } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

  useEffect(() => {
    setLoading(true);
    const endpoint = activeTab === 'matched' && user && user.role === 'jobseeker' 
      ? `${API_BASE_URL}/jobs/matching` 
      : `${API_BASE_URL}/jobs`;
      
    const headers = activeTab === 'matched' ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {};

    axios.get(endpoint, { headers })
      .then(res => {
        setJobs(res.data);
        // Keep the server's relevance order on the matched tab; the explicit sort control still overrides it.
        if (activeTab === 'matched' && res.data?.[0]?.relevance) {
          setSortBy('relevance');
          trackShown('jobs_matched', res.data.filter((j) => j.relevance).map((j) => ({ jobId: j._id, score: j.relevance.score })));
        }
        else setSortBy(prev => (prev === 'relevance' ? 'newest' : prev));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [API_BASE_URL, activeTab, user]);

  const salaryRange = SALARY_RANGES[selectedSalary];
  const expRange = EXPERIENCE_RANGES[selectedExperience];

  const filteredJobs = useMemo(() => {
    // Fuzzy, typo-tolerant, substring-anywhere matching (not exact-word) across the job title,
    // company, description, and skills — a single-letter typo like "pondicheryd" still finds
    // "Pondicherry". Each surviving job carries `_fuzzyMatches` for the highlight rendering below.
    let ranked = searchTerm.trim()
      ? fuzzySearch(jobs, searchTerm, [
          { name: 'title', weight: 3 },
          { name: 'company.name', weight: 2 },
          { name: 'skillsRequired', weight: 2, getFn: job => tokenize(job.skillsRequired) },
          { name: 'description', weight: 1, getFn: job => tokenize(job.description) },
          { name: 'location', weight: 1 },
        ])
      : jobs.map(job => ({ ...job, _fuzzyMatches: [] }));

    if (locationTerm.trim()) {
      // fuzzySearch overwrites `_fuzzyMatches` with this pass's own matches, so the search-term
      // box's matches (captured above) need to be saved first and merged back in afterward —
      // both boxes should be able to highlight independently once a job survives both filters.
      const searchMatchesById = new Map(ranked.map(job => [job._id, job._fuzzyMatches]));
      ranked = fuzzySearch(ranked, locationTerm, ['location']).map(job => ({
        ...job,
        _fuzzyMatches: [...(searchMatchesById.get(job._id) || []), ...(job._fuzzyMatches || [])],
      }));
    }

    let result = ranked.filter(job => {
      const matchesType = selectedTypes.length === 0 ||
        selectedTypes.some(type => job.jobType?.includes(type));

      const jobMin = job.salary?.min || 0;
      const matchesSalary = selectedSalary === 0 ||
        (jobMin >= salaryRange.min && jobMin <= salaryRange.max);

      const jobExpMin = job.experience?.min || 0;
      const jobExpMax = job.experience?.max || 0;
      const matchesExperience = selectedExperience === 0 ||
        (jobExpMin <= expRange.max && (jobExpMax >= expRange.min || jobExpMax === 0 || !jobExpMax));

      return matchesType && matchesSalary && matchesExperience;
    });

    // A search term implies relevance ranking already did the ordering (best match first);
    // otherwise fall back to the explicit sort control.
    if (!searchTerm.trim()) {
      result = [...result].sort((a, b) => {
        if (sortBy === 'relevance') return 0; // keep the server's order (stable sort)
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'salary_desc') return (b.salary?.min || 0) - (a.salary?.min || 0);
        if (sortBy === 'salary_asc') return (a.salary?.min || 0) - (b.salary?.min || 0);
        return 0;
      });
    }

    return result;
  }, [jobs, searchTerm, locationTerm, selectedTypes, selectedSalary, selectedExperience, sortBy]);

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationTerm('');
    setSelectedTypes([]);
    setSelectedSalary(0);
    setSelectedExperience(0);
    setSortBy('newest');
  };

  const hasActiveFilters = searchTerm || locationTerm || selectedTypes.length > 0 || selectedSalary > 0 || selectedExperience > 0;

  const searchedLocation = locationTerm.trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
  const cityIntro = getCityIntro(routeLocation);
  const metaPlace = searchedLocation || 'Tamil Nadu';
  const jobsMetaTitle = loading
    ? `Latest Job Vacancies in ${metaPlace} | Velaivaaipu`
    : `Latest Job Vacancies in ${metaPlace} – ${filteredJobs.length} Jobs | Velaivaaipu`;
  const jobCoreAreas = getJobCoreAreas(filteredJobs);
  const metaCount = loading ? 'the' : `${filteredJobs.length}+`;
  const metaTail = 'for freshers and experienced candidates. Apply online for free today.';
  let jobsMetaDescription = `Browse ${metaCount} latest job vacancies in ${metaPlace} for freshers and experienced candidates. Filter by role and salary, then apply online for free today.`;
  for (let areaCount = Math.min(jobCoreAreas.length, 2); areaCount > 0; areaCount -= 1) {
    const candidate = `Browse ${metaCount} latest job vacancies in ${metaPlace}, including ${jobCoreAreas.slice(0, areaCount).join(' and ')} roles, ${metaTail}`;
    if (candidate.length <= 155) {
      jobsMetaDescription = candidate;
      break;
    }
  }

  const formatSalary = (salary) => {
    if (!salary || salary.isRangeHidden) return 'Not Disclosed';
    if (salary.min && salary.max) return `₹${(salary.min / 100000).toFixed(1)}–${(salary.max / 100000).toFixed(1)} LPA`;
    if (salary.min) return `₹${(salary.min / 100000).toFixed(1)}+ LPA`;
    return 'Competitive';
  };

  const activeFilterCount = selectedTypes.length + (selectedSalary > 0 ? 1 : 0) + (selectedExperience > 0 ? 1 : 0);

  const OptionList = ({ options, selected, onSelect, name }) => (
    <div className="flex flex-col gap-0.5" role="radiogroup" aria-label={name}>
      {options.map((range, i) => {
        const active = selected === i;
        return (
          <button
            key={range.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(i)}
            className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-xl text-sm transition-colors border-none cursor-pointer ${
              active ? 'bg-[#34B678]/10 text-[#10213D] font-semibold' : 'bg-transparent text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-[#34B678]' : 'border-zinc-300'}`}>
              {active && <span className="w-2 h-2 rounded-full bg-[#34B678]" />}
            </span>
            {range.label}
          </button>
        );
      })}
    </div>
  );

  const FilterPanel = () => (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-bold text-[#10213D] uppercase tracking-[0.15em] mb-3">Job type</p>
        <div className="flex flex-wrap gap-2">
          {(showAllTypes ? JOB_TYPES : JOB_TYPES.slice(0, 4)).map(type => {
            const active = selectedTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => toggleType(type)}
                className={`h-9 px-3.5 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                  active
                    ? 'bg-[#34B678] border-[#34B678] text-white shadow-sm shadow-[#34B678]/25'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:border-[#34B678]/60 hover:text-[#10213D]'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
        {JOB_TYPES.length > 4 && (
          <button
            type="button"
            onClick={() => setShowAllTypes(v => !v)}
            className="mt-3 text-xs font-bold text-[#34B678] hover:text-[#1f8a57] flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
          >
            {showAllTypes ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show more</>}
          </button>
        )}
      </div>

      <div className="h-px bg-zinc-100" />

      <div>
        <p className="text-xs font-bold text-[#10213D] uppercase tracking-[0.15em] mb-2">Salary</p>
        <OptionList name="Salary range" options={SALARY_RANGES} selected={selectedSalary} onSelect={setSelectedSalary} />
      </div>

      <div className="h-px bg-zinc-100" />

      <div>
        <p className="text-xs font-bold text-[#10213D] uppercase tracking-[0.15em] mb-2">Experience</p>
        <OptionList name="Experience" options={EXPERIENCE_RANGES} selected={selectedExperience} onSelect={setSelectedExperience} />
      </div>
    </div>
  );

  const chipCls = 'inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-lg bg-white ring-1 ring-zinc-200 text-xs font-semibold text-[#10213D] hover:ring-[#34B678] transition cursor-pointer border-none';

  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      <SEOHead
        title={jobsMetaTitle}
        description={jobsMetaDescription}
        path={routeLocation ? `/jobs/${routeLocation}` : '/jobs'}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: searchedLocation ? `Latest jobs in ${searchedLocation}` : 'Latest jobs in Tamil Nadu',
          numberOfItems: filteredJobs.length,
        }}
      />

      {/* Intro + search */}
      <header className="relative overflow-hidden bg-[#f4faf7] border-b border-emerald-100 px-6 pt-10 md:pt-14 pb-14 md:pb-16">
        <WaveLines id="jobs-hero-waves" />
        <div className="relative max-w-6xl mx-auto">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mb-8">
            <Link to="/" className="hover:text-[#34B678] transition-colors">Home</Link>
            <ChevronRight size={12} className="text-zinc-400" />
            <span className="text-[#10213D]">Jobs{searchedLocation ? ` in ${searchedLocation}` : ''}</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#34B678] mb-4">
              <span className="w-8 h-px bg-[#34B678]/50" />
              {loading ? 'Loading openings…' : `${jobs.length} open ${jobs.length === 1 ? 'job' : 'jobs'} right now`}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-[#10213D] max-w-3xl">
              Find your next <span className="text-[#34B678]">job{searchedLocation ? ` in ${searchedLocation}` : ''}.</span>
            </h1>
            <p className="mt-4 text-zinc-600 text-base md:text-lg leading-relaxed max-w-xl">
              Open jobs from companies across Tamil Nadu and Puducherry. Search, filter and apply for free.
            </p>
          </motion.div>

          {/* Search: results update as you type; the button just moves focus to the results */}
          <form
            role="search"
            onSubmit={(e) => { e.preventDefault(); document.getElementById('job-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
            className="mt-8 max-w-4xl bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 ring-1 ring-zinc-200 shadow-[0_24px_60px_-30px_rgba(16,33,61,0.45)]"
          >
            <label className="flex items-center gap-3 flex-1 h-12 px-4 rounded-xl hover:bg-zinc-50 focus-within:bg-zinc-50 transition-colors">
              <Search size={18} className="text-[#34B678] shrink-0" />
              <span className="sr-only">Job title or keyword</span>
              <input
                type="text"
                placeholder="Job title, skill or company"
                className="flex-1 min-w-0 bg-transparent outline-none text-zinc-900 font-medium placeholder:text-zinc-400 text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button type="button" aria-label="Clear keyword" onClick={() => setSearchTerm('')} className="text-zinc-400 hover:text-zinc-700 bg-transparent border-none cursor-pointer p-0">
                  <X size={16} />
                </button>
              )}
            </label>

            <div className="w-px bg-zinc-200 hidden md:block my-2" />

            <label className="flex items-center gap-3 flex-1 h-12 px-4 rounded-xl hover:bg-zinc-50 focus-within:bg-zinc-50 transition-colors">
              <MapPin size={18} className="text-[#34B678] shrink-0" />
              <span className="sr-only">City</span>
              <input
                type="text"
                placeholder="City or Remote"
                className="flex-1 min-w-0 bg-transparent outline-none text-zinc-900 font-medium placeholder:text-zinc-400 text-sm"
                value={locationTerm}
                onChange={e => setLocationTerm(e.target.value)}
              />
              {locationTerm && (
                <button type="button" aria-label="Clear city" onClick={() => setLocationTerm('')} className="text-zinc-400 hover:text-zinc-700 bg-transparent border-none cursor-pointer p-0">
                  <X size={16} />
                </button>
              )}
            </label>

            <button type="submit" className="home-shine relative overflow-hidden h-12 rounded-xl px-8 text-sm font-bold bg-[#34B678] hover:bg-[#2ca66b] text-white shadow-lg shadow-[#34B678]/25 transition shrink-0 cursor-pointer border-none inline-flex items-center justify-center gap-2">
              <Search size={16} /> Find jobs
            </button>
          </form>

          {/* Quick city links */}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-zinc-500 font-medium">Popular:</span>
            {CITY_LINKS.slice(0, 5).map((city) => (
              <Link key={city.slug} to={`/jobs/${city.slug}`} className="h-8 px-3 rounded-lg bg-white/70 ring-1 ring-zinc-200 text-zinc-700 font-medium inline-flex items-center hover:ring-[#34B678] hover:text-[#10213D] transition">
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <div id="job-results" className="max-w-6xl mx-auto px-6 pb-20 scroll-mt-24">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 pt-10">
            <div className="rounded-[1.5rem] bg-white ring-1 ring-zinc-200 shadow-[0_20px_50px_-36px_rgba(16,33,61,0.4)] p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex items-center justify-between mb-6">
                <p className="font-bold text-[#10213D] flex items-center gap-2 m-0">
                  <SlidersHorizontal size={16} className="text-[#34B678]" /> Filters
                </p>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="text-xs text-zinc-500 font-semibold hover:text-rose-600 bg-transparent border-none cursor-pointer p-0">
                    Clear all
                  </button>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 pt-10 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div className="flex flex-wrap items-center gap-4">
                {user && user.role === 'jobseeker' && (
                  <div className="flex bg-zinc-100 p-1 rounded-xl" role="tablist" aria-label="Which jobs to show">
                    {[{ key: 'all', label: 'All jobs' }, { key: 'matched', label: 'For you', icon: Star }].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === key}
                        onClick={() => setActiveTab(key)}
                        className={`h-9 px-4 text-sm font-semibold rounded-lg transition flex items-center gap-1.5 border-none cursor-pointer ${
                          activeTab === key ? 'bg-[#10213D] text-white shadow-sm' : 'bg-transparent text-zinc-600 hover:text-[#10213D]'
                        }`}
                      >
                        {Icon && <Icon size={13} className={activeTab === key ? 'fill-[#34B678] text-[#34B678]' : ''} />} {label}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-sm text-zinc-500 m-0" aria-live="polite">
                  {loading ? 'Loading…' : <><span className="text-[#10213D] font-bold">{filteredJobs.length}</span> {filteredJobs.length === 1 ? 'job' : 'jobs'} found</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 h-10 px-4 rounded-xl bg-white ring-1 ring-zinc-200 text-[#10213D] text-sm font-semibold hover:ring-[#34B678] transition border-none cursor-pointer"
                >
                  <SlidersHorizontal size={15} /> Filters
                  {activeFilterCount > 0 && <span className="min-w-5 h-5 px-1 rounded-md bg-[#34B678] text-white text-[11px] flex items-center justify-center font-bold">{activeFilterCount}</span>}
                </button>
                <label className="relative">
                  <span className="sr-only">Sort jobs</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="appearance-none h-10 pl-4 pr-10 rounded-xl bg-white ring-1 ring-zinc-200 border-none text-[#10213D] text-sm font-semibold outline-none cursor-pointer hover:ring-[#34B678] focus:ring-2 focus:ring-[#34B678] transition"
                  >
                    {(activeTab === 'matched' && jobs[0]?.relevance ? [BEST_MATCH_OPTION, ...SORT_OPTIONS] : SORT_OPTIONS).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </label>
              </div>
            </div>

            {/* Active filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {selectedTypes.map(t => (
                  <button key={t} type="button" onClick={() => toggleType(t)} className={chipCls} aria-label={`Remove ${t} filter`}>
                    {t} <X size={13} className="text-zinc-400" />
                  </button>
                ))}
                {selectedSalary > 0 && (
                  <button type="button" onClick={() => setSelectedSalary(0)} className={chipCls} aria-label="Remove salary filter">
                    {SALARY_RANGES[selectedSalary].label} <X size={13} className="text-zinc-400" />
                  </button>
                )}
                {selectedExperience > 0 && (
                  <button type="button" onClick={() => setSelectedExperience(0)} className={chipCls} aria-label="Remove experience filter">
                    {EXPERIENCE_RANGES[selectedExperience].label} <X size={13} className="text-zinc-400" />
                  </button>
                )}
                <button type="button" onClick={clearFilters} className="text-xs font-semibold text-zinc-500 hover:text-rose-600 bg-transparent border-none cursor-pointer px-1">
                  Clear all
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-4" role="status" aria-label="Loading jobs">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="h-36 rounded-[1.5rem] bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center py-20 px-6 rounded-[1.75rem] bg-[#f4faf7] ring-1 ring-emerald-100 text-center">
                <span className="w-12 h-12 mb-4 rounded-2xl bg-white text-[#34B678] flex items-center justify-center shadow-sm"><Briefcase size={22} /></span>
                <h3 className="text-lg font-bold text-[#10213D] m-0 mb-2">No matching jobs found</h3>
                <p className="text-zinc-600 text-sm m-0 mb-6">Try a different keyword, another city, or clear the filters.</p>
                <button type="button" onClick={clearFilters} className="h-11 px-6 rounded-xl bg-[#10213D] hover:bg-[#0b1830] text-white text-sm font-bold border-none cursor-pointer">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredJobs.map((job, i) => (
                    <motion.div
                      key={job._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: Math.min(i, 10) * 0.04 }}
                    >
                      <Link
                        to={jobPath(job)}
                        onClick={() => { if (job.relevance) trackClick('jobs_matched', { jobId: job._id, score: job.relevance.score }); }}
                        className={`group relative block rounded-[1.5rem] bg-white px-5 py-5 md:px-7 md:py-6 shadow-[0_18px_44px_-30px_rgba(16,33,61,0.4)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-28px_rgba(16,33,61,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#34B678]/30 ${
                          job.isPriority ? 'ring-1 ring-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-white hover:ring-amber-300' : 'ring-1 ring-zinc-200/80 hover:ring-[#34B678]/50'
                        }`}
                      >
                        {/* Label */}
                        <div className="flex flex-wrap items-center gap-2">
                          {(() => {
                            const label = job.company?.industry || job.jobType || 'Hiring now';
                            const tone = LABEL_TONES[[...label].reduce((a, c) => a + c.charCodeAt(0), 0) % LABEL_TONES.length];
                            return <span className={`inline-block rounded-lg px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
                          })()}
                          {job.isPriority && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-600">
                              <Star size={11} className="fill-amber-500 text-amber-500" /> Priority hiring
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 font-bold text-[#10213D] text-lg md:text-xl leading-snug m-0 group-hover:text-[#1f8a57] transition-colors">
                          <HighlightText text={job.title} ranges={matchesForKey(job._fuzzyMatches, 'title')} />
                        </h3>
                        <p className="mt-1.5 m-0 text-sm text-zinc-500 line-clamp-1">
                          <span className="font-semibold text-zinc-700">
                            <HighlightText text={job.company?.name} ranges={matchesForKey(job._fuzzyMatches, 'company.name')} />
                          </span>
                          {plainText(job.description) && <> · {plainText(job.description)}</>}
                        </p>

                        {job.relevance?.reasons?.length > 0 && (
                          <p className="mt-3 m-0 text-xs font-semibold text-[#1f8a57] bg-[#34B678]/10 rounded-lg px-3 py-2 flex items-start gap-1.5">
                            <Sparkles size={13} className="shrink-0 mt-px" /> Why this job: {job.relevance.reasons.slice(0, 3).join(' · ')}
                          </p>
                        )}

                        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-[#10213D]">
                            {job.jobType && (
                              <span className="inline-flex items-center gap-2"><Clock size={17} className="text-zinc-400" /> {job.jobType}</span>
                            )}
                            <span className="inline-flex items-center gap-2">
                              <MapPin size={17} className="text-zinc-400" />
                              <HighlightText text={job.location || 'Remote'} ranges={matchesForKey(job._fuzzyMatches, 'location')} />
                            </span>
                            <span className={`inline-flex items-center gap-2 ${formatSalary(job.salary).startsWith('₹') ? '' : 'text-zinc-500'}`}>
                              <Banknote size={17} className="text-zinc-400" /> {formatSalary(job.salary)}
                            </span>
                            {/* Fields that matched but aren't shown on this card (description, skills),
                                so the reason a result came up is still visible. */}
                            {(job._fuzzyMatches || [])
                              .map(m => SEARCH_FIELD_LABELS[m.key])
                              .filter(label => label && label !== 'Job Title' && label !== 'Company' && label !== 'Location')
                              .filter((label, idx, arr) => arr.indexOf(label) === idx)
                              .map(label => (
                                <span key={label} className="text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-md px-2 py-0.5">
                                  Matched in {label}
                                </span>
                              ))}
                          </div>
                          <span className="shrink-0 inline-flex items-center gap-2 text-sm font-bold text-[#1f8a57]">
                            View Job <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* City intro + jobs by city (SEO content for /jobs and /jobs/<city>) */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#f4faf7] ring-1 ring-emerald-100 p-7 md:p-10">
          {cityIntro && (
            <>
              <h2 className="text-2xl md:text-3xl font-bold text-[#10213D] mb-4 tracking-tight">{cityIntro.heading}</h2>
              {cityIntro.paragraphs.map((text) => (
                <p key={text.slice(0, 24)} className="text-sm md:text-base text-zinc-600 leading-relaxed mb-3 max-w-3xl">{text}</p>
              ))}
            </>
          )}
          <h2 className={`text-lg font-bold text-[#10213D] ${cityIntro ? 'mt-8' : ''} mb-4`}>Browse jobs by city</h2>
          <nav aria-label="Jobs by city" className="flex flex-wrap gap-2">
            {[{ slug: '', name: 'Tamil Nadu' }, ...CITY_LINKS].map((city) => {
              const active = (routeLocation || '') === city.slug;
              return (
                <Link
                  key={city.slug || 'all'}
                  to={city.slug ? `/jobs/${city.slug}` : '/jobs'}
                  aria-current={active ? 'page' : undefined}
                  className={`h-10 px-4 rounded-xl inline-flex items-center gap-1.5 text-sm font-medium transition ${
                    active ? 'bg-[#10213D] text-white' : 'bg-white ring-1 ring-zinc-200 text-zinc-700 hover:ring-[#34B678] hover:text-[#10213D]'
                  }`}
                >
                  <MapPin size={14} className={active ? 'text-[#34B678]' : 'text-zinc-400'} /> Jobs in {city.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      <Footer />

      {/* Mobile filters drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#10213D]/40 z-[60] lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 max-h-[88vh] rounded-t-[1.75rem] bg-white z-[61] shadow-2xl flex flex-col lg:hidden"
            >
              <div className="px-6 pt-3 pb-4 border-b border-zinc-100">
                <span className="block mx-auto w-10 h-1 rounded-full bg-zinc-200 mb-4" aria-hidden="true" />
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[#10213D] flex items-center gap-2 m-0"><SlidersHorizontal size={16} className="text-[#34B678]" /> Filters</p>
                  <button type="button" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors border-none cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <FilterPanel />
              </div>
              <div className="p-4 border-t border-zinc-100 flex gap-3">
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="h-12 px-5 rounded-xl bg-white ring-1 ring-zinc-200 text-[#10213D] text-sm font-semibold border-none cursor-pointer">
                    Clear
                  </button>
                )}
                <button type="button" onClick={() => setMobileFiltersOpen(false)} className="flex-1 h-12 rounded-xl bg-[#34B678] hover:bg-[#2ca66b] text-white text-sm font-bold border-none cursor-pointer">
                  Show {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Jobs;
