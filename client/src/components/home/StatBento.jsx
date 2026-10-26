import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import AnimatedStat from './AnimatedStat';
import MotionIcon from './MotionIcon';

const HOVER_ANIMS = ['bounce', 'pulse', 'wiggle', 'pop'];
const EASE = [0.22, 1, 0.36, 1];

const contentIn = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const statIn = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};
// One light sweep across the panel after it lands.
const sweepIn = {
  hidden: { x: '-120%' },
  show: { x: '320%', transition: { duration: 1.4, delay: 0.5, ease: 'easeInOut' } },
};

// Side inset when the band first appears: a little narrower than the page content
// (max-w-6xl = 1152px, minus padding), at least 28px on phones.
const START_INSET = 'max(28px, calc((100vw - 1104px) / 2 + 4vw))';
// Where it stops widening: a 10vw gap each side (~190px on a 1900px screen), never wider
// than the page content edge on laptops, and 12px on phones. Always smaller than START.
const END_INSET = 'max(12px, min(10vw, calc((100vw - 1104px) / 2)))';
const START_RADIUS = 32;
const END_RADIUS = 24;

// Brand-green band (#138060, the header CTA colour) with the platform numbers in white.
// It enters narrow and widens as the page scrolls, up to END_INSET (never edge to edge);
// the band is clipped rather than resized, so nothing reflows and the text never stretches.
// cards: [{ label, value, icon: LucideIcon, invert?: bool }]
const StatBento = ({ cards }) => {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.3'] });
  const clipPath = useTransform(scrollYProgress, (p) => {
    const t = reduceMotion ? 0 : Math.min(Math.max(p, 0), 1);
    const radius = Math.round(END_RADIUS + (START_RADIUS - END_RADIUS) * (1 - t));
    return `inset(0 calc(${END_INSET} + ${1 - t} * (${START_INSET} - ${END_INSET})) round ${radius}px)`;
  });

  return (
    <section ref={ref} className="py-14 bg-white overflow-hidden">
      <motion.div
        style={{ clipPath, WebkitClipPath: clipPath }}
        className="relative w-full overflow-hidden bg-gradient-to-br from-[#0d5c45] via-[#138060] to-[#1b9a72] will-change-[clip-path]"
      >
        {/* Texture and glows */}
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(35%_80%_at_10%_0%,rgba(52,182,120,0.35),transparent_70%),radial-gradient(30%_70%_at_90%_100%,rgba(0,212,146,0.22),transparent_70%)]" />

        <motion.div
          variants={contentIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="relative max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14"
        >
          <motion.div
            variants={sweepIn}
            className="absolute inset-y-0 left-0 w-1/3 pointer-events-none bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
            aria-hidden="true"
          />

          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-y-10 lg:divide-x lg:divide-white/15">
            {cards.map((s, i) => (
              <motion.div
                key={s.label}
                variants={statIn}
                className="group flex flex-col items-center text-center px-4"
              >
                <div className="w-14 h-14 rounded-full bg-white/10 ring-1 ring-white/25 text-white flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:text-[#047857] group-hover:scale-110">
                  <MotionIcon icon={s.icon} animation={HOVER_ANIMS[i % HOVER_ANIMS.length]} trigger="hover" size={24} className="stroke-[1.75]" />
                </div>
                <p className="mt-4 text-4xl md:text-5xl font-bold text-white tracking-tight tabular-nums">
                  <AnimatedStat value={s.value} />
                </p>
                <p className="mt-1.5 text-sm font-medium text-emerald-100/90">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default StatBento;
