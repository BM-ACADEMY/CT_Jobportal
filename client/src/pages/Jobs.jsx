import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Briefcase, IndianRupee, Clock, Loader2,
  SlidersHorizontal, X, ArrowRight, Building2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Freelance'];
const SALARY_RANGES = [
  { label: 'Any', min: 0, max: Infinity },
  { label: 'Under ₹3 LPA', min: 0, max: 300000 },
  { label: '₹3–6 LPA', min: 300000, max: 600000 },
  { label: '₹6–12 LPA', min: 600000, max: 1200000 },
  { label: '₹12–20 LPA', min: 1200000, max: 2000000 },
  { label: '₹20 LPA+', min: 2000000, max: Infinity },
];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Salary: High to Low', value: 'salary_desc' },
  { label: 'Salary: Low to High', value: 'salary_asc' },
];

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [locationTerm, setLocationTerm] = useState(searchParams.get('loc') || '');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSalary, setSelectedSalary] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showAllTypes, setShowAllTypes] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

  useEffect(() => {
    axios.get(`${API_BASE_URL}/jobs`)
      .then(res => setJobs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [API_BASE_URL]);

  const salaryRange = SALARY_RANGES[selectedSalary];

  const filteredJobs = useMemo(() => {
    let result = jobs.filter(job => {
      const matchesSearch =
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation = !locationTerm ||
        job.location?.toLowerCase().includes(locationTerm.toLowerCase());

      const matchesType = selectedTypes.length === 0 ||
        selectedTypes.includes(job.jobType);

      const jobMin = job.salary?.min || 0;
      const matchesSalary = selectedSalary === 0 ||
        (jobMin >= salaryRange.min && jobMin <= salaryRange.max);

      return matchesSearch && matchesLocation && matchesType && matchesSalary;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'salary_desc') return (b.salary?.min || 0) - (a.salary?.min || 0);
      if (sortBy === 'salary_asc') return (a.salary?.min || 0) - (b.salary?.min || 0);
      return 0;
    });

    return result;
  }, [jobs, searchTerm, locationTerm, selectedTypes, selectedSalary, sortBy]);

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
    setSortBy('newest');
  };

  const hasActiveFilters = searchTerm || locationTerm || selectedTypes.length > 0 || selectedSalary > 0;

  const formatSalary = (salary) => {
    if (!salary || salary.isRangeHidden) return 'Not Disclosed';
    if (salary.min && salary.max) return `₹${(salary.min / 100000).toFixed(1)}–${(salary.max / 100000).toFixed(1)} LPA`;
    if (salary.min) return `₹${(salary.min / 100000).toFixed(1)}+ LPA`;
    return 'Competitive';
  };

  const FilterPanel = () => (
    <div className="space-y-8">
      {/* Job Type */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Job Type</p>
        <div className="space-y-2">
          {(showAllTypes ? JOB_TYPES : JOB_TYPES.slice(0, 4)).map(type => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => toggleType(type)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  selectedTypes.includes(type)
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-slate-200 group-hover:border-emerald-300'
                }`}
              >
                {selectedTypes.includes(type) && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span
                onClick={() => toggleType(type)}
                className={`text-sm font-medium transition-colors ${selectedTypes.includes(type) ? 'text-emerald-700 font-semibold' : 'text-slate-600 group-hover:text-slate-900'}`}
              >
                {type}
              </span>
            </label>
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

      {/* Salary Range */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Salary Range</p>
        <div className="space-y-2">
          {SALARY_RANGES.map((range, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setSelectedSalary(i)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedSalary === i ? 'border-emerald-500' : 'border-slate-200 group-hover:border-emerald-300'
                }`}
              >
                {selectedSalary === i && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
              </div>
              <span
                onClick={() => setSelectedSalary(i)}
                className={`text-sm font-medium transition-colors ${selectedSalary === i ? 'text-emerald-700 font-semibold' : 'text-slate-600 group-hover:text-slate-900'}`}
              >
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full h-10 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
        >
          <X size={14} /> Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Top Hero Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 pt-10 pb-14 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Browse All Jobs
          </h1>
          <p className="text-slate-400 font-medium mb-8">
            {loading ? 'Loading...' : `${jobs.length} open positions from top companies`}
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 flex-1 px-5 py-3 rounded-xl bg-slate-50 border border-slate-100">
              <Search size={18} className="text-emerald-500 shrink-0" />
              <input
                type="text"
                placeholder="Job title, company, or keywords..."
                className="bg-transparent border-none outline-none w-full text-slate-800 font-semibold text-sm placeholder:text-slate-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-slate-300 hover:text-slate-500">
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 flex-1 px-5 py-3 rounded-xl bg-slate-50 border border-slate-100">
              <MapPin size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="City, state or remote..."
                className="bg-transparent border-none outline-none w-full text-slate-800 font-semibold text-sm placeholder:text-slate-400"
                value={locationTerm}
                onChange={e => setLocationTerm(e.target.value)}
              />
              {locationTerm && (
                <button onClick={() => setLocationTerm('')} className="text-slate-300 hover:text-slate-500">
                  <X size={16} />
                </button>
              )}
            </div>
            <Button className="h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold shrink-0 shadow-lg shadow-emerald-500/25 transition-all">
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-2 pb-20">
        <div className="flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 pt-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
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
            {(selectedTypes.length > 0 || selectedSalary > 0) && (
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedTypes.map(t => (
                  <Badge key={t} className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => toggleType(t)}>
                    {t} <X size={11} className="ml-1.5" />
                  </Badge>
                ))}
                {selectedSalary > 0 && (
                  <Badge className="bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => setSelectedSalary(0)}>
                    {SALARY_RANGES[selectedSalary].label} <X size={11} className="ml-1.5" />
                  </Badge>
                )}
              </div>
            )}

            {/* Sort + Mobile Filter bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-slate-500">
                Showing <span className="text-slate-900 font-bold">{filteredJobs.length}</span> results
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 h-9 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:border-emerald-300 transition-colors"
                >
                  <SlidersHorizontal size={14} /> Filters
                  {hasActiveFilters && <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">{selectedTypes.length + (selectedSalary > 0 ? 1 : 0)}</span>}
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
                        className="group block bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-100 transition-all duration-300 p-6"
                      >
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
                                <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors truncate">{job.title}</h3>
                                <p className="text-slate-500 text-sm font-medium mt-0.5 flex items-center gap-1.5">
                                  <Building2 size={13} className="text-slate-400" />
                                  {job.company?.name}
                                </p>
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-lg">
                                  <IndianRupee size={13} />{formatSalary(job.salary)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-4">
                              <Badge className="bg-slate-100 text-slate-600 border-none text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-slate-100">
                                <MapPin size={11} className="mr-1" />{job.location || 'Remote'}
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
