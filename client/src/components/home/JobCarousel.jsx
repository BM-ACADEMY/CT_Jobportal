import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, IndianRupee, Briefcase, Loader2, ArrowRight } from 'lucide-react';
import MotionIcon from './MotionIcon';

const EASE = [0.22, 1, 0.36, 1];
// Start as soon as a little of the target is on screen, so nothing feels late.
const VIEW = { once: true, amount: 0.15 };

const formatSalary = (salary) => {
  if (!salary || salary.isRangeHidden) return 'Salary not disclosed';
  if (salary.min && salary.max) return `₹${(salary.min / 100000).toFixed(1)}–${(salary.max / 100000).toFixed(1)} LPA`;
  if (salary.min) return `₹${(salary.min / 100000).toFixed(1)}+ LPA`;
  return 'Competitive salary';
};

const formatExperience = (exp) => {
  if (!exp || (!exp.min && !exp.max)) return 'Freshers welcome';
  if (exp.min && exp.max && exp.max !== exp.min) return `${exp.min}–${exp.max} yrs experience`;
  return `${exp.min || exp.max}+ yrs experience`;
};

const timeAgo = (date) => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (Number.isNaN(days)) return '';
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
};

// Entrance: heading rises; then the cards (see cardIn).
const headIn = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };
const wordRise = { hidden: { y: '110%' }, show: { y: '0%', transition: { duration: 0.65, ease: EASE } } };
const gridIn = { hidden: {}, show: {} };

// Desktop (3 columns): in each row the centre card zooms in first, and the side cards start
// tucked behind it, then slide out to their own columns. Transform + opacity only.
// `custom` is { col, desktop }: col is -1 (left), 0 (centre) or 1 (right).
const SIDE_SHIFT = '107%'; // one card width plus the 24px gap, as a share of the card width
const cardIn = {
  hidden: ({ col, desktop }) => (desktop
    ? (col === 0
      ? { opacity: 0, scale: 0.82, x: 0 }
      : { opacity: 0, scale: 0.9, x: col < 0 ? SIDE_SHIFT : `-${SIDE_SHIFT}` })
    : { opacity: 0, y: 28 }),
  show: ({ col, desktop, row }) => {
    const rowDelay = row * 0.25;
    if (!desktop) return { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } };
    if (col === 0) return { opacity: 1, scale: 1, x: 0, transition: { duration: 0.7, ease: EASE, delay: 0.15 + rowDelay } };
    return {
      opacity: 1, scale: 1, x: 0,
      transition: {
        x: { duration: 0.8, ease: EASE, delay: 0.6 + rowDelay },
        scale: { duration: 0.8, ease: EASE, delay: 0.6 + rowDelay },
        opacity: { duration: 0.35, delay: 0.45 + rowDelay },
      },
    };
  },
};

