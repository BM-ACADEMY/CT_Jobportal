import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Timer, Eye } from 'lucide-react';
import MotionIcon from './MotionIcon';

const EASE = [0.22, 1, 0.36, 1];
const VIEW = { once: true, margin: '-100px' };

const POINTS = [
  { icon: Timer, title: 'Takes 10 minutes', sub: 'Short, focused questions' },
  { icon: BadgeCheck, title: 'Verified skill badge', sub: 'Added to your profile' },
  { icon: Eye, title: 'Seen by recruiters', sub: 'Stand out in searches' },
];

// Entrance: text side staggers in; the visual builds panel → photo.
const textIn = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };
const wordRise = { hidden: { y: '110%' }, show: { y: '0%', transition: { duration: 0.65, ease: EASE } } };
const pointIn = { hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } } };
const stageIn = { hidden: {}, show: {} };
// Desktop band: wipes in from the right screen edge (rounded on its left side).
const bandIn = {
  hidden: { clipPath: 'inset(0% 0% 0% 100% round 64px 0px 0px 64px)' },
  show: { clipPath: 'inset(0% 0% 0% 0% round 64px 0px 0px 64px)', transition: { duration: 1, ease: EASE } },
};
const photoIn = { hidden: { opacity: 0, y: 70 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 16, delay: 0.55 } } };
const SkillAssessment = () => (
  <motion.section
    className="relative overflow-hidden py-24 bg-white"
    initial="hidden"
    whileInView="show"
    viewport={VIEW}
  >
    {/* Desktop: the original slanted brand shape, running off the right screen edge */}
    <div className="hidden lg:block absolute right-[-120px] top-[12%] bottom-[12%] left-[56%] pointer-events-none" aria-hidden="true">
      <motion.div
        variants={bandIn}
        className="absolute inset-0 -skew-x-12 overflow-hidden bg-gradient-to-br from-[#179a73] via-[#138060] to-[#0d5c45] shadow-[0_25px_50px_-12px_rgba(19,128,96,0.35)]"
      >
        <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute -top-20 right-40 w-64 h-64 rounded-full border-[32px] border-white/10" />
      </motion.div>
    </div>

    <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">
      {/* Text */}
      <motion.div variants={textIn} initial="hidden" whileInView="show" viewport={VIEW} className="text-center lg:text-left">
        <motion.span variants={fadeUp} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#138060]">
          <span className="w-8 h-px bg-[#138060]/40" /> Free Skill Assessment
        </motion.span>
        <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight leading-[1.12] text-zinc-900">
          {'Test Your Skills for Free'.split(' ').map((word, i) => (
            <React.Fragment key={i}>
              <span className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em]">
                <motion.span variants={wordRise} className="inline-block">{word}</motion.span>
              </span>{' '}
            </React.Fragment>
          ))}
        </h2>
        <motion.p variants={fadeUp} className="mt-4 text-zinc-600 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
          Take a quick skill assessment and prove your expertise. Earn verified badges that make your profile stand out to recruiters.
        </motion.p>

        <motion.ul variants={textIn} className="mt-7 grid sm:grid-cols-3 gap-3 text-left">
          {POINTS.map(p => (
            <motion.li key={p.title} variants={pointIn} className="group flex sm:flex-col items-center sm:items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 transition-colors hover:border-emerald-300">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-[#138060] text-white flex items-center justify-center">
                <MotionIcon icon={p.icon} animation="pop" trigger="hover" size={17} />
              </span>
              <span>
                <span className="block text-sm font-bold text-zinc-900">{p.title}</span>
                <span className="block text-xs text-zinc-500">{p.sub}</span>
              </span>
            </motion.li>
          ))}
        </motion.ul>

        <motion.div variants={fadeUp} className="mt-8">
          <Link
            to="/free-assessment"
            className="group home-shine relative overflow-hidden inline-flex items-center gap-2 rounded-full bg-[#138060] pl-7 pr-2 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-800/20 transition-all hover:bg-[#0f664d] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Take Free Assessment
            <span className="w-9 h-9 rounded-full bg-white text-[#138060] flex items-center justify-center">
              <MotionIcon icon={ArrowRight} animation="nudge" trigger="hover" size={16} />
            </span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Visual: desktop only; below lg the section is just the text */}
      <motion.div variants={stageIn} className="hidden lg:block relative mx-auto w-full max-w-[520px] h-[500px]">
        <motion.div variants={photoIn} className="absolute inset-x-0 -bottom-6 flex justify-center pointer-events-none">
          <img
            src="images/gir-large.png"
            alt="Candidate taking a free skill assessment"
            loading="lazy"
            decoding="async"
            className="h-[470px] w-auto object-contain select-none scale-x-[-1]"
          />
        </motion.div>
      </motion.div>
    </div>
  </motion.section>
);

export default SkillAssessment;
