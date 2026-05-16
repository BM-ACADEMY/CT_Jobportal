import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Search, Building2, MapPin, Users, Briefcase, Loader2, ArrowRight,
  X, Globe, CheckCircle2, ChevronLeft, ChevronRight,
  TrendingUp, Calendar, Link2, Star, ExternalLink, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE_URL;
const DOMAIN = import.meta.env.VITE_API_DOMAIN;
const PAGE_SIZE = 9;

const INDUSTRIES = ['All', 'Technology', 'Finance', 'Healthcare', 'Education', 'E-Commerce', 'Manufacturing', 'Media', 'Consulting', 'Startup', 'Other'];

// ── Company Detail Modal ──────────────────────────────────────────────────────
const CompanyDetailModal = ({ item, onClose }) => {
  if (!item) return null;
  const isCompany = item.profileType === 'company';

  const Avatar = () => {
    const src = isCompany ? item.logo : item.avatar;
    const name = item.name || 'C';
    return src ? (
      <img src={`${DOMAIN}${src}`} alt={name} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-white font-bold text-3xl bg-gradient-to-br from-emerald-500 to-teal-600">
        {name[0]}
      </div>
    );
  };

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl border-none shadow-2xl">
        {/* Cover + Avatar */}
        <div className="relative h-32 bg-gradient-to-br from-slate-800 to-slate-900 shrink-0">
          {isCompany && item.cover_image_url && (
            <img src={item.cover_image_url} alt="" className="w-full h-full object-cover opacity-60" />
          )}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X size={16} />
          </button>
          <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
            <Avatar />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-12 px-6 pb-6 bg-white">
          {/* Header info */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{item.name}</h2>
                {isCompany && item.is_verified && (
                  <CheckCircle2 size={18} className="text-blue-500" />
                )}
                <Badge className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-none ${isCompany ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {isCompany ? 'Company' : 'Recruiter'}
                </Badge>
              </div>
              {isCompany ? (
                <p className="text-slate-500 text-sm font-medium mt-0.5">{item.industry || item.tagline}</p>
              ) : (
                <p className="text-slate-500 text-sm font-medium mt-0.5">{item.jobTitle}</p>
              )}
            </div>
            {item.openPositions > 0 || (item.openJobs?.length > 0) ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-none text-xs font-bold px-3 py-1.5 rounded-xl shrink-0">
                <Briefcase size={12} className="mr-1.5" />
                {item.openPositions || item.openJobs?.length} Open Roles
              </Badge>
            ) : null}
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {item.location && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                <MapPin size={12} className="text-slate-400" /> {item.location}
              </span>
            )}
            {isCompany && (item.employeeCount || item.company_size_range) && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                <Users size={12} className="text-slate-400" /> {item.company_size_range || item.employeeCount} employees
              </span>
            )}
            {isCompany && item.foundedYear && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                <Calendar size={12} className="text-slate-400" /> Founded {item.foundedYear}
              </span>
            )}
            {isCompany && item.work_model?.length > 0 && item.work_model.map(m => (
              <span key={m} className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">{m}</span>
            ))}
          </div>

          {/* About */}
          {(isCompany ? (item.about_us || item.description) : item.bio) && (
            <div className="mb-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">About</p>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {isCompany ? (item.about_us || item.description) : item.bio}
              </p>
            </div>
          )}

          {/* Company-specific: perks, tech stack, culture */}
          {isCompany && (
            <>
              {item.tech_stack?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tech_stack.map(t => (
                      <Badge key={t} className="bg-slate-100 text-slate-700 border-none text-xs font-semibold px-3 py-1 rounded-lg">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {item.culture_values?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Culture & Values</p>
                  <div className="flex flex-wrap gap-2">
                    {item.culture_values.map(v => (
                      <Badge key={v} className="bg-violet-50 text-violet-700 border-none text-xs font-semibold px-3 py-1 rounded-lg">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {item.perks && Object.values(item.perks).some(Boolean) && (
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Perks & Benefits</p>
                  <div className="flex flex-wrap gap-2">
                    {item.perks.health_insurance && <Badge className="bg-rose-50 text-rose-700 border-none text-xs font-semibold px-3 py-1 rounded-lg">Health Insurance</Badge>}
                    {item.perks.unlimited_pto && <Badge className="bg-emerald-50 text-emerald-700 border-none text-xs font-semibold px-3 py-1 rounded-lg">Unlimited PTO</Badge>}
                    {item.perks.equity_package && <Badge className="bg-amber-50 text-amber-700 border-none text-xs font-semibold px-3 py-1 rounded-lg">Equity Package</Badge>}
                    {item.perks.gym_membership && <Badge className="bg-blue-50 text-blue-700 border-none text-xs font-semibold px-3 py-1 rounded-lg">Gym Membership</Badge>}
                    {item.perks.free_meals && <Badge className="bg-teal-50 text-teal-700 border-none text-xs font-semibold px-3 py-1 rounded-lg">Free Meals</Badge>}
                    {item.perks.learning_stipend > 0 && <Badge className="bg-indigo-50 text-indigo-700 border-none text-xs font-semibold px-3 py-1 rounded-lg">₹{item.perks.learning_stipend} Learning Stipend</Badge>}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recruiter-specific: skills, experience */}
          {!isCompany && (
            <>
              {item.skills?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {item.skills.map(s => (
                      <Badge key={s} className="bg-slate-100 text-slate-700 border-none text-xs font-semibold px-3 py-1 rounded-lg">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {item.company && (
                <div className="mb-5 flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  {item.company.logo && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                      <img src={`${DOMAIN}${item.company.logo}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Works at</p>
                    <p className="text-sm font-bold text-slate-900">{item.company.name}</p>
                    {item.company.industry && <p className="text-xs text-slate-400 font-medium">{item.company.industry}</p>}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Open Jobs */}
          {item.openJobs?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Open Positions</p>
              <div className="space-y-2">
                {item.openJobs.map(job => (
                  <Link
                    key={job._id}
                    to={`/job/${job._id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{job.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {job.location && <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1"><MapPin size={10} />{job.location}</span>}
                        {job.jobType && <span className="text-[11px] text-slate-400 font-medium">{job.jobType}</span>}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {isCompany && item.social_links && Object.values(item.social_links).some(Boolean) && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Links</p>
              <div className="flex gap-2 flex-wrap">
                {item.website && (
                  <a href={item.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                    <Globe size={12} /> Website
                  </a>
                )}
                {item.social_links?.linkedin && (
                  <a href={item.social_links.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                    <Link2 size={12} /> LinkedIn
                  </a>
                )}
                {item.social_links?.twitter && (
                  <a href={item.social_links.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors">
                    <X size={12} /> Twitter
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Company Card ──────────────────────────────────────────────────────────────
const CompanyCard = ({ item, onClick }) => {
  const isCompany = item.profileType === 'company';
  const logo = isCompany ? item.logo : item.avatar;
  const subtitle = isCompany ? (item.industry || item.tagline) : item.jobTitle;
  const location = item.location;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 hover:border-slate-200 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => onClick(item)}
    >
      {/* Cover */}
      <div className={`h-20 relative ${isCompany ? 'bg-gradient-to-br from-slate-100 to-slate-200' : 'bg-gradient-to-br from-emerald-50 to-teal-100'}`}>
        {isCompany && item.cover_image_url && (
          <img src={item.cover_image_url} alt="" className="w-full h-full object-cover" />
        )}
        <Badge className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-none shadow-sm ${isCompany ? 'bg-white text-blue-700' : 'bg-white text-emerald-700'}`}>
          {isCompany ? 'Company' : 'Recruiter'}
        </Badge>
      </div>

      <div className="px-5 pb-5 -mt-7 relative">
        {/* Logo */}
        <div className="w-14 h-14 rounded-2xl border-2 border-white bg-white shadow-md overflow-hidden mb-3">
          {logo ? (
            <img src={`${DOMAIN}${logo}`} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center font-bold text-2xl ${isCompany ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {item.name?.[0] || 'C'}
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition-colors">{item.name}</h3>
              {isCompany && item.is_verified && <CheckCircle2 size={13} className="text-blue-500 shrink-0" />}
            </div>
            {subtitle && <p className="text-slate-400 text-xs font-medium mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {location && (
            <Badge className="bg-slate-100 text-slate-600 border-none text-[10px] font-semibold px-2 py-1 rounded-lg">
              <MapPin size={9} className="mr-1" />{location}
            </Badge>
          )}
          {isCompany && (item.company_size_range || item.employeeCount) && (
            <Badge className="bg-blue-50 text-blue-700 border-none text-[10px] font-semibold px-2 py-1 rounded-lg">
              <Users size={9} className="mr-1" />{item.company_size_range || item.employeeCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-50">
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <Briefcase size={11} />
            {item.openPositions || 0} open roles
          </span>
          {isCompany && item.subscription?.companyProfileType !== 'No' ? (
            <Link 
              to={`/company-profile/${item._id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              View Detailed Profile <ArrowRight size={11} />
            </Link>
          ) : (
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 group-hover:text-emerald-600 group-hover:gap-1.5 transition-all">
              Quick View <ArrowRight size={11} />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={16} />
      </button>
      {nums.map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${n === page ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' : 'border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'}`}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const Companies = () => {
  const [data, setData] = useState({ companies: [], recruiters: [], totalCompanies: 0, totalRecruiters: 0, pages: 1, industries: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
        search,
        industry: industry === 'All' ? '' : industry,
        type,
      });
      const res = await axios.get(`${API}/public/companies?${params}`);
      setData(res.data);
    } catch {
      setData({ companies: [], recruiters: [], totalCompanies: 0, totalRecruiters: 0, pages: 1, industries: [] });
    } finally {
      setLoading(false);
    }
  }, [page, search, industry, type]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, industry, type]);

  const handleCardClick = async (item) => {
    setDetailLoading(true);
    setSelectedItem(item);
    try {
      const endpoint = item.profileType === 'company'
        ? `${API}/public/companies/${item._id}`
        : `${API}/public/recruiters/${item._id}`;
      const res = await axios.get(endpoint);
      setSelectedItem(res.data);
    } catch {
      // Keep the basic data already set
    } finally {
      setDetailLoading(false);
    }
  };

  const allItems = type === 'recruiter'
    ? data.recruiters
    : type === 'company'
      ? data.companies
      : [...data.companies, ...data.recruiters];

  const displayedIndustries = ['All', ...(data.industries || [])];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-5 py-2 mb-5">
              <Building2 size={14} className="text-blue-400" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-blue-400">
                {loading ? '…' : `${data.totalCompanies} Companies · ${data.totalRecruiters} Recruiters`}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Discover Top Companies<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                & Recruiters
              </span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-xl mb-8">
              Explore employers and connect with recruiters who are actively hiring across India.
            </p>

            {/* Search */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex gap-2 max-w-2xl shadow-2xl shadow-black/30">
              <div className="flex items-center gap-3 flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/5">
                <Search size={18} className="text-blue-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Company name, recruiter, location…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-white font-medium placeholder:text-slate-500 text-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300">
                    <X size={15} />
                  </button>
                )}
              </div>
              <Button className="h-12 px-8 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold shrink-0">
                Search
              </Button>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 60H1440V30C1200 60 960 0 720 30C480 60 240 0 0 30V60Z" fill="#f8fafc" />
          </svg>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 -mt-2 flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-wrap">
          {/* Type filter */}
          <div className="flex gap-2">
            {[
              { val: 'all', label: 'All' },
              { val: 'company', label: 'Companies' },
              { val: 'recruiter', label: 'Recruiters' },
            ].map(t => (
              <button
                key={t.val}
                onClick={() => setType(t.val)}
                className={`h-8 px-4 rounded-xl text-xs font-bold transition-all ${type === t.val ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Industry pills — show only for company view */}
          {type !== 'recruiter' && (
            <div className="flex flex-wrap gap-2">
              {displayedIndustries.slice(0, 7).map(ind => (
                <button
                  key={ind}
                  onClick={() => setIndustry(ind)}
                  className={`h-8 px-3 rounded-xl text-xs font-bold transition-all ${industry === ind ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {ind}
                </button>
              ))}
            </div>
          )}

          <div className="sm:ml-auto text-sm font-semibold text-slate-400 shrink-0">
            {loading ? '…' : `${allItems.length} shown`}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center py-24">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500 font-semibold text-sm">Loading profiles…</p>
          </div>
        ) : allItems.length === 0 ? (
          <div className="flex flex-col items-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
            <Building2 size={40} className="text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">No profiles found</h3>
            <p className="text-slate-400 text-sm mb-6">Try adjusting your search or filters</p>
            <Button onClick={() => { setSearch(''); setIndustry('All'); setType('all'); }} variant="outline" className="h-10 px-6 rounded-xl border-blue-200 text-blue-600 font-bold hover:bg-blue-50">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            {/* Section labels when showing all */}
            {type === 'all' && data.companies.length > 0 && (
              <>
                {data.companies.length > 0 && (
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Building2 size={13} /> Companies ({data.totalCompanies})
                  </p>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {data.companies.map((c, i) => (
                    <CompanyCard key={c._id} item={c} onClick={handleCardClick} />
                  ))}
                </div>

                {data.recruiters.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Users size={13} /> Recruiters ({data.totalRecruiters})
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {data.recruiters.map((r, i) => (
                        <CompanyCard key={r._id} item={r} onClick={handleCardClick} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {type !== 'all' && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {allItems.map(item => (
                  <CompanyCard key={item._id} item={item} onClick={handleCardClick} />
                ))}
              </div>
            )}

            <Pagination page={page} pages={data.pages} onChange={setPage} />
          </>
        )}

        {/* CTA */}
        {!loading && (
          <div className="mt-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-3">Is your company hiring?</h2>
              <p className="text-emerald-50 font-medium mb-6 max-w-md mx-auto">List your company and reach millions of qualified candidates across India.</p>
              <Link to="/register">
                <Button className="h-12 px-10 rounded-2xl bg-white text-emerald-700 font-bold hover:bg-white/90 shadow-lg transition-all hover:scale-105">
                  Register Your Company
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <CompanyDetailModal
        item={detailLoading ? null : selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
};

export default Companies;
