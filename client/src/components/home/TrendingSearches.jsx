import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingUp } from 'lucide-react';
import MotionIcon from './MotionIcon';

// Chips that rise out of the phone screen: horizontal drift (px), rise height (px), start delay (s).
// On phones the paths are scaled down via --k so chips stay on screen.
// They only drift up and to the right, toward the text, so they never cross her face
// (which sits left of the phone); the sideways drift stays small so they rise past the
// heading instead of across it.
const FLOW_PATHS = [
  { dx: 10, dy: -240, delay: 0 },
  { dx: 60, dy: -200, delay: 1.1 },
  { dx: 35, dy: -260, delay: 2.2 },
  { dx: 70, dy: -225, delay: 3.3 },
  { dx: -5, dy: -210, delay: 4.4 },
  { dx: 50, dy: -250, delay: 5.5 },
];

// Where the blank screen sits in the source photo (1543×1928; girl-phone.webp is the same
// image scaled): centre, size and tilt measured from its edges, drawn ~1% oversize so no
// white rim shows. Percentages keep it locked to the photo at any width.
const SRC_W = 1543;
const SRC_H = 1928;
const SCREEN = {
  left: `${(1242.7 / SRC_W) * 100}%`,
  top: `${(678 / SRC_H) * 100}%`,
  width: `${(278 / SRC_W) * 100}%`,
  height: `${(597 / SRC_H) * 100}%`,
  rotate: -2.5,
  radius: '15% / 7%',
};

// One pastel per chip, cycling; full class strings so Tailwind keeps them.
const TINTS = [
  { chip: 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100 hover:border-sky-300', icon: 'text-sky-500', dot: 'bg-sky-500' },
  { chip: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100 hover:border-orange-300', icon: 'text-orange-500', dot: 'bg-orange-500' },
  { chip: 'bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100 hover:border-violet-300', icon: 'text-violet-500', dot: 'bg-violet-500' },
  { chip: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300', icon: 'text-emerald-500', dot: 'bg-emerald-500' },
  { chip: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 hover:border-rose-300', icon: 'text-rose-500', dot: 'bg-rose-500' },
  { chip: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 hover:border-amber-300', icon: 'text-amber-500', dot: 'bg-amber-500' },
  { chip: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100 hover:border-teal-300', icon: 'text-teal-500', dot: 'bg-teal-500' },
  { chip: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100 hover:border-indigo-300', icon: 'text-indigo-500', dot: 'bg-indigo-500' },
];

const EASE = [0.22, 1, 0.36, 1];
const VIEW = { once: true, margin: '-100px' };

// Entrance, played once when the section scrolls into view.
const stageIn = { hidden: {}, show: {} };
const archIn = {
  hidden: { opacity: 0, scaleY: 0.4 },
  show: { opacity: 1, scaleY: 1, transition: { duration: 0.9, ease: EASE } },
};
const girlIn = {
  hidden: { opacity: 0, y: 70 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 110, damping: 18, delay: 0.25 } },
};
const textIn = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };
const wordRise = { hidden: { y: '110%' }, show: { y: '0%', transition: { duration: 0.7, ease: EASE } } };
const chipsIn = { hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.35 } } };
const chipPop = {
  hidden: { opacity: 0, scale: 0.5, y: 16, rotate: -8 },
  show: { opacity: 1, scale: 1, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 380, damping: 20 } },
};

// A young woman holding out her phone, with the site's own mobile homepage scrolling on
// its screen. Each trending search "shares" out of the screen: a ripple pulses on the
// glass as a chip launches and floats up. Decorative: the clickable list sits beside it.
const PhoneStage = ({ terms }) => (
  <motion.div className="relative mx-auto w-full max-w-[520px]" aria-hidden="true" variants={stageIn} initial="hidden" whileInView="show" viewport={VIEW}>
    {/* Backdrop: a soft arch behind her, an offset outline ring and a faint dot texture,
        faded at the bottom the same way as the photo. */}
    <motion.div
      variants={archIn}
      className="absolute inset-0 origin-bottom"
      style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 98%)', maskImage: 'linear-gradient(to bottom, black 70%, transparent 98%)' }}
    >
      <div className="absolute left-[12%] right-[6%] top-[14%] bottom-0 rounded-t-full bg-gradient-to-b from-emerald-100 via-[#e6f7f1] to-sky-50" />
      <div className="absolute left-[7%] right-[11%] top-[10%] bottom-0 rounded-t-full border border-emerald-200/70" />
      <div
        className="absolute left-[12%] right-[6%] top-[14%] bottom-0 rounded-t-full opacity-60"
        style={{ backgroundImage: 'radial-gradient(rgba(5,150,105,0.18) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
      />
    </motion.div>

    {/* Her photo, the screen on it and the chips move in as one */}
    <motion.div variants={girlIn} className="relative">
    <img
      src="/images/home/girl-phone.webp"
      alt=""
      loading="lazy"
      decoding="async"
      width="1100"
      height="1374"
      className="relative block w-full h-auto select-none"
      style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)' }}
    />

    {/* Screen content, fitted over the blank screen in the photo */}
    <div
      className="absolute overflow-hidden bg-white"
      style={{
        left: SCREEN.left, top: SCREEN.top, width: SCREEN.width, height: SCREEN.height,
        borderRadius: SCREEN.radius,
        transform: `translate(-50%, -50%) rotate(${SCREEN.rotate}deg)`,
      }}
    >
      <div
        className="phone-screen-scroll absolute inset-0"
        style={{ backgroundImage: 'url(/images/home/phone-homepage.webp)', backgroundSize: '100% auto', backgroundRepeat: 'no-repeat' }}
      />
      {FLOW_PATHS.map((p, i) => (
        <span
          key={i}
          className="share-ripple absolute left-1/2 top-[40%] w-[70%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#00D492] bg-[#00D492]/10"
          style={{ animationDelay: `${p.delay}s` }}
        />
      ))}
      {/* Dynamic Island and glass reflection */}
      <span className="absolute top-[2.4%] left-1/2 -translate-x-1/2 h-[5%] w-[30%] rounded-full bg-black" />
      <span className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0.06)_30%,transparent_45%)]" />
    </div>

    {/* Searches sharing out of the screen */}
    <div className="absolute z-20 pointer-events-none [--k:0.55] sm:[--k:1]" style={{ left: SCREEN.left, top: `${(580 / SRC_H) * 100}%` }}>
      {FLOW_PATHS.map((p, i) => (
        <span
          key={i}
          className="flow-chip absolute left-0 top-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-zinc-700 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.35)] ring-1 ring-zinc-200"
          style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, animationDelay: `${p.delay}s` }}
        >
          <Search size={12} className={TINTS[i % TINTS.length].icon} />
          {terms[i % terms.length]}
        </span>
      ))}
    </div>
    </motion.div>
  </motion.div>
);

