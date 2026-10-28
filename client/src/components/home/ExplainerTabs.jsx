import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion, useInView } from 'framer-motion';
import {
  Users, Search, CheckCircle2, Award,
  Building2, Briefcase, UserCheck, Handshake,
  GraduationCap, UserPlus, CalendarCheck, TrendingUp,
  ArrowRight,
} from 'lucide-react';
import MotionIcon from './MotionIcon';

const FLOWS = [
  {
    key: 'jobseeker',
    label: 'Job Seeker',
    shortLabel: 'Job Seeker',
    steps: [
      { icon: Users, title: 'Create Your Profile', desc: 'Add your skills, resume and preferences.', tags: ['Resume', 'Skills', 'Preferences'], cta: 'Create profile', to: '/register', anim: 'bounce' },
      { icon: Search, title: 'Get Matched', desc: 'AI surfaces roles that fit your skills.', tags: ['AI matches', 'Job alerts', 'Saved searches'], cta: 'Browse jobs', to: '/jobs', anim: 'wiggle' },
      { icon: CheckCircle2, title: 'Apply Instantly', desc: 'One-click apply, track status live.', tags: ['One-click apply', 'Live status'], cta: 'Find a role', to: '/jobs', anim: 'pop' },
      { icon: Award, title: 'Get Hired', desc: 'Interview, offer, and start your new role.', tags: ['Interviews', 'Offers', 'Onboarding'], cta: 'Join free', to: '/register', anim: 'tilt' },
    ],
  },
  {
    key: 'recruiter',
    label: 'Recruiter / Company',
    shortLabel: 'Recruiter',
    steps: [
      { icon: Building2, title: 'Set Up Company Profile', desc: 'Showcase your brand to candidates.', tags: ['Brand page', 'Culture', 'Benefits'], cta: 'Register company', to: '/register', anim: 'bounce' },
      { icon: Briefcase, title: 'Post Jobs', desc: 'Publish roles in minutes, reach millions.', tags: ['Job templates', 'Screening questions'], cta: 'Post a job', to: '/register', anim: 'wiggle' },
      { icon: UserCheck, title: 'Review Candidates', desc: 'AI-ranked applicants, ATS pipeline.', tags: ['AI ranking', 'ATS pipeline', 'Notes'], cta: 'Company login', to: '/company-login', anim: 'pop' },
      { icon: Handshake, title: 'Hire With Confidence', desc: 'Schedule interviews, extend offers.', tags: ['Interviews', 'Offer letters'], cta: 'Start hiring', to: '/register', anim: 'tilt' },
    ],
  },
  {
    key: 'college',
    label: 'College / TPO',
    shortLabel: 'College',
    steps: [
      { icon: GraduationCap, title: 'Register Your College', desc: 'Get verified and onboarded.', tags: ['Verification', 'TPO account'], cta: 'Register college', to: '/register', anim: 'bounce' },
      { icon: UserPlus, title: 'Add Your Students', desc: 'Bulk-import student profiles.', tags: ['Bulk import', 'Profiles', 'Resumes'], cta: 'Get started', to: '/register', anim: 'wiggle' },
      { icon: CalendarCheck, title: 'Run Placement Drives', desc: 'Invite companies, manage rounds.', tags: ['Company invites', 'Rounds', 'Schedules'], cta: 'Get started', to: '/register', anim: 'pop' },
      { icon: TrendingUp, title: 'Track Placements', desc: 'Real-time reports for your management.', tags: ['Live reports', 'Offer stats'], cta: 'Get started', to: '/register', anim: 'tilt' },
    ],
  },
];

// One tint per step position (sky → peach → violet → mint). Full class strings so Tailwind sees them.
const STEP_TINTS = [
  { panel: 'bg-sky-50', chip: 'bg-sky-100/80 text-sky-800', badge: 'bg-sky-600', icon: 'text-sky-600', btn: 'group-hover:bg-sky-600', glow: 'hover:shadow-sky-500/15' },
  { panel: 'bg-orange-50', chip: 'bg-orange-100/80 text-orange-800', badge: 'bg-orange-500', icon: 'text-orange-500', btn: 'group-hover:bg-orange-500', glow: 'hover:shadow-orange-500/15' },
  { panel: 'bg-violet-50', chip: 'bg-violet-100/80 text-violet-800', badge: 'bg-violet-600', icon: 'text-violet-600', btn: 'group-hover:bg-violet-600', glow: 'hover:shadow-violet-500/15' },
  { panel: 'bg-emerald-50', chip: 'bg-emerald-100/80 text-emerald-800', badge: 'bg-emerald-600', icon: 'text-emerald-600', btn: 'group-hover:bg-emerald-600', glow: 'hover:shadow-emerald-500/15' },
];

// Heading reveal: the side rules draw outward, each word rises from behind a mask,
// then the subtitle fades up. Plays once when the heading scrolls into view.
const HEADING = 'One Platform, Three Journeys';
const headingContainer = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const wordRise = {
  hidden: { y: '110%', rotate: 6 },
  show: { y: '0%', rotate: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
const ruleDraw = (origin) => ({
  hidden: { scaleX: 0, originX: origin },
  show: { scaleX: 1, transition: { duration: 0.6, ease: 'easeOut' } },
});
const fadeUp = (delay) => ({
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: 'easeOut' } },
});

