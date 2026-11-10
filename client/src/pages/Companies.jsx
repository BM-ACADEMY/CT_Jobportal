import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, MotionConfig, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Search, Building2, MapPin, Users, Briefcase, ArrowRight, X, Globe, BadgeCheck,
  ChevronLeft, ChevronRight, Calendar, Link2,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { jobPath } from '../utils/jobUrl';
import HeroShell from '@/components/home/HeroShell';
import Reveal from '@/components/home/Reveal';
import MotionIcon from '@/components/home/MotionIcon';
import HireCta from '@/components/home/HireCta';
import Footer from '@/components/home/Footer';
import BackToTop from '@/components/home/BackToTop';
import RecentBlogs from '@/components/blog/RecentBlogs';

const API = import.meta.env.VITE_API_BASE_URL;
const DOMAIN = import.meta.env.VITE_API_DOMAIN;
const PAGE_SIZE = 9;
const EASE = [0.22, 1, 0.36, 1];

const TYPES = [
  { val: 'all', label: 'All' },
  { val: 'company', label: 'Companies' },
  { val: 'recruiter', label: 'Recruiters' },
];

const heroStagger = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } };
const heroItem = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };

const SectionEyebrow = ({ children }) => (
  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] mb-4 text-[#059669]">
    <span className="w-8 h-px bg-[#00D492]/50 shrink-0" /> {children} <span className="w-8 h-px bg-[#00D492]/50 shrink-0" />
  </span>
);

const rolesLabel = (n) => (n > 0 ? `${n} open role${n === 1 ? '' : 's'}` : 'No open roles right now');

// Logo or avatar, falling back to the first letter on a brand tint.
const Mark = ({ item, className = '', textClass = 'text-xl' }) => {
  const src = item.profileType === 'company' ? item.logo : item.avatar;
  return (
    <div className={`overflow-hidden bg-white ring-1 ring-zinc-200/80 ${className}`}>
      {src ? (
        <img src={`${DOMAIN}${src}`} alt={item.name} className="block w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full flex items-center justify-center font-bold bg-emerald-50 text-[#059669] ${textClass}`}>
          {item.name?.[0]?.toUpperCase() || 'C'}
        </div>
      )}
    </div>
  );
};