const DESKTOP_QUERY = '(min-width: 1024px)';
const useIsDesktop = () => {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setMatch(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return match;
};

const JobCard = ({ job, badgeText, anim }) => {
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
  const skills = (job.skillsRequired || []).filter(Boolean);
  const shownSkills = skills.slice(0, 3);
  const moreSkills = skills.length - shownSkills.length;

  // Below lg the cards stack into one very tall column, so the grid may never be 15% on
  // screen at once; each card watches its own visibility instead.
  const selfReveal = anim.desktop ? {} : { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.2 } };

  return (
    <motion.article
      variants={cardIn}
      custom={anim}
      {...selfReveal}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: EASE } }}
      className={`group relative ${anim.col === 0 ? 'z-10' : 'z-0'} will-change-transform [backface-visibility:hidden] flex flex-col rounded-[1.75rem] border border-zinc-100 bg-white p-5 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.25)] transition-shadow duration-300 hover:shadow-[0_24px_60px_-24px_rgba(19,128,96,0.35)]`}
    >
      {/* Company, title, posted */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 shrink-0 rounded-full border border-zinc-100 bg-white shadow-sm overflow-hidden flex items-center justify-center">
          {job.company?.logo ? (
            <img src={`${API_DOMAIN}${job.company.logo}`} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-lg font-bold text-[#138060]">{job.company?.name?.[0] || 'J'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[17px] font-bold leading-snug text-zinc-900 line-clamp-2">
            <Link to={`/job/${job._id}`} className="hover:text-[#138060] transition-colors focus-visible:outline-none focus-visible:underline">{job.title}</Link>
          </h3>
          <div className="mt-0.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-zinc-500 truncate">{job.company?.name}</span>
            <span className="shrink-0 text-zinc-400">{timeAgo(job.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {badgeText && <span className="rounded-full bg-[#138060] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{badgeText}</span>}
        {[job.jobType, job.workMode].filter(Boolean).map(tag => (
          <span key={tag} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">{tag}</span>
        ))}
      </div>

      {/* Details panel */}
      <div className="mt-4 flex-1 rounded-2xl bg-emerald-50/60 border border-emerald-100/70 p-4">
        <ul className="space-y-2 text-sm text-zinc-700">
          <li className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-white text-[#138060] flex items-center justify-center shadow-sm"><MapPin size={14} /></span>
            {job.location || 'Remote'}
          </li>
          <li className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-white text-[#138060] flex items-center justify-center shadow-sm"><IndianRupee size={14} /></span>
            {formatSalary(job.salary)}
          </li>
          <li className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-white text-[#138060] flex items-center justify-center shadow-sm"><Briefcase size={14} /></span>
            {formatExperience(job.experience)}
          </li>
        </ul>
        {shownSkills.length > 0 && (
          <div className="mt-3 pt-3 border-t border-emerald-100 flex flex-wrap gap-1.5">
            {shownSkills.map(s => (
              <span key={s} className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700">{s}</span>
            ))}
            {moreSkills > 0 && <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-500">+{moreSkills}</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4">
        <Link
          to={`/job/${job._id}`}
          className="home-shine relative overflow-hidden w-full h-12 rounded-full bg-gradient-to-r from-[#179a73] to-[#138060] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 transition-all hover:shadow-lg hover:from-[#138060] hover:to-[#0f664d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Apply Now <MotionIcon icon={ArrowRight} animation="nudge" trigger="hover" size={16} />
        </Link>
      </div>
    </motion.article>
  );
};

const JobCarousel = ({
  jobs = [],
  loading,
  eyebrow = 'Fresh Listings',
  title = 'Recent Opportunities',
  subtitle = 'The latest roles posted on the platform.',
  badgeText = 'Just Posted',
  emptyText = 'No jobs posted yet — check back soon.',
  viewAllLink = '/jobs',
}) => {
  const displayJobs = (jobs || []).slice(0, 6);
  const isDesktop = useIsDesktop();

  return (
    <section className="py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white" style={{ contentVisibility: 'visible' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div variants={headIn} initial="hidden" whileInView="show" viewport={VIEW} className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <motion.span variants={fadeUp} className="inline-flex items-center gap-2 text-[#138060] text-xs font-bold uppercase tracking-[0.25em] mb-3">
              <span className="w-8 h-px bg-[#138060]/40" /> {eyebrow}
            </motion.span>
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight">
              {title.split(' ').map((word, i) => (
                <React.Fragment key={i}>
                  <span className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em]">
                    <motion.span variants={wordRise} className="inline-block">{word}</motion.span>
                  </span>{' '}
                </React.Fragment>
              ))}
            </h2>
            <motion.p variants={fadeUp} className="text-zinc-500 mt-2 font-medium">{subtitle}</motion.p>
          </div>
          <motion.div variants={fadeUp}>
            <Link
              to={viewAllLink}
              className="group inline-flex items-center gap-2 rounded-full border border-[#138060] px-6 py-2.5 text-sm font-bold text-[#138060] transition-colors hover:bg-[#138060] hover:text-white"
            >
              View all jobs <MotionIcon icon={ArrowRight} animation="nudge" trigger="hover" size={16} />
            </Link>
          </motion.div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
            <Loader2 className="w-10 h-10 text-[#138060] animate-spin mb-4" />
            <p className="text-zinc-400 font-semibold text-sm">Loading opportunities...</p>
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center border-2 border-dashed border-zinc-200 rounded-3xl">
            <Briefcase className="w-10 h-10 text-zinc-300 mb-4" />
            <p className="text-zinc-400 font-semibold text-sm">{emptyText}</p>
          </div>
        ) : (
          <motion.div
            key={isDesktop ? 'desktop' : 'stacked'}
            variants={gridIn}
            {...(isDesktop ? { initial: 'hidden', whileInView: 'show', viewport: VIEW } : {})}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {displayJobs.map((job, i) => (
              <JobCard
                key={job._id}
                job={job}
                badgeText={badgeText}
                anim={{ col: (i % 3) - 1, row: Math.floor(i / 3), desktop: isDesktop }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default JobCarousel;
