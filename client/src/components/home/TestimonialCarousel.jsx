import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';


const ROLE_LABEL = {
  jobseeker: 'Job Seeker', recruiter: 'Recruiter', company: 'Company', org_employee: 'Recruiter',
  college: 'College / TPO', admin: 'Team', subadmin: 'Team',
};
const BG = '#f6f8f7';
const EASE = [0.22, 1, 0.36, 1];

const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const ReviewCard = ({ review, apiDomain }) => {
  // The reviewer's account may have been deleted; keep the review, without a name.
  const name = review.user?.name || 'Velaivaaipu user';
  const avatar = review.user?.avatar;
  const role = review.user?.role?.name;
  const rating = review.rating || 5;
  return (
    <article className="w-[320px] sm:w-[360px] shrink-0 flex flex-col rounded-2xl bg-white border border-zinc-100 p-6 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.25)]">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-full overflow-hidden bg-emerald-50 text-[#138060] flex items-center justify-center text-sm font-bold shrink-0 ring-2 ring-white shadow-sm">
          {avatar
            ? <img src={avatar.startsWith('http') ? avatar : `${apiDomain}${avatar}`} alt="" className="w-full h-full object-cover" loading="lazy" />
            : initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-zinc-900 truncate">{name}</p>
          <p className="text-xs text-zinc-500">{ROLE_LABEL[role] || 'Verified review'}</p>
        </div>
        <Quote size={22} className="text-emerald-200 shrink-0" aria-hidden="true" />
      </div>
      <p className="mt-4 flex-1 text-sm text-zinc-600 leading-relaxed line-clamp-3">{review.comment}</p>
      <div className="mt-5 pt-4 border-t border-zinc-100 flex gap-1" aria-label={`${rating} out of 5 stars`}>
        {[...Array(5)].map((_, j) => (
          <Star key={j} size={17} className={j < rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'} aria-hidden="true" />
        ))}
      </div>
    </article>
  );
};

// One endless row: the list is repeated until it is long enough, then doubled so the
// -50% marquee loop (home-marquee in index.css) is seamless. Pauses on hover.
const MarqueeRow = ({ items, reverse, apiDomain }) => {
  let base = items;
  while (base.length < 6) base = [...base, ...items];
  const loop = [...base, ...base];
  return (
    <div className="home-marquee-pause relative overflow-hidden pt-2 pb-10 -mb-8">
      <div className={`${reverse ? 'home-marquee-reverse' : 'home-marquee'} flex gap-5 w-max`} style={{ animationDuration: '55s' }}>
        {loop.map((r, i) => <ReviewCard key={i} review={r} apiDomain={apiDomain} />)}
      </div>
    </div>
  );
};

// roleFilter: 'jobseeker' | 'recruiter' | 'company' | 'college' | null.
// Shows only approved reviews from the API; falls back to the unfiltered list when fewer
// than 3 match the filter, and renders nothing while there are no reviews.
const TestimonialCarousel = ({
  roleFilter = null,
  eyebrow = 'Real Stories',
  title = 'Success Stories',
  subtitle = 'What people say about Velaivaaipu.',
}) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/reviews/approved`)
      .then(res => {
        if (Array.isArray(res.data)) setReviews(res.data);
      })
      .catch(() => {});
  }, [API_BASE_URL]);

  const filtered = roleFilter
    ? reviews.filter(r => r.user?.role?.name === roleFilter)
    : reviews;
  const list = filtered.length >= 3 ? filtered : reviews;
  if (list.length === 0) return null;

  // Two rows from 4 reviews up; fewer go in a single row.
  const half = Math.ceil(list.length / 2);
  const rowA = list.slice(0, half);
  const twoRows = list.length >= 4;
  const rowB = list.slice(half);

  if (!list.length) return null;

  return (
    <section className="relative overflow-hidden py-24" style={{ backgroundImage: `linear-gradient(to bottom, #fafafa 0%, ${BG} 18%, ${BG} 78%, #ffffff 100%)` }}>
      <motion.div
        className="max-w-6xl mx-auto px-6 text-center mb-12"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <span className="inline-flex items-center gap-2 text-[#059669] text-xs font-bold uppercase tracking-[0.25em] mb-4">
          <span className="w-8 h-px bg-[#00D492]/50" /> {eyebrow} <span className="w-8 h-px bg-[#00D492]/50" />
        </span>
        <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight">{title}</h2>
        <p className="text-zinc-600 mt-3 font-medium">{subtitle}</p>
      </motion.div>

      <motion.div
        className="relative space-y-5"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
      >
        {/* Soft fades at both screen edges */}
        <div className="absolute inset-y-0 left-0 w-16 sm:w-40 z-10 bg-gradient-to-r from-[#f6f8f7] to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 sm:w-40 z-10 bg-gradient-to-l from-[#f6f8f7] to-transparent pointer-events-none" />
        <MarqueeRow items={twoRows ? rowA : list} apiDomain={API_DOMAIN} />
        {twoRows && <MarqueeRow items={rowB} reverse apiDomain={API_DOMAIN} />}
      </motion.div>
    </section>
  );
};

export default TestimonialCarousel;
