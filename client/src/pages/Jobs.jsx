import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Briefcase, IndianRupee, Clock, Loader2,
  SlidersHorizontal, X, ArrowRight, Building2, ChevronDown, ChevronUp, ChevronRight, Star
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { fuzzySearch, matchesForKey, tokenize } from '../utils/fuzzySearch';
import HighlightText from '../components/shared/HighlightText';
import SEOHead from '../components/seo/SEOHead';

const SEARCH_FIELD_LABELS = {
  title: 'Job Title',
  'company.name': 'Company',
  location: 'Location',
  description: 'Description',
  skillsRequired: 'Skills',
};

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
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Salary: High to Low', value: 'salary_desc' },
  { label: 'Salary: Low to High', value: 'salary_asc' },
];

// Hand-drawn abstract green wave/blob illustration used as the Jobs hero background image
// (data-URI SVG so no external asset file is needed).
const HERO_BG_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="700" viewBox="0 0 1600 700">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eafff6" />
      <stop offset="55%" stop-color="#f4fdf9" />
      <stop offset="100%" stop-color="#dffaee" />
    </linearGradient>
  </defs>
  <rect width="1600" height="700" fill="url(#base)" />
  <circle cx="1420" cy="90" r="260" fill="#a7f3d0" opacity="0.35" />
  <circle cx="1300" cy="360" r="180" fill="#6ee7b7" opacity="0.25" />
  <circle cx="120" cy="620" r="220" fill="#99f6e4" opacity="0.35" />
  <path d="M0,520 C280,420 420,620 720,540 C1020,460 1180,600 1600,480 L1600,700 L0,700 Z" fill="#5eead4" opacity="0.18" />
  <path d="M0,560 C320,500 500,660 820,580 C1120,500 1300,640 1600,560 L1600,700 L0,700 Z" fill="#10b981" opacity="0.12" />
  <g opacity="0.5">
    ${Array.from({ length: 8 }).map((_, row) =>
      Array.from({ length: 20 }).map((__, col) =>
        `<circle cx="${col * 42 + 900}" cy="${row * 42 + 40}" r="1.6" fill="#10b981" opacity="0.35" />`
      ).join('')
    ).join('')}
  </g>