const TrendingSearches = ({ terms, companies }) => (
  <section
    className="relative overflow-hidden py-20 bg-white"
    style={{ backgroundImage: 'radial-gradient(40% 45% at 95% 15%, rgba(56,189,248,0.10), transparent 70%), radial-gradient(30% 35% at 85% 60%, rgba(251,191,36,0.09), transparent 70%)' }}
  >
    <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
      <div className="min-w-0 lg:col-span-6 order-2 lg:order-1 pt-16 lg:pt-10">
        <PhoneStage terms={terms} />
      </div>

      <div className="min-w-0 lg:col-span-6 order-1 lg:order-2 text-center lg:text-left">
        <motion.div variants={textIn} initial="hidden" whileInView="show" viewport={VIEW}>
          <motion.span variants={fadeUp} className="inline-flex items-center gap-2 text-[#059669] text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <MotionIcon icon={TrendingUp} animation="bounce" size={14} /> Top Queries
          </motion.span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900">
            {['Trending', 'Searches'].map(word => (
              <React.Fragment key={word}>
                <span className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
                  <motion.span variants={wordRise} className="inline-block">{word}</motion.span>
                </span>{' '}
              </React.Fragment>
            ))}
          </h2>
          <motion.p variants={fadeUp} className="mt-3 text-zinc-600 text-sm md:text-base max-w-lg mx-auto lg:mx-0">
            The roles people search for most on Velaivaaipu. Tap one to see the open jobs.
          </motion.p>
        </motion.div>

        <motion.ul
          variants={chipsIn}
          initial="hidden"
          whileInView="show"
          viewport={VIEW}
          className="mt-8 flex flex-wrap justify-center lg:justify-start gap-2.5"
        >
          {terms.map((term, i) => {
            const t = TINTS[i % TINTS.length];
            return (
              <motion.li key={term} variants={chipPop}>
                <Link
                  to={`/jobs?q=${encodeURIComponent(term)}`}
                  className={`group inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${t.chip}`}
                >
                  <MotionIcon icon={Search} animation="wiggle" trigger="hover" size={13} className={t.icon} />
                  {term}
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>

        <motion.div
          className="mt-10"
          initial="hidden"
          whileInView="show"
          viewport={VIEW}
          variants={{ hidden: {}, show: { transition: { delayChildren: 0.7, staggerChildren: 0.2 } } }}
        >
          <motion.div
            variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.8, ease: EASE } } }}
            className="h-px origin-left bg-gradient-to-r from-sky-300 via-emerald-300 to-amber-300"
          />
          <motion.div variants={{ hidden: { opacity: 0, x: 30 }, show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } } }} className="pt-7">
            <p className="text-xs font-semibold text-zinc-500 mb-3">Companies hiring on Velaivaaipu</p>
            <div className="home-marquee-pause relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
              <div className="home-marquee flex gap-3 w-max py-1">
                {[...companies, ...companies].map((name, i) => (
                  <span key={i} className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white border border-zinc-200 pl-1 pr-3.5 py-1 text-xs font-semibold text-zinc-700 shadow-sm">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${TINTS[(i % companies.length) % TINTS.length].dot}`}>
                      {name.charAt(0)}
                    </span>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default TrendingSearches;