const Chip = ({ children, tone = 'zinc' }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${tone === 'brand' ? 'bg-emerald-50 text-emerald-800' : 'bg-zinc-100 text-zinc-600'}`}>
    {children}
  </span>
);

const Label = ({ children }) => <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{children}</p>;

// ── Detail modal ──────────────────────────────────────────────────────────────
const CompanyDetailModal = ({ item, onClose }) => {
  if (!item) return null;
  const isCompany = item.profileType === 'company';
  const about = isCompany ? (item.about_us || item.description) : item.bio;
  const openCount = item.openPositions || item.openJobs?.length || 0;
  const perks = item.perks || {};
  const perkList = [
    perks.health_insurance && 'Health Insurance',
    perks.unlimited_pto && 'Unlimited PTO',
    perks.equity_package && 'Equity Package',
    perks.gym_membership && 'Gym Membership',
    perks.free_meals && 'Free Meals',
    perks.learning_stipend > 0 && `₹${perks.learning_stipend} Learning Stipend`,
  ].filter(Boolean);

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl border-none shadow-2xl">
        <div className="relative h-32 shrink-0 bg-gradient-to-br from-[#179a73] to-[#0f6b50]">
          {isCompany && item.cover_image_url && <img src={item.cover_image_url} alt="" className="w-full h-full object-cover opacity-70" />}
          <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
            <X size={16} />
          </button>
          <Mark item={item} className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl border-4 border-white shadow-xl" textClass="text-2xl" />
        </div>

        <div className="flex-1 overflow-y-auto pt-12 px-6 pb-6 bg-white">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-zinc-900">{item.name}</h2>
                {isCompany && item.is_verified && <BadgeCheck size={18} className="text-[#059669]" aria-label="Verified" />}
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{isCompany ? 'Company' : 'Recruiter'}</span>
              </div>
              <p className="text-zinc-500 text-sm font-medium mt-0.5">{isCompany ? (item.industry || item.tagline) : item.jobTitle}</p>
            </div>
            {openCount > 0 && <Chip tone="brand"><Briefcase size={12} /> {rolesLabel(openCount)}</Chip>}
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {item.location && <Chip><MapPin size={12} className="text-zinc-400" /> {item.location}</Chip>}
            {isCompany && (item.company_size_range || item.employeeCount) && <Chip><Users size={12} className="text-zinc-400" /> {item.company_size_range || item.employeeCount} employees</Chip>}
            {isCompany && item.foundedYear && <Chip><Calendar size={12} className="text-zinc-400" /> Founded {item.foundedYear}</Chip>}
            {isCompany && item.work_model?.map(m => <Chip key={m} tone="brand">{m}</Chip>)}
          </div>

          {about && (
            <div className="mb-5">
              <Label>About</Label>
              <p className="text-sm text-zinc-600 font-medium leading-relaxed whitespace-pre-line">{about}</p>
            </div>
          )}

          {isCompany && item.tech_stack?.length > 0 && (
            <div className="mb-5"><Label>Tech Stack</Label><div className="flex flex-wrap gap-2">{item.tech_stack.map(t => <Chip key={t}>{t}</Chip>)}</div></div>
          )}
          {isCompany && item.culture_values?.length > 0 && (
            <div className="mb-5"><Label>Culture & Values</Label><div className="flex flex-wrap gap-2">{item.culture_values.map(v => <Chip key={v} tone="brand">{v}</Chip>)}</div></div>
          )}
          {isCompany && perkList.length > 0 && (
            <div className="mb-5"><Label>Perks & Benefits</Label><div className="flex flex-wrap gap-2">{perkList.map(p => <Chip key={p} tone="brand">{p}</Chip>)}</div></div>
          )}

          {!isCompany && item.skills?.length > 0 && (
            <div className="mb-5"><Label>Expertise</Label><div className="flex flex-wrap gap-2">{item.skills.map(s => <Chip key={s}>{s}</Chip>)}</div></div>
          )}
          {!isCompany && item.company && (
            <div className="mb-5 flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
              {item.company.logo && (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-100 shrink-0">
                  <img src={`${DOMAIN}${item.company.logo}`} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Works at</p>
                <p className="text-sm font-bold text-zinc-900">{item.company.name}</p>
                {item.company.industry && <p className="text-xs text-zinc-400 font-medium">{item.company.industry}</p>}
              </div>
            </div>
          )}

          {item.openJobs?.length > 0 && (
            <div className="mb-5">
              <Label>Open Positions</Label>
              <div className="space-y-2">
                {item.openJobs.map(job => (
                  <Link
                    key={job._id}
                    to={jobPath(job)}
                    onClick={onClose}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all group"
                  >
                    <div>
                      <p className="text-sm font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">{job.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {job.location && <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1"><MapPin size={10} />{job.location}</span>}
                        {job.jobType && <span className="text-[11px] text-zinc-400 font-medium">{job.jobType}</span>}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-zinc-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isCompany && (item.website || item.social_links?.linkedin || item.social_links?.twitter) && (
            <div>
              <Label>Links</Label>
              <div className="flex gap-2 flex-wrap">
                {item.website && <a href={item.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors"><Globe size={12} /> Website</a>}
                {item.social_links?.linkedin && <a href={item.social_links.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors"><Link2 size={12} /> LinkedIn</a>}
                {item.social_links?.twitter && <a href={item.social_links.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors"><X size={12} /> Twitter</a>}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────
// Job-board style card: logo, name and industry with when they joined, tags for how they
// work, a tinted panel with the facts and their skills, then one full-width action.
// Dealt in on its vertical axis, and tilts toward the pointer with a soft glare.
const gridIn = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const cardIn = {
  hidden: { opacity: 0, rotateY: -60, x: -24, scale: 0.94 },
  show: { opacity: 1, rotateY: 0, x: 0, scale: 1, transition: { type: 'spring', stiffness: 170, damping: 20 } },
};
const TILT_DEG = 6;

const joinedAgo = (date) => {
  const t = new Date(date).getTime();
  if (!t) return null;
  const days = Math.floor((Date.now() - t) / 864e5);
  if (days < 1) return 'Joined today';
  if (days < 30) return `Joined ${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Joined ${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `Joined ${years} year${years === 1 ? '' : 's'} ago`;
};

const Tag = ({ children, tone = 'amber' }) => (
  <span className={`inline-flex items-center h-6 px-2.5 rounded-md text-[11px] font-bold tracking-wide ${tone === 'green' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100/80 text-amber-800'}`}>
    {children}
  </span>
);

const Fact = ({ icon: Icon, children, muted = false }) => (
  <li className={`flex items-center gap-2.5 text-sm ${muted ? 'text-zinc-400' : 'text-zinc-700'}`}>
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-zinc-500 ring-1 ring-zinc-200/80"><Icon size={13} /></span>
    <span className="truncate">{children}</span>
  </li>
);

const CompanyCard = ({ item, onOpen }) => {
  const reduceMotion = useReducedMotion();
  const ref = useRef(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 20 };
  const rotateX = useSpring(useTransform(py, [0, 1], [TILT_DEG, -TILT_DEG]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-TILT_DEG, TILT_DEG]), spring);
  const glare = useTransform([px, py], ([x, y]) => `radial-gradient(260px circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.5), transparent 60%)`);
  const onPointerMove = (e) => {
    if (reduceMotion || e.pointerType !== 'mouse') return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onPointerLeave = () => { px.set(0.5); py.set(0.5); };

  const isCompany = item.profileType === 'company';
  const subtitle = (isCompany ? (item.industry || item.tagline) : item.jobTitle) || (isCompany ? 'Company' : 'Recruiter');
  const open = item.openPositions || 0;
  const hasProfilePage = isCompany && item.subscription?.companyProfileType !== 'No';
  const size = isCompany && (item.company_size_range || item.employeeCount);
  const joined = joinedAgo(item.createdAt);

  const tags = [
    ...(isCompany ? (item.work_model || []) : []),
    ...(isCompany && item.is_verified ? ['Verified'] : []),
  ].slice(0, 3);
  const skills = [...new Set(isCompany ? [...(item.tech_stack || []), ...(item.culture_values || [])] : (item.skills || []))];
  const shown = skills.slice(0, 3);
  const more = skills.length - shown.length;
  const cta = open > 0 ? `View ${open} open role${open === 1 ? '' : 's'}` : 'View profile';

  const button = 'home-shine relative overflow-hidden flex w-full h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#17a578] to-[#0f6b50] text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-700/30 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#059669]';

  return (
    <motion.div variants={cardIn} style={{ transformPerspective: 1100 }} className="relative h-full min-w-0">
      <motion.article
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ rotateX, rotateY, transformPerspective: 900 }}
        whileHover={reduceMotion ? undefined : { y: -4 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="group relative h-full flex flex-col rounded-[26px] bg-white border border-zinc-200/70 p-5 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.25)] transition-shadow duration-300 hover:shadow-[0_30px_60px_-28px_rgba(5,150,105,0.45)]"
      >
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 rounded-[26px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glare }} />

        {/* Header */}
        <div className="flex items-start gap-3.5">
          <Mark item={item} className="w-14 h-14 shrink-0 rounded-full shadow-sm transition-transform duration-300 group-hover:scale-105" textClass="text-xl" />
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[17px] font-bold leading-tight text-zinc-900 truncate">{item.name}</h3>
              {isCompany && item.is_verified && <BadgeCheck size={16} className="shrink-0 text-[#059669]" aria-label="Verified" />}
            </div>
            <p className="mt-0.5 text-sm text-zinc-500 truncate">{subtitle}</p>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map(t => <Tag key={t} tone={t === 'Verified' ? 'green' : 'amber'}>{t.toUpperCase()}</Tag>)}
          </div>
        )}

        {/* Facts panel */}
        <div className="mt-4 flex-1 rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-sky-50/60 p-4 ring-1 ring-emerald-100/70">
          <ul className="space-y-2.5">
            {item.location && <Fact icon={MapPin}>{item.location}</Fact>}
            {isCompany && <Fact icon={Briefcase} muted={!open}>{open > 0 ? `${open} open role${open === 1 ? '' : 's'}` : 'No open roles right now'}</Fact>}
            {size && <Fact icon={Users}>{size} people</Fact>}
            {joined && <Fact icon={Calendar}>{joined}</Fact>}
          </ul>
          {shown.length > 0 && (
            <>
              <div className="my-3.5 border-t border-dashed border-emerald-200/80" />
              <ul className="flex flex-wrap gap-1.5">
                {shown.map(s => <li key={s} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200/80">{s}</li>)}
                {more > 0 && <li className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200/80">+{more}</li>}
              </ul>
            </>
          )}
        </div>

        {/* Action */}
        <div className="mt-4">
          {hasProfilePage ? (
            <Link to={`/companies/${item._id}`} className={button}>
              {cta} <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          ) : (
            <button type="button" onClick={() => onOpen(item)} className={`${button} cursor-pointer`}>
              {cta} <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </motion.article>
    </motion.div>
  );
};

const CardSkeleton = () => (
  <div className="rounded-[26px] border border-zinc-200/70 bg-white p-5 animate-pulse">
    <div className="flex gap-3.5"><div className="h-14 w-14 rounded-full bg-zinc-100" /><div className="flex-1 space-y-2 pt-1.5"><div className="h-4 w-2/3 rounded bg-zinc-100" /><div className="h-3 w-1/2 rounded bg-zinc-100" /></div></div>
    <div className="mt-4 flex gap-1.5"><div className="h-6 w-16 rounded-md bg-zinc-100" /><div className="h-6 w-20 rounded-md bg-zinc-100" /></div>
    <div className="mt-4 h-32 rounded-2xl bg-zinc-50" />
    <div className="mt-4 h-12 rounded-full bg-zinc-100" />
  </div>
);

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  const btn = 'w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all';
  return (
    <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pages">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page" className={`${btn} border border-zinc-200 text-zinc-500 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed`}>
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`${btn} ${n === page ? 'bg-[#059669] text-white shadow-md shadow-emerald-600/25' : 'border border-zinc-200 text-zinc-600 hover:border-emerald-300 hover:text-emerald-700'}`}
        >
          {n}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === pages} aria-label="Next page" className={`${btn} border border-zinc-200 text-zinc-500 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed`}>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};

// The grid replays its entrance whenever its key changes (filter, search or page).
const Grid = ({ items, onOpen }) => (
  <motion.div variants={gridIn} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map(item => <CompanyCard key={item._id} item={item} onOpen={onOpen} />)}
  </motion.div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const Companies = () => {
  const [data, setData] = useState({ companies: [], recruiters: [], totalCompanies: 0, totalRecruiters: 0, pages: 1, industries: [] });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [searchParams] = useSearchParams();
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const directoryRef = useRef(null);

  // Typing filters the directory after a short pause instead of on every key.
  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE, search, industry: industry === 'All' ? '' : industry, type });
      const res = await axios.get(`${API}/public/companies?${params}`);
      setData(res.data);
    } catch {
      setData({ companies: [], recruiters: [], totalCompanies: 0, totalRecruiters: 0, pages: 1, industries: [] });
    } finally {
      setLoading(false);
    }
  }, [page, search, industry, type]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, industry, type]);

  const scrollToDirectory = () => directoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(query.trim());
    scrollToDirectory();
  };

  const handleOpen = async (item) => {
    setDetailLoading(true);
    setSelectedItem(item);
    try {
      const endpoint = item.profileType === 'company' ? `${API}/public/companies/${item._id}` : `${API}/public/recruiters/${item._id}`;
      const res = await axios.get(endpoint);
      setSelectedItem(res.data);
    } catch {
      // Keep the basic data already set
    } finally {
      setDetailLoading(false);
    }
  };

  const changePage = (n) => { setPage(n); scrollToDirectory(); };
  const clearFilters = () => { setQuery(''); setSearch(''); setIndustry('All'); setType('all'); };

  const allItems = type === 'recruiter' ? data.recruiters : type === 'company' ? data.companies : [...data.companies, ...data.recruiters];
  const industries = data.industries || [];
  const countLine = type === 'recruiter'
    ? `${data.totalRecruiters} recruiter${data.totalRecruiters === 1 ? '' : 's'}`
    : type === 'company'
      ? `${data.totalCompanies} compan${data.totalCompanies === 1 ? 'y' : 'ies'}`
      : `${data.totalCompanies} compan${data.totalCompanies === 1 ? 'y' : 'ies'} · ${data.totalRecruiters} recruiter${data.totalRecruiters === 1 ? '' : 's'}`;

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-white overflow-x-clip">
        {/* Hero */}
        <HeroShell>
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <motion.div variants={heroStagger} initial="hidden" animate="show" className="lg:col-span-7 space-y-7">
              <motion.h1 variants={heroItem} className="text-4xl md:text-5xl lg:text-[4rem] font-bold text-zinc-900 tracking-tight leading-[1.1]">
                Companies{' '}
                <span className="relative inline-block">
                  <span className="home-gradient-text">Hiring</span>
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
                </span>
                <br />in Tamil Nadu &amp; Puducherry
              </motion.h1>

              <motion.p variants={heroItem} className="text-zinc-600 text-base max-w-lg leading-relaxed">
                See who is hiring near you. Browse employers and the recruiters behind them, check their open roles and apply straight from their profile.
              </motion.p>

              <motion.form
                variants={heroItem}
                onSubmit={handleSearch}
                role="search"
                className="bg-white border border-zinc-200/70 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl shadow-[0_20px_50px_-20px_rgba(0,212,146,0.35)] transition-shadow duration-300 focus-within:shadow-[0_24px_60px_-18px_rgba(0,212,146,0.5)] focus-within:border-emerald-300"
              >
                <label className="flex items-center gap-3 flex-1 px-4 py-3 rounded-xl transition-colors focus-within:bg-emerald-50/60 cursor-text">
                  <MotionIcon icon={Building2} animation="wiggle" trigger="hover" size={18} className="text-[#059669] shrink-0" />
                  <span className="sr-only">Company, recruiter or city</span>
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Company, recruiter or city"
                    className="flex-1 min-w-0 bg-transparent outline-none text-zinc-800 font-medium placeholder:text-zinc-400 text-sm"
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-zinc-400 hover:text-zinc-600">
                      <X size={15} />
                    </button>
                  )}
                </label>
                <Button type="submit" className="group home-shine relative overflow-hidden h-12 rounded-xl px-8 text-sm font-bold bg-[#059669] hover:bg-[#047857] text-white shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] shrink-0 cursor-pointer">
                  <MotionIcon icon={Search} animation="wiggle" trigger="hover" size={16} /> Find Companies
                </Button>
              </motion.form>

              <motion.div variants={heroItem} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-zinc-500 mr-1">Browse:</span>
                {TYPES.map(t => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => { setType(t.val); scrollToDirectory(); }}
                    className="px-3.5 py-2 rounded-full bg-white border border-zinc-200 font-semibold text-zinc-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    {t.val === 'all' ? 'Everyone hiring' : t.label}
                  </button>
                ))}
              </motion.div>

              <motion.div variants={heroItem}>
                <Link to="/register" className="group inline-flex items-center gap-1.5 text-sm font-bold text-zinc-800 hover:text-emerald-700 transition-colors">
                  Hiring yourself? List your company free
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
              className="lg:col-span-5 relative mt-10 lg:mt-0"
            >
              {/* Same frame as the home hero: soft glow behind a cut-out on brand blobs with hand-drawn doodles */}
              <div className="relative w-full max-w-[420px] mx-auto">
                <div className="absolute inset-6 rounded-[2rem] bg-gradient-to-tr from-[#00D492]/40 to-teal-200/40 blur-2xl" aria-hidden="true" />
                <img
                  src="/images/companies-hero-employer.webp"
                  alt="Recruiter smiling at candidates on her laptop"
                  width="1160"
                  height="1360"
                  loading="eager"
                  fetchPriority="high"
                  className="home-float relative z-10 w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </HeroShell>

        {/* Directory */}
        <section ref={directoryRef} id="directory" className="scroll-mt-24 py-24 bg-gradient-to-b from-white via-[#fafafa] to-[#fafafa]">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal className="text-center mb-12">
              <SectionEyebrow>Directory</SectionEyebrow>
              <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight">Browse Employers &amp; Recruiters</h2>
              <p className="text-zinc-600 mt-3 font-medium text-sm md:text-base">Open a profile to see the company, the people hiring and every role they have open.</p>
            </Reveal>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
              <div role="tablist" aria-label="Show" className="inline-flex self-start p-1 rounded-xl bg-white border border-zinc-200/70 shadow-sm">
                {TYPES.map(t => (
                  <button
                    key={t.val}
                    role="tab"
                    aria-selected={type === t.val}
                    onClick={() => setType(t.val)}
                    className={`h-10 px-5 rounded-lg text-sm font-bold transition-all ${type === t.val ? 'bg-[#059669] text-white shadow-sm shadow-emerald-600/25' : 'text-zinc-600 hover:text-emerald-700'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {type !== 'recruiter' && industries.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {['All', ...industries].slice(0, 8).map(ind => (
                    <button
                      key={ind}
                      onClick={() => setIndustry(ind)}
                      className={`h-10 px-4 rounded-full text-xs font-bold border transition-colors ${industry === ind ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-zinc-200 text-zinc-600 hover:border-emerald-300 hover:text-emerald-700'}`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              )}

              <p className="md:ml-auto text-sm font-semibold text-zinc-500" aria-live="polite">
                {loading ? 'Loading…' : search ? `${allItems.length} match${allItems.length === 1 ? '' : 'es'} for “${search}”` : countLine}
              </p>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : allItems.length === 0 ? (
              <div className="flex flex-col items-center py-20 px-6 bg-white rounded-2xl border border-dashed border-zinc-200 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] flex items-center justify-center mb-4"><Building2 size={26} /></div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">No one matches that yet</h3>
                <p className="text-zinc-500 text-sm mb-6">Try a different name or city, or clear the filters.</p>
                <Button onClick={clearFilters} variant="outline" className="h-11 px-6 rounded-xl border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-50">
                  Clear filters
                </Button>
              </div>
            ) : type === 'all' ? (
              <div className="space-y-12">
                {data.companies.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <Building2 size={16} className="text-[#059669]" /> Companies <span className="text-zinc-400 font-semibold">{data.totalCompanies}</span>
                    </h3>
                    <Grid key={`${type}-${page}-${search}-${industry}`} items={data.companies} onOpen={handleOpen} />
                  </div>
                )}
                {data.recruiters.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <Users size={16} className="text-[#059669]" /> Recruiters <span className="text-zinc-400 font-semibold">{data.totalRecruiters}</span>
                    </h3>
                    <Grid key={`${type}-${page}-${search}-${industry}`} items={data.recruiters} onOpen={handleOpen} />
                  </div>
                )}
              </div>
            ) : (
              <Grid key={`${type}-${page}-${search}-${industry}`} items={allItems} onOpen={handleOpen} />
            )}

            {!loading && <Pagination page={page} pages={data.pages} onChange={changePage} />}
          </div>
        </section>

        <HireCta
          title={<>Is Your Company <span className="text-[#10213D]">Hiring?</span></>}
          text="List your company free and reach job seekers in Tamil Nadu and Puducherry."
          primary={{ to: '/register', label: 'List Your Company' }}
        />

        <RecentBlogs />
        <Footer />
        <BackToTop />

        <CompanyDetailModal item={detailLoading ? null : selectedItem} onClose={() => setSelectedItem(null)} />
      </div>
    </MotionConfig>
  );
};

export default Companies;
