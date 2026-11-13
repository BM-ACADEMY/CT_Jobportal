import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Code2, Stethoscope, BarChart2, Palette, Megaphone, Cpu, GraduationCap, HeartHandshake,
  ShoppingBag, Star, Layers, Factory, Building2, Headphones, Briefcase, Users, ChefHat, Sparkles,
} from 'lucide-react';
import MotionIcon from './MotionIcon';
import { JOB_CATEGORIES } from '../../data/jobCategories';

// Full class strings per tint so Tailwind can see them at build time.
const TINTS = {
  sky: { panel: 'bg-sky-50', icon: 'text-sky-600', btn: 'group-hover:bg-sky-600', glow: 'hover:shadow-sky-500/15' },
  rose: { panel: 'bg-rose-50', icon: 'text-rose-600', btn: 'group-hover:bg-rose-600', glow: 'hover:shadow-rose-500/15' },
  amber: { panel: 'bg-amber-50', icon: 'text-amber-600', btn: 'group-hover:bg-amber-600', glow: 'hover:shadow-amber-500/15' },
  violet: { panel: 'bg-violet-50', icon: 'text-violet-600', btn: 'group-hover:bg-violet-600', glow: 'hover:shadow-violet-500/15' },
  orange: { panel: 'bg-orange-50', icon: 'text-orange-600', btn: 'group-hover:bg-orange-600', glow: 'hover:shadow-orange-500/15' },
  teal: { panel: 'bg-teal-50', icon: 'text-teal-600', btn: 'group-hover:bg-teal-600', glow: 'hover:shadow-teal-500/15' },
  indigo: { panel: 'bg-indigo-50', icon: 'text-indigo-600', btn: 'group-hover:bg-indigo-600', glow: 'hover:shadow-indigo-500/15' },
  emerald: { panel: 'bg-emerald-50', icon: 'text-emerald-600', btn: 'group-hover:bg-emerald-600', glow: 'hover:shadow-emerald-500/15' },
  pink: { panel: 'bg-pink-50', icon: 'text-pink-600', btn: 'group-hover:bg-pink-600', glow: 'hover:shadow-pink-500/15' },
  cyan: { panel: 'bg-cyan-50', icon: 'text-cyan-600', btn: 'group-hover:bg-cyan-600', glow: 'hover:shadow-cyan-500/15' },
  stone: { panel: 'bg-stone-100', icon: 'text-stone-600', btn: 'group-hover:bg-stone-600', glow: 'hover:shadow-stone-500/15' },
  lime: { panel: 'bg-lime-50', icon: 'text-lime-700', btn: 'group-hover:bg-lime-600', glow: 'hover:shadow-lime-500/15' },
  fuchsia: { panel: 'bg-fuchsia-50', icon: 'text-fuchsia-600', btn: 'group-hover:bg-fuchsia-600', glow: 'hover:shadow-fuchsia-500/15' },
  slate: { panel: 'bg-slate-100', icon: 'text-slate-600', btn: 'group-hover:bg-slate-600', glow: 'hover:shadow-slate-500/15' },
};

// Look of each category (the words live in data/jobCategories.js).
const LOOK = {
  'it-software': { icon: Code2, tint: 'sky', anim: 'pulse' },
  healthcare: { icon: Stethoscope, tint: 'rose', anim: 'bounce' },
  'finance-accounts': { icon: BarChart2, tint: 'amber', anim: 'tilt' },
  'design-creative': { icon: Palette, tint: 'violet', anim: 'wiggle' },
  'sales-marketing': { icon: Megaphone, tint: 'orange', anim: 'bounce' },
  engineering: { icon: Cpu, tint: 'teal', anim: 'spin' },
  'education-training': { icon: GraduationCap, tint: 'indigo', anim: 'tilt' },
  'retail-shops': { icon: ShoppingBag, tint: 'pink', anim: 'bounce' },
  'hospitality-tourism': { icon: Star, tint: 'amber', anim: 'pulse' },
  'kitchen-culinary': { icon: ChefHat, tint: 'orange', anim: 'wiggle' },
  'housekeeping-facilities': { icon: Sparkles, tint: 'teal', anim: 'pulse' },
  'logistics-delivery': { icon: Layers, tint: 'cyan', anim: 'tilt' },
  manufacturing: { icon: Factory, tint: 'stone', anim: 'spin' },
  'construction-realestate': { icon: Building2, tint: 'lime', anim: 'pulse' },
  'bpo-support': { icon: Headphones, tint: 'fuchsia', anim: 'wiggle' },
  'admin-office': { icon: Briefcase, tint: 'slate', anim: 'tilt' },
  'hr-recruitment': { icon: Users, tint: 'sky', anim: 'bounce' },
  'non-profit': { icon: HeartHandshake, tint: 'emerald', anim: 'pulse' },
};

const PHONE_FIRST = 8; // on a phone the first 8 show; "Show all" reveals the rest

const grid = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// One tile: the whole tile is a link to the Jobs page, filtered to that field.
const CategoryTile = ({ cat, hiddenOnPhone }) => {
  const look = LOOK[cat.key] || LOOK['admin-office'];
  const t = TINTS[look.tint];
  return (
    <motion.div variants={item} className={hiddenOnPhone ? 'hidden sm:block' : ''}>
      <Link
        to={`/jobs?category=${cat.key}`}
        className={`group flex h-full flex-col rounded-[22px] bg-white border border-zinc-200/80 p-1.5 shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${t.glow}`}
      >
        <div className={`flex-1 rounded-2xl ${t.panel} p-4`}>
          <span className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${t.icon}`}>
            <MotionIcon icon={look.icon} animation={look.anim} trigger="hover" size={19} />
          </span>
          <h3 className="mt-3 text-[15px] sm:text-base font-bold text-zinc-900 leading-tight">{cat.label}</h3>
          <p className="mt-1 text-xs text-zinc-600 leading-snug hidden sm:block">{cat.desc}</p>
          <p className="mt-2 text-[11px] font-medium text-zinc-500 leading-snug">{cat.roles.join(' · ')}</p>
        </div>
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
          <span className="text-sm font-semibold text-zinc-900">View jobs</span>
          <span className={`w-8 h-8 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center transition-colors duration-300 group-hover:text-white ${t.btn}`}>
            <MotionIcon icon={ArrowRight} animation="nudge" trigger="hover" size={15} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

// 2 columns on phones, 3 from sm, 4 from lg. Every field of work is shown; no made-up job counts.
const CategoryCards = () => {
  const [showAll, setShowAll] = useState(false);
  return (
    <>
      <motion.div
        variants={grid}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5"
      >
        {JOB_CATEGORIES.map((cat, i) => (
          <CategoryTile key={cat.key} cat={cat} hiddenOnPhone={!showAll && i >= PHONE_FIRST} />
        ))}
      </motion.div>
      {!showAll && (
        <div className="sm:hidden mt-5 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="h-11 px-6 rounded-full border border-zinc-300 bg-white text-sm font-semibold text-zinc-800"
          >
            Show all {JOB_CATEGORIES.length} categories
          </button>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-zinc-500">
        Do not see your field? <Link to="/jobs" className="font-semibold text-emerald-700 hover:underline">Browse all jobs</Link>
      </p>
    </>
  );
};

export default CategoryCards;