</svg>`.trim();

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
      .then(res => setJobs(res.data))
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
  const jobsMetaTitle = loading
    ? `Latest Jobs in ${searchedLocation || 'Tamil Nadu'} | Velaivaaipu`
    : searchedLocation
      ? `${filteredJobs.length} Latest Jobs in ${searchedLocation} | Velaivaaipu`
      : `${filteredJobs.length} Latest Jobs in Tamil Nadu | Velaivaaipu`;
  const jobCoreAreas = getJobCoreAreas(filteredJobs);
  const metaLocation = searchedLocation ? `in ${searchedLocation}` : 'across Tamil Nadu';
  const metaTail = 'Fresher and experienced roles from verified companies. Apply free.';
  let jobsMetaDescription = `${filteredJobs.length}+ jobs ${metaLocation}. Latest private-sector openings. ${metaTail}`;
  for (let areaCount = jobCoreAreas.length; areaCount > 0; areaCount -= 1) {
    const candidate = `${filteredJobs.length}+ jobs ${metaLocation}. ${jobCoreAreas.slice(0, areaCount).join(', ')} openings. ${metaTail}`;
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

  const FilterPanel = () => (
    <div className="space-y-7">
      {/* Job Type */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-3">Job Type</p>
        <div className="flex flex-wrap gap-2">
          {(showAllTypes ? JOB_TYPES : JOB_TYPES.slice(0, 4)).map(type => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-3.5 py-1.5 rounded-none text-xs font-semibold border transition-all ${
                selectedTypes.includes(type)
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {JOB_TYPES.length > 4 && (
          <button
            onClick={() => setShowAllTypes(v => !v)}
            className="mt-3 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            {showAllTypes ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Show more</>}
          </button>
        )}
      </div>

      <div className="h-px bg-slate-100" />

      {/* Salary Range */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-3">Salary Range</p>
        <div className="flex flex-col gap-1">
          {SALARY_RANGES.map((range, i) => (
            <button
              key={i}
              onClick={() => setSelectedSalary(i)}
              className={`text-left px-3 py-2 rounded-none text-sm font-medium transition-all ${
                selectedSalary === i
                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Experience Range */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-3">Experience</p>
        <div className="flex flex-col gap-1">
          {EXPERIENCE_RANGES.map((range, i) => (
            <button
              key={i}
              onClick={() => setSelectedExperience(i)}
              className={`text-left px-3 py-2 rounded-none text-sm font-medium transition-all ${
                selectedExperience === i
                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full h-11 rounded-none border border-red-100 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
        >
          <X size={14} /> Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
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

      {/* Top Hero Bar */}
      <div
        className="relative overflow-hidden pt-8 pb-20 px-6"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(HERO_BG_SVG)}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Fade so the illustration stays visible on the right while text on the left stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/55 to-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mb-8">
            <Link to="/" className="hover:text-[#00b87d] transition-colors">Home</Link>
            <ChevronRight size={12} className="text-zinc-400" />
            <span className="text-zinc-800">Jobs</span>
          </nav>

          <p className="text-sm font-semibold text-[#00D492] tracking-wide mb-3">
            {loading ? 'Loading opportunities...' : `${jobs.length} open positions from top companies`}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-3 tracking-tight leading-[1.12]">
            Find your next <span className="text-[#00D492]">opportunity</span>
          </h1>
          <p className="text-zinc-500 text-sm font-normal max-w-md leading-relaxed mb-8">
            Browse thousands of jobs from verified companies across Tamil Nadu and beyond.
          </p>

          {/* Search Bar */}
          <div className="bg-white border border-zinc-100 rounded-2xl p-2 flex flex-col md:flex-row gap-2 max-w-3xl shadow-xl shadow-[#00D492]/10">
            <div className="flex items-center gap-3 flex-1 px-4 py-3">
              <Search size={18} className="text-[#00D492] shrink-0" />
              <input
                type="text"
                placeholder="Job Title, Keywords"
                className="flex-1 bg-transparent outline-none text-zinc-800 font-medium placeholder:text-zinc-400 text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-slate-300 hover:text-slate-500">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="w-px bg-zinc-200 hidden md:block my-2" />

            <div className="flex items-center gap-3 flex-1 px-4 py-3">
              <MapPin size={18} className="text-[#00D492] shrink-0" />
              <input
                type="text"
                placeholder="City or Remote"
                className="flex-1 bg-transparent outline-none text-zinc-800 font-medium placeholder:text-zinc-400 text-sm"
                value={locationTerm}
                onChange={e => setLocationTerm(e.target.value)}
              />
              {locationTerm && (
                <button onClick={() => setLocationTerm('')} className="text-slate-300 hover:text-slate-500">
                  <X size={16} />
                </button>
              )}
            </div>

            <Button className="h-12 rounded-xl px-8 text-sm font-bold bg-[#00D492] hover:bg-[#00b87d] text-white shadow-sm transition-all shrink-0 cursor-pointer">
              Find Job
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 pt-8">
            <div className="bg-white rounded-none border border-slate-100 shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-emerald-500" /> Filters
                </p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-[11px] text-red-500 font-bold hover:text-red-600">
                    Clear all
                  </button>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 pt-8 min-w-0">

            {/* Active filter chips */}
            {(selectedTypes.length > 0 || selectedSalary > 0 || selectedExperience > 0) && (
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedTypes.map(t => (
                  <Badge key={t} className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-none px-3 py-1 text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => toggleType(t)}>
                    {t} <X size={11} className="ml-1.5" />
                  </Badge>
                ))}
                {selectedSalary > 0 && (
                  <Badge className="bg-amber-50 text-amber-700 border border-amber-200 rounded-none px-3 py-1 text-xs font-semibold cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => setSelectedSalary(0)}>
                    {SALARY_RANGES[selectedSalary].label} <X size={11} className="ml-1.5" />
                  </Badge>
                )}
                {selectedExperience > 0 && (
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 rounded-none px-3 py-1 text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setSelectedExperience(0)}>
                    {EXPERIENCE_RANGES[selectedExperience].label} <X size={11} className="ml-1.5" />
                  </Badge>
                )}
              </div>
            )}

            {/* Sort + Mobile Filter bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                {user && user.role === 'jobseeker' && (
                  <div className="flex bg-slate-200/50 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      All Jobs
                    </button>
                    <button
                      onClick={() => setActiveTab('matched')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${activeTab === 'matched' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Star size={12} className={activeTab === 'matched' ? 'fill-white' : ''} />
                      For You
                    </button>
                  </div>
                )}
                <p className="text-sm font-semibold text-slate-500 hidden md:block">
                  Showing <span className="text-slate-900 font-bold">{filteredJobs.length}</span> results
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 h-9 px-4 rounded-none bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:border-emerald-300 transition-colors"
                >
                  <SlidersHorizontal size={14} /> Filters
                  {hasActiveFilters && <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">{selectedTypes.length + (selectedSalary > 0 ? 1 : 0) + (selectedExperience > 0 ? 1 : 0)}</span>}
                </button>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="h-9 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold outline-none cursor-pointer hover:border-emerald-300 transition-colors"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-24">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-slate-500 font-semibold text-sm">Loading opportunities...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
                <Briefcase size={40} className="text-slate-200 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">No matching jobs found</h3>
                <p className="text-slate-400 text-sm mb-6">Try adjusting your search or clearing filters</p>
                <Button onClick={clearFilters} variant="outline" className="h-10 px-6 rounded-xl border-emerald-200 text-emerald-600 font-bold hover:bg-emerald-50">
                  Clear Filters
                </Button>
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
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link
                        to={`/job/${job._id}`}
                        className={`group relative block bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 p-6 pl-7 overflow-hidden ${
                          job.isPriority ? 'border-amber-200' : 'border-slate-100 hover:border-emerald-200'
                        }`}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${job.isPriority ? 'bg-amber-400' : 'bg-slate-100 group-hover:bg-emerald-400'} transition-colors`} />

                        <div className="flex items-start gap-5">
                          {/* Logo */}
                          <div className="w-14 h-14 rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden shrink-0 group-hover:border-emerald-200 transition-colors">
                            {job.company?.logo ? (
                              <img src={`${API_DOMAIN}${job.company.logo}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xl">
                                {job.company?.name?.[0] || 'J'}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                                    <HighlightText text={job.title} ranges={matchesForKey(job._fuzzyMatches, 'title')} />
                                  </h3>
                                  {job.isPriority && (
                                    <span title="Priority Hiring Partner" className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                                      <Star size={9} className="fill-amber-500 text-amber-500" /> Priority
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-500 text-sm font-medium mt-0.5 flex items-center gap-1.5">
                                  <Building2 size={13} className="text-slate-400" />
                                  <HighlightText text={job.company?.name} ranges={matchesForKey(job._fuzzyMatches, 'company.name')} />
                                </p>
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-sm bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                                  <IndianRupee size={13} />{formatSalary(job.salary)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-4">
                              <Badge className="bg-slate-100 text-slate-600 border-none text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-slate-100">
                                <MapPin size={11} className="mr-1" />
                                <HighlightText text={job.location || 'Remote'} ranges={matchesForKey(job._fuzzyMatches, 'location')} />
                              </Badge>
                              {job.jobType && (
                                <Badge className="bg-blue-50 text-blue-700 border-none text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-blue-50">
                                  {job.jobType}
                                </Badge>
                              )}
                              {job.experienceLevel && (
                                <Badge className="bg-violet-50 text-violet-700 border-none text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-violet-50">
                                  {job.experienceLevel}
                                </Badge>
                              )}
                              {/* Fields that matched but aren't otherwise shown on this card (description,
                                  skills) — surfaces *why* a result came up even when the matched text itself
                                  isn't visible here. */}
                              {(job._fuzzyMatches || [])
                                .map(m => SEARCH_FIELD_LABELS[m.key])
                                .filter(label => label && label !== 'Job Title' && label !== 'Company' && label !== 'Location')
                                .filter((label, i, arr) => arr.indexOf(label) === i)
                                .map(label => (
                                  <Badge key={label} className="bg-amber-50 text-amber-700 border-none text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-amber-50">
                                    Matched in {label}
                                  </Badge>
                                ))}
                              <span className="flex items-center text-slate-400 text-[11px] font-semibold ml-auto">
                                <Clock size={12} className="mr-1.5" />
                                {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-emerald-500 transition-colors shrink-0 mt-2">
                            <ArrowRight size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                          </div>
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

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 left-0 h-full w-80 bg-white z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
                <p className="font-bold text-slate-900 flex items-center gap-2"><SlidersHorizontal size={16} className="text-emerald-500" /> Filters</p>
                <button onClick={() => setMobileFiltersOpen(false)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <FilterPanel />
                <Button onClick={() => setMobileFiltersOpen(false)} className="w-full h-12 mt-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold">
                  Show {filteredJobs.length} Results
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Jobs;