// Cards are dealt in: each one turns in on its vertical axis from the side the user
// is moving toward, staggered left to right; the old set turns away the other way.
const cardVariants = {
  enter: (dir) => ({ opacity: 0, rotateY: dir * -70, x: dir * 30, scale: 0.92 }),
  center: (i) => ({
    opacity: 1, rotateY: 0, x: 0, scale: 1,
    transition: { delay: i * 0.09, type: 'spring', stiffness: 170, damping: 20 },
  }),
  exit: (dir) => ({ opacity: 0, rotateY: dir * 70, x: dir * -30, scale: 0.92, transition: { duration: 0.22, ease: 'easeIn' } }),
};

const TILT_DEG = 8;

const StepCard = ({ step, index, dir }) => {
  const t = STEP_TINTS[index % STEP_TINTS.length];
  const reduceMotion = useReducedMotion();
  const ref = useRef(null);

  // Pointer position across the card, 0..1 on each axis (0.5 = centre).
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 20 };
  const rotateX = useSpring(useTransform(py, [0, 1], [TILT_DEG, -TILT_DEG]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-TILT_DEG, TILT_DEG]), spring);
  const glareX = useTransform(px, v => `${v * 100}%`);
  const glareY = useTransform(py, v => `${v * 100}%`);

  const onPointerMove = (e) => {
    if (reduceMotion || e.pointerType !== 'mouse') return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onPointerLeave = () => { px.set(0.5); py.set(0.5); };

  return (
    <motion.div
      custom={dir}
      variants={{ enter: cardVariants.enter, exit: cardVariants.exit, center: cardVariants.center(index) }}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ transformPerspective: 1100 }}
      className="relative"
    >
    <motion.article
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      whileHover={reduceMotion ? undefined : { scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`group relative h-full flex flex-col rounded-[22px] bg-white border border-zinc-200/80 p-2 shadow-sm transition-shadow duration-300 hover:shadow-2xl ${t.glow}`}
    >
      {/* Light glare that follows the cursor */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform([glareX, glareY], ([x, y]) => `radial-gradient(240px circle at ${x} ${y}, rgba(255,255,255,0.55), transparent 60%)`),
        }}
      />
      <div className={`flex-1 rounded-2xl ${t.panel} p-5`}>
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full text-[11px] font-bold text-white ${t.badge}`}>
            Step {index + 1}
          </span>
          <span className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${t.icon}`}>
            <MotionIcon icon={step.icon} animation={step.anim} trigger="hover" size={19} />
          </span>
        </div>
        <h3 className="mt-4 text-lg font-bold text-zinc-900 leading-tight">{step.title}</h3>
        <p className="mt-1.5 text-sm text-zinc-600 leading-snug">{step.desc}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {step.tags.map(tag => (
            <li key={tag} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${t.chip}`}>{tag}</li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <Link
          to={step.to}
          className="text-sm font-semibold text-zinc-900 after:absolute after:inset-0 after:rounded-[22px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-emerald-500"
        >
          {step.cta}
        </Link>
        <span className={`w-9 h-9 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center transition-colors duration-300 group-hover:text-white ${t.btn}`}>
          <MotionIcon icon={ArrowRight} animation="nudge" trigger="hover" size={16} />
        </span>
      </div>

    </motion.article>
    </motion.div>
  );
};

const ExplainerTabs = () => {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  // Cards are dealt in the first time the grid scrolls into view.
  const gridRef = useRef(null);
  const inView = useInView(gridRef, { once: true, margin: '-120px' });

  const goTo = (i) => {
    if (i === active) return;
    setDir(i > active ? 1 : -1);
    setActive(i);
  };

  const flow = FLOWS[active];

  return (
    <section className="py-24 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={headingContainer}
        >
          <span className="inline-flex items-center gap-2 text-[#059669] text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <motion.span variants={ruleDraw(1)} className="w-8 h-px bg-[#00D492]/60" />
            <motion.span variants={fadeUp(0.1)}>How It Works</motion.span>
            <motion.span variants={ruleDraw(0)} className="w-8 h-px bg-[#00D492]/60" />
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight">
            {HEADING.split(' ').map((word, i) => (
              <React.Fragment key={i}>
                <span className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
                  <motion.span variants={wordRise} className="inline-block origin-bottom-left">{word}</motion.span>
                </span>{' '}
              </React.Fragment>
            ))}
          </h2>
          <motion.p variants={fadeUp(0.45)} className="text-zinc-600 mt-3 font-medium text-sm md:text-base">
            See how job seekers, recruiters, and colleges each move through the platform.
          </motion.p>
        </motion.div>

        {/* Tabs: the active pill glides to the chosen journey */}
        {/* Phones: full-width three-part switch with short labels. sm+: compact pill. */}
        <div className="flex justify-center mb-10 sm:mb-12">
          <div className="grid grid-cols-3 w-full max-w-sm sm:inline-flex sm:w-auto sm:max-w-none gap-1 rounded-full bg-white border border-zinc-200 p-1 shadow-sm">
            {FLOWS.map((f, i) => (
              <button
                key={f.key}
                onClick={() => goTo(i)}
                aria-pressed={i === active}
                className={`relative overflow-hidden min-w-0 whitespace-nowrap px-2 sm:px-5 py-2.5 rounded-full text-[13px] sm:text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  i === active ? 'text-white' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                {i === active && (
                  <motion.span layoutId="journey-tab" className="absolute inset-0 rounded-full bg-[#059669] shadow-md shadow-emerald-600/25" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                <span className="relative sm:hidden">{f.shortLabel}</span>
                <span className="relative hidden sm:inline">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7 min-h-[300px]">
          <AnimatePresence mode="wait" custom={dir}>
            {inView && flow.steps.map((step, i) => (
              <StepCard key={`${flow.key}-${step.title}`} step={step} index={i} dir={dir} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default ExplainerTabs;
