import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Code2, Stethoscope, BarChart2, Palette, ShoppingBag, Cpu, GraduationCap, HeartHandshake,
} from 'lucide-react';
import MotionIcon from './MotionIcon';

// Full class strings per tint so Tailwind can see them at build time.
const TINTS = {
  sky: { panel: 'bg-sky-50', icon: 'text-sky-600', chip: 'hover:border-sky-400 hover:text-sky-700', btn: 'group-hover:bg-sky-600', hint: 'text-sky-700', glow: 'hover:shadow-sky-500/15' },
  rose: { panel: 'bg-rose-50', icon: 'text-rose-600', chip: 'hover:border-rose-400 hover:text-rose-700', btn: 'group-hover:bg-rose-600', hint: 'text-rose-700', glow: 'hover:shadow-rose-500/15' },
  amber: { panel: 'bg-amber-50', icon: 'text-amber-600', chip: 'hover:border-amber-400 hover:text-amber-700', btn: 'group-hover:bg-amber-600', hint: 'text-amber-700', glow: 'hover:shadow-amber-500/15' },
  violet: { panel: 'bg-violet-50', icon: 'text-violet-600', chip: 'hover:border-violet-400 hover:text-violet-700', btn: 'group-hover:bg-violet-600', hint: 'text-violet-700', glow: 'hover:shadow-violet-500/15' },
  orange: { panel: 'bg-orange-50', icon: 'text-orange-600', chip: 'hover:border-orange-400 hover:text-orange-700', btn: 'group-hover:bg-orange-600', hint: 'text-orange-700', glow: 'hover:shadow-orange-500/15' },
  teal: { panel: 'bg-teal-50', icon: 'text-teal-600', chip: 'hover:border-teal-400 hover:text-teal-700', btn: 'group-hover:bg-teal-600', hint: 'text-teal-700', glow: 'hover:shadow-teal-500/15' },
  indigo: { panel: 'bg-indigo-50', icon: 'text-indigo-600', chip: 'hover:border-indigo-400 hover:text-indigo-700', btn: 'group-hover:bg-indigo-600', hint: 'text-indigo-700', glow: 'hover:shadow-indigo-500/15' },
  emerald: { panel: 'bg-emerald-50', icon: 'text-emerald-600', chip: 'hover:border-emerald-400 hover:text-emerald-700', btn: 'group-hover:bg-emerald-600', hint: 'text-emerald-700', glow: 'hover:shadow-emerald-500/15' },
};

const CATEGORIES = [
  { label: 'IT & Software', count: '45K', icon: Code2, tint: 'sky', anim: 'pulse', desc: 'Build products, apps and the systems behind them.', roles: ['Frontend', 'Backend', 'Full Stack', 'DevOps'] },
  { label: 'Healthcare', count: '15K', icon: Stethoscope, tint: 'rose', anim: 'bounce', desc: 'Care for patients across hospitals, clinics and labs.', roles: ['Staff Nurse', 'Pharmacist', 'Lab Technician', 'Medical Coder'] },
  { label: 'Finance', count: '18K', icon: BarChart2, tint: 'amber', anim: 'tilt', desc: 'Manage money, risk and reporting for growing businesses.', roles: ['Accountant', 'Financial Analyst', 'Auditor'] },
  { label: 'Design', count: '9K', icon: Palette, tint: 'violet', anim: 'wiggle', desc: 'Shape how products look, feel and work.', roles: ['UI/UX Designer', 'Graphic Designer', 'Motion Designer'] },
  { label: 'Sales', count: '22K', icon: ShoppingBag, tint: 'orange', anim: 'bounce', desc: 'Find customers and grow revenue in every region.', roles: ['Sales Executive', 'Business Development', 'Inside Sales'] },
  { label: 'Engineering', count: '30K', icon: Cpu, tint: 'teal', anim: 'spin', desc: 'Design, build and maintain plants, sites and machines.', roles: ['Mechanical', 'Civil', 'Electrical', 'Quality'] },
  { label: 'Education', count: '8K', icon: GraduationCap, tint: 'indigo', anim: 'tilt', desc: 'Teach, train and support learners of every age.', roles: ['School Teacher', 'Lecturer', 'Corporate Trainer'] },
  { label: 'Non-Profit', count: '5K', icon: HeartHandshake, tint: 'emerald', anim: 'pulse', desc: 'Work on causes that strengthen communities.', roles: ['Program Officer', 'Social Worker', 'CSR Executive'] },
];

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

// One card: tinted panel (title, description, role chips) above a white "Explore" footer.
// The footer link is stretched over the whole card; role chips sit above it as their own links.
const CategoryCard = ({ cat }) => {
  const t = TINTS[cat.tint];
  return (
    <motion.article
      variants={item}
      className={`group relative flex flex-col w-[82%] shrink-0 snap-start sm:w-auto rounded-[22px] bg-white border border-zinc-200/80 p-2 shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-xl ${t.glow}`}
    >
      <div className={`flex-1 rounded-2xl ${t.panel} p-5`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-zinc-900 leading-tight">{cat.label}</h3>
          <span className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${t.icon}`}>
            <MotionIcon icon={cat.icon} animation={cat.anim} trigger="hover" size={19} />
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-600 leading-snug">{cat.desc}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {cat.roles.map(role => (
            <li key={role}>
              <Link
                to={`/jobs?q=${encodeURIComponent(role)}`}
                className={`relative z-10 inline-block rounded-full bg-white/90 border border-zinc-200/80 px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${t.chip}`}
              >
                {role}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <Link
          to={`/jobs?category=${encodeURIComponent(cat.label)}`}
          aria-label={`Explore ${cat.count} ${cat.label} jobs`}
          className="text-sm font-semibold text-zinc-900 after:absolute after:inset-0 after:rounded-[22px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-emerald-500"
        >
          {/* "Explore" slides up and the live count slides in on hover */}
          <span className="block h-5 overflow-hidden">
            <span className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-5">
              <span className="h-5 leading-5">Explore</span>
              <span className={`h-5 leading-5 ${t.hint}`}>View {cat.count} jobs</span>
            </span>
          </span>
        </Link>
        <span className={`w-9 h-9 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center transition-colors duration-300 group-hover:text-white ${t.btn}`}>
          <MotionIcon icon={ArrowRight} animation="nudge" trigger="hover" size={16} />
        </span>
      </div>
    </motion.article>
  );
};

// Swipeable snap row on phones, 2 / 4 column grid from sm / lg.
const CategoryCards = () => (
  <>
    <motion.div
      variants={grid}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      className="no-scrollbar -mx-6 px-6 pb-4 flex gap-4 overflow-x-auto snap-x snap-mandatory sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 sm:overflow-visible"
    >
      {CATEGORIES.map(cat => <CategoryCard key={cat.label} cat={cat} />)}
    </motion.div>
    <p className="sm:hidden mt-2 text-center text-xs text-zinc-500">Swipe to see more categories</p>
  </>
);

export default CategoryCards;
