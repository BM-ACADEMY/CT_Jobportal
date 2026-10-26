import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, useInView } from 'framer-motion';
import {
  Search, MapPin, FileText, Check, BadgeCheck, Building2, IndianRupee, Bell, Signal, Wifi, BatteryFull,
  Home, Briefcase, ClipboardList, User, LayoutDashboard, Users, UserCheck, Send, Upload,
} from 'lucide-react';

// Single brand colour (#138060, the header "Join free" green) for every step. Kept as an
// array so each step can still be given its own colour later. Full class strings so
// Tailwind keeps them.
const BRAND = {
  hex: '#138060', text: 'text-[#138060]', bg: 'bg-[#138060]', soft: 'bg-emerald-50', chip: 'bg-emerald-100 text-emerald-800',
  ring: 'ring-emerald-100', border: 'border-[#138060]', softBorder: 'border-emerald-100 hover:border-emerald-300',
  solid: 'bg-gradient-to-br from-[#179a73] to-[#0f6b50] shadow-emerald-800/25', glow: 'rgba(19,128,96,0.16)',
};
const TINTS = [BRAND, BRAND, BRAND];

const EASE = [0.22, 1, 0.36, 1];
// Opening animation, played once when the pinned panel first comes into view.
const openIn = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const openFade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };
const openRule = { hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.5, ease: EASE } } };
const openWord = { hidden: { y: '110%' }, show: { y: '0%', transition: { duration: 0.65, ease: EASE } } };
const openList = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } } };
const openCard = { hidden: { opacity: 0, x: -40 }, show: { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE } } };
const openBar = { hidden: { scaleY: 0 }, show: { scaleY: 1, transition: { duration: 0.7, delay: 0.3, ease: EASE } } };
const openPhone = {
  hidden: { opacity: 0, y: 90, rotate: 6 },
  show: { opacity: 1, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 90, damping: 16, delay: 0.25 } },
};
// The notification waits until the phone has landed.
const PHONE_LANDED_MS = 1100;

// Notification pop-out beside the phone: arrow and card share one start and one duration.
const ARROW_PATH = 'M 4 78 C 30 80, 34 22, 70 18';
const POP_DELAY = 0.3;
const POP_DUR = 0.5;
const listIn = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } };
const itemIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

// Per audience: the phone screens, the app's bottom tabs (and which tab each step shows),
// the signed-in user's initials and the floating notification beside the phone.
const AUDIENCES = {
  jobseeker: {
    user: 'PS',
    tabs: [['Home', Home], ['Jobs', Briefcase], ['Applied', ClipboardList], ['Profile', User]],
    tabForStep: [3, 1, 2],
    toasts: [
      { icon: UserCheck, title: 'Profile 80% complete', sub: 'Add 1 more skill' },
      { icon: Bell, title: '3 new matches', sub: 'Based on your skills' },
      { icon: BadgeCheck, title: 'Offer received', sub: 'Zoho · Frontend Developer' },
    ],
  },
  recruiter: {
    user: 'AT',
    tabs: [['Dashboard', LayoutDashboard], ['Jobs', Briefcase], ['Candidates', Users], ['Company', Building2]],
    tabForStep: [3, 1, 2],
    toasts: [
      { icon: BadgeCheck, title: 'Company verified', sub: 'Profile is live' },
      { icon: Send, title: 'Job published', sub: 'UI Designer · Chennai' },
      { icon: Users, title: '12 new applicants', sub: 'Sorted by match' },
    ],
  },
};

/* ---------- Mini app screens shown inside the phone ---------- */

const ScreenTitle = ({ children, sub }) => (
  <motion.div variants={itemIn} className="mb-3">
    <p className="text-[19px] font-bold tracking-tight text-zinc-900">{children}</p>
    {sub && <p className="text-[11px] text-zinc-500">{sub}</p>}
  </motion.div>
);

const Bar = ({ value, color }) => (
  <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
    <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, delay: 0.35, ease: EASE }} />
  </div>
);

const Logo = ({ name, cls }) => (
  <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-[12px] font-bold text-white ${cls}`}>{name[0]}</span>
);

const ProfileScreen = ({ t }) => (
  <motion.div variants={listIn} initial="hidden" animate="show" className="space-y-2.5">
    <ScreenTitle sub="Recruiters see this first">My profile</ScreenTitle>
    <motion.div variants={itemIn} className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3">
      <div className="relative">
        <div className={`w-12 h-12 rounded-full ${t.bg} text-white flex items-center justify-center font-bold`}>PS</div>
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center"><Check size={9} strokeWidth={4} className="text-white" /></span>
      </div>
      <div>
        <p className="text-[13px] font-bold text-zinc-900">Priya S.</p>
        <p className="text-[10.5px] text-zinc-500">Frontend Developer · Chennai</p>
      </div>
    </motion.div>
    <motion.div variants={itemIn} className="rounded-2xl border border-zinc-100 p-3">
      <div className="flex justify-between text-[11px] font-semibold text-zinc-700 mb-1.5"><span>Profile strength</span><span className={t.text}>80%</span></div>
      <Bar value={80} color={t.hex} />
    </motion.div>
    <motion.div variants={itemIn} className="flex items-center gap-2.5 rounded-2xl border border-dashed border-zinc-200 p-3">
      <span className={`w-8 h-8 rounded-lg ${t.soft} ${t.text} flex items-center justify-center`}><FileText size={15} /></span>
      <div className="flex-1">
        <p className="text-[11px] font-semibold text-zinc-800">Priya_Resume.pdf</p>
        <p className="text-[9.5px] text-zinc-400">240 KB</p>
      </div>
      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><Check size={12} /> Uploaded</span>
    </motion.div>
    <motion.div variants={itemIn}>
      <p className="text-[11px] font-semibold text-zinc-700 mb-1.5">Skills</p>
      <div className="flex flex-wrap gap-1.5">
        {['React', 'JavaScript', 'Tailwind', 'Figma'].map(s => <span key={s} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${t.chip}`}>{s}</span>)}
        <span className="rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-[10px] font-semibold text-zinc-400">+ Add</span>
      </div>
    </motion.div>
  </motion.div>
);

const JOBS = [
  { title: 'Frontend Developer', co: 'Zoho', loc: 'Chennai', pay: '6–9 LPA', match: 94, logo: 'bg-red-500' },
  { title: 'React Engineer', co: 'Freshworks', loc: 'Remote', pay: '8–12 LPA', match: 89, logo: 'bg-emerald-500' },
  { title: 'UI Developer', co: 'TCS', loc: 'Coimbatore', pay: '5–7 LPA', match: 82, logo: 'bg-indigo-500' },
];
const JobsScreen = ({ t }) => (
  <motion.div variants={listIn} initial="hidden" animate="show" className="space-y-2.5">
    <ScreenTitle sub="Matched to your skills">Jobs for you</ScreenTitle>
    <motion.div variants={itemIn} className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2.5 text-[11px] text-zinc-500">
      <Search size={13} /> Frontend Developer <span className="ml-auto flex items-center gap-0.5"><MapPin size={11} />Chennai</span>
    </motion.div>
    {JOBS.map((j, i) => (
      <motion.div key={j.title} variants={itemIn} className={`rounded-2xl border p-3 ${i === 0 ? `${t.border} border-[1.5px] shadow-md` : 'border-zinc-100 shadow-sm'}`}>
        <div className="flex items-start gap-2.5">
          <Logo name={j.co} cls={j.logo} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-zinc-900 truncate">{j.title}</p>
            <p className="text-[10px] text-zinc-500">{j.co}</p>
          </div>
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${t.chip}`}>{j.match}%</span>
        </div>
        <div className="mt-2 flex gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-0.5"><MapPin size={10} />{j.loc}</span>
          <span className="flex items-center gap-0.5"><IndianRupee size={10} />{j.pay}</span>
        </div>
      </motion.div>
    ))}
  </motion.div>
);

const TRACK = [['Applied', '12 Oct'], ['Shortlisted', '14 Oct'], ['Interview', '18 Oct'], ['Offer received', 'Today']];
const TrackerScreen = ({ t }) => (
  <motion.div variants={listIn} initial="hidden" animate="show" className="space-y-3">
    <ScreenTitle sub="Track every application live">Applications</ScreenTitle>
    <motion.div variants={itemIn} className="flex items-center gap-2.5 rounded-2xl border border-zinc-100 p-3 shadow-sm">
      <Logo name="Zoho" cls="bg-red-500" />
      <div>
        <p className="text-[12px] font-bold text-zinc-900">Frontend Developer</p>
        <p className="text-[10px] text-zinc-500">Zoho · Chennai</p>
      </div>
    </motion.div>
    <motion.ol variants={listIn} className="relative pl-7 space-y-2.5">
      <span className="absolute left-[9px] top-1.5 bottom-1.5 w-0.5 bg-zinc-200" />
      {TRACK.map(([s, d], i) => {
        const last = i === TRACK.length - 1;
        return (
          <motion.li key={s} variants={itemIn} className="relative flex items-center justify-between">
            <span className={`absolute -left-7 w-5 h-5 rounded-full flex items-center justify-center text-white ${last ? t.bg : 'bg-zinc-800'}`}>
              <Check size={11} strokeWidth={3} />
            </span>
            <span className={`text-[11px] font-semibold ${last ? t.text : 'text-zinc-700'}`}>{s}</span>
            <span className="text-[9.5px] text-zinc-400">{d}</span>
          </motion.li>
        );
      })}
    </motion.ol>
    <motion.div variants={itemIn} className={`rounded-2xl ${t.soft} p-3.5 text-center`}>
      <BadgeCheck size={26} className={`mx-auto ${t.text}`} />
      <p className="mt-1 text-[13px] font-bold text-zinc-900">You're hired!</p>
      <p className="text-[10px] text-zinc-500">Your offer letter is ready</p>
      <span className={`mt-2 inline-block rounded-lg ${t.bg} px-3 py-1.5 text-[10px] font-bold text-white`}>View offer</span>
    </motion.div>
  </motion.div>
);

const CompanyScreen = ({ t }) => (
  <motion.div variants={listIn} initial="hidden" animate="show" className="space-y-2.5">
    <ScreenTitle sub="What candidates see">Company profile</ScreenTitle>
    <motion.div variants={itemIn} className={`h-16 rounded-2xl ${t.soft}`} style={{ backgroundImage: `linear-gradient(135deg, ${t.hex}33, transparent)` }} />
    <motion.div variants={itemIn} className="flex items-end gap-3 -mt-9 px-2">
      <div className={`w-12 h-12 rounded-xl ${t.bg} text-white flex items-center justify-center ring-4 ring-white`}><Building2 size={20} /></div>
      <div className="pb-0.5">
        <p className="flex items-center gap-1 text-[13px] font-bold text-zinc-900">Acme Tech <BadgeCheck size={13} className={t.text} /></p>
        <p className="text-[10px] text-zinc-500">IT Services · Chennai</p>
      </div>
    </motion.div>
    {[['Team size', '201–500'], ['Open roles', '12'], ['Hiring in', 'Chennai, Remote']].map(([k, v]) => (
      <motion.div key={k} variants={itemIn} className="flex justify-between rounded-xl border border-zinc-100 px-3 py-2.5 text-[11px]">
        <span className="text-zinc-500">{k}</span><span className="font-semibold text-zinc-800">{v}</span>
      </motion.div>
    ))}
  </motion.div>
);

const PostJobScreen = ({ t }) => (
  <motion.div variants={listIn} initial="hidden" animate="show" className="space-y-2.5">
    <ScreenTitle sub="Live in minutes">Post a job</ScreenTitle>
    {[['Job title', 'UI Designer'], ['Location', 'Chennai'], ['Salary', '₹6–9 LPA']].map(([k, v]) => (
      <motion.div key={k} variants={itemIn}>
        <p className="text-[10px] font-semibold text-zinc-500 mb-1">{k}</p>
        <div className="rounded-xl border border-zinc-200 px-3 py-2 text-[11px] font-semibold text-zinc-800">{v}</div>
      </motion.div>
    ))}
    <motion.div variants={itemIn} className="flex gap-1.5">
      {['Full-time', 'Hybrid', '2–4 yrs'].map(s => <span key={s} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${t.chip}`}>{s}</span>)}
    </motion.div>
    <motion.div variants={itemIn} className={`flex items-center justify-center gap-1.5 rounded-xl ${t.bg} py-2.5 text-[12px] font-bold text-white`}>
      <Upload size={13} /> Publish job
    </motion.div>
  </motion.div>
);

const CANDIDATES = [['AK', 'Arun K.', '4 yrs · React', 96], ['DM', 'Divya M.', '3 yrs · Figma', 91], ['SR', 'Sanjay R.', '5 yrs · UI/UX', 87]];
const CandidatesScreen = ({ t }) => (
  <motion.div variants={listIn} initial="hidden" animate="show" className="space-y-2.5">
    <ScreenTitle sub="UI Designer · 12 applicants">Candidates</ScreenTitle>
    {CANDIDATES.map(([ini, name, meta, score], i) => (
      <motion.div key={name} variants={itemIn} className={`flex items-center gap-2.5 rounded-2xl border p-2.5 ${i === 0 ? `${t.border} border-[1.5px] shadow-md` : 'border-zinc-100 shadow-sm'}`}>
        <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${i === 0 ? t.bg : 'bg-zinc-700'}`}>{ini}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-zinc-900">{name}</p>
          <p className="text-[10px] text-zinc-500">{meta} · {score}%</p>
        </div>
        <span className={`rounded-lg px-2 py-1 text-[9.5px] font-bold ${i === 0 ? `${t.bg} text-white` : 'bg-zinc-100 text-zinc-700'}`}>{i === 0 ? 'Shortlisted' : 'Review'}</span>
      </motion.div>
    ))}
  </motion.div>
);

const SCREENS = {
  jobseeker: [ProfileScreen, JobsScreen, TrackerScreen],
  recruiter: [CompanyScreen, PostJobScreen, CandidatesScreen],
};

/* ---------- Phone ---------- */

const TITANIUM = 'linear-gradient(145deg,#eceef0 0%,#a7aab0 20%,#5f6268 46%,#b3b6bb 72%,#e8e9eb 100%)';

// An iPhone-style frame around a mini Velaivaaipu app: status bar, app header with the real
// logo, the step's screen, and a bottom tab bar whose active tab follows the step.
const Phone = ({ audience, step, t, children, className = '' }) => {
  const a = AUDIENCES[audience];
  const activeTab = a.tabForStep[step] ?? 0;
  return (
    <div className={`relative w-[290px] h-[600px] ${className}`}>
      {/* Side buttons */}
      <span className="absolute -left-[3px] top-[104px] h-7 w-[4px] rounded-l-sm" style={{ background: TITANIUM }} />
      <span className="absolute -left-[3px] top-[150px] h-12 w-[4px] rounded-l-sm" style={{ background: TITANIUM }} />
      <span className="absolute -left-[3px] top-[210px] h-12 w-[4px] rounded-l-sm" style={{ background: TITANIUM }} />
      <span className="absolute -right-[3px] top-[170px] h-20 w-[4px] rounded-r-sm" style={{ background: TITANIUM }} />

      <div className="h-full w-full rounded-[52px] p-[3px] shadow-[0_50px_100px_-40px_rgba(15,23,42,0.55),0_20px_40px_-20px_rgba(15,23,42,0.3)]" style={{ background: TITANIUM }}>
        <div className="h-full w-full rounded-[49px] bg-black p-[8px]">
          <div className="relative h-full w-full overflow-hidden rounded-[41px] bg-white text-left">
            {/* Status bar + Dynamic Island */}
            <div className="absolute inset-x-0 top-0 z-30 flex h-11 items-center justify-between px-7 pt-1 text-[12px] font-semibold text-zinc-900">
              <span>9:41</span>
              <span className="flex items-center gap-1"><Signal size={12} strokeWidth={2.75} /><Wifi size={12} strokeWidth={2.75} /><BatteryFull size={17} strokeWidth={2} /></span>
            </div>
            <span className="absolute z-40 top-[11px] left-1/2 -translate-x-1/2 h-[26px] w-[88px] rounded-full bg-black" />

            {/* App header with the real logo */}
            <div className="absolute inset-x-0 top-11 z-20 flex items-center justify-between px-4 py-2 bg-white/95 border-b border-zinc-100">
              <img src="/velaivaaipu-mark.png" alt="" className="h-5 w-auto" />
              <span className="flex items-center gap-2.5">
                <span className="relative text-zinc-600"><Bell size={16} /><span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" /></span>
                <span className={`w-7 h-7 rounded-full ${t.soft} ${t.text} flex items-center justify-center text-[10px] font-bold ring-1 ring-zinc-200`} aria-hidden="true">{a.user}</span>
              </span>
            </div>

            {/* Screen */}
            <div className="absolute inset-x-0 top-[92px] bottom-[64px] overflow-hidden px-4 pt-3">
              {children}
            </div>

            {/* Bottom tab bar */}
            <div className="absolute inset-x-0 bottom-0 z-20 h-[64px] border-t border-zinc-100 bg-white/95 px-3 pb-3 pt-1.5 grid grid-cols-4">
              {a.tabs.map(([label, Icon], i) => (
                <span key={label} className={`flex flex-col items-center gap-0.5 text-[9px] font-semibold transition-colors duration-300 ${i === activeTab ? t.text : 'text-zinc-400'}`}>
                  <Icon size={17} strokeWidth={i === activeTab ? 2.4 : 1.8} />
                  {label}
                </span>
              ))}
            </div>
            <span className="absolute z-30 bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-28 rounded-full bg-zinc-900/80" />

            {/* Glass reflection */}
            <span className="pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(118deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.05)_26%,transparent_40%)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Section ---------- */

const PHONE_H = 600;
// Shrinks the phone on short laptop screens so it always fits under the header.
const usePhoneScale = () => {
  const calc = () => (typeof window === 'undefined' ? 1 : Math.min(1, Math.max(0.7, (window.innerHeight - 128) / PHONE_H)));
  const [scale, setScale] = useState(calc);
  useEffect(() => {
    const onResize = () => setScale(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
};

// Pinned "scroll story": the section holds still under the header while the page scrolls
// through it; the active step on the left and the phone screen on the right change in turn.
// Phones and tablets get a plain stacked version instead.
const StepStory = ({ eyebrow = 'Simple Process', title, steps, audience = 'jobseeker' }) => {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const phoneScale = usePhoneScale();
  const n = steps.length;
  const aud = AUDIENCES[audience] ? audience : 'jobseeker';
  const screens = SCREENS[aud];
  const { toasts } = AUDIENCES[aud];

  const panelRef = useRef(null);
  const opened = useInView(panelRef, { once: true, amount: 0.35 });
  const [toastReady, setToastReady] = useState(false);
  useEffect(() => {
    if (!opened) return undefined;
    const id = setTimeout(() => setToastReady(true), PHONE_LANDED_MS);
    return () => clearTimeout(id);
  }, [opened]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = Math.min(n - 1, Math.max(0, Math.floor(p * n * 0.9999)));
    setActive(prev => (prev === next ? prev : next));
  });
  const fill = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const goTo = (i) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + range * ((i + 0.5) / n), behavior: 'smooth' });
  };

  const t = TINTS[active % TINTS.length];
  const Screen = screens[active] || screens[0];
  const toast = toasts[active];

  return (
    <>
      {/* Desktop: pinned story */}
      <section ref={ref} className="relative hidden lg:block bg-white" style={{ height: `calc(${n * 80 + 40}vh + 5rem)`, paddingBottom: '5rem', contentVisibility: 'visible' }}>
        <div ref={panelRef} className="sticky top-20 h-[calc(100vh-5rem)] flex items-center">
          {/* Colour wash that follows the active step */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ backgroundImage: `radial-gradient(38% 60% at 72% 52%, ${t.glow}, transparent 70%)` }}
            transition={{ duration: 0.6 }}
          />

          <motion.div
            className="relative max-w-6xl mx-auto w-full px-6 grid grid-cols-12 gap-8 items-center"
            variants={openIn}
            initial="hidden"
            animate={opened ? 'show' : 'hidden'}
          >
            {/* Left: title and steps */}
            <motion.div variants={openIn} className="col-span-6 xl:col-span-6">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#059669]">
                <motion.span variants={openRule} className="w-8 h-px origin-left bg-[#00D492]/50" />
                <motion.span variants={openFade}>{eyebrow}</motion.span>
              </span>
              <h2 className="mt-3 text-4xl xl:text-[2.75rem] font-bold tracking-tight leading-[1.1] text-zinc-900 max-w-md">
                {title.split(' ').map((word, i) => (
                  <React.Fragment key={i}>
                    <span className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em]">
                      <motion.span variants={openWord} className="inline-block">{word}</motion.span>
                    </span>{' '}
                  </React.Fragment>
                ))}
              </h2>

              <div className="relative mt-8 flex gap-4">
                {/* Slim progress bar beside the list, filling as the page scrolls */}
                <motion.span variants={openBar} className="relative w-1 shrink-0 origin-top rounded-full bg-zinc-100 overflow-hidden" aria-hidden="true">
                  <motion.span className="absolute inset-x-0 top-0 rounded-full bg-[#138060]" style={{ height: fill }} />
                </motion.span>

                <motion.ol variants={openList} className="flex-1 space-y-3">
                  {steps.map((step, i) => {
                    const on = i === active;
                    const done = i < active;
                    const st = TINTS[i % TINTS.length];
                    return (
                      <motion.li key={step.title} variants={openCard}>
                        <button
                          type="button"
                          onClick={() => goTo(i)}
                          aria-current={on ? 'step' : undefined}
                          className={`flex w-full items-start gap-4 rounded-2xl border px-4 text-left transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${on ? `${st.solid} border-transparent py-4 shadow-xl` : `${st.soft} ${st.softBorder} py-3 hover:shadow-md`}`}
                        >
                          {/* The step's own icon; finished steps get a small tick badge */}
                          <span
                            className={`relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-300 ${on ? `bg-white ${st.text} shadow-sm` : done ? `${st.bg} text-white` : `bg-white ${st.text} border ${st.softBorder}`}`}
                          >
                            <step.icon size={20} strokeWidth={2} />
                            {done && (
                              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white ring-2 ring-emerald-50 flex items-center justify-center">
                                <Check size={11} strokeWidth={3.5} className={st.text} />
                              </span>
                            )}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className={`block text-[11px] font-bold uppercase tracking-wider ${on ? 'text-white/80' : st.text}`}>
                              Step {i + 1}{done ? ' · Done' : ''}
                            </span>
                            <span className={`block text-lg font-bold leading-snug ${on ? 'text-white' : 'text-zinc-800'}`}>{step.title}</span>
                            <AnimatePresence initial={false}>
                              {on && (
                                <motion.span
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.35, ease: EASE }}
                                  className="block overflow-hidden"
                                >
                                  <span className="block pt-1 text-sm text-white/90 leading-relaxed">{step.desc}</span>
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </motion.ol>
              </div>

            </motion.div>

            {/* Right: phone with a floating notification */}
            <motion.div variants={openPhone} className="col-span-6 flex justify-center pr-28">
              <div className="relative" style={{ transform: `scale(${phoneScale})`, transformOrigin: 'center' }}>
                <div style={{ transform: 'perspective(1600px) rotateY(-10deg) rotateX(3deg)' }}>
                  <Phone audience={aud} step={active} t={t}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -24 }}
                        transition={{ duration: 0.35, ease: EASE }}
                      >
                        <Screen t={t} />
                      </motion.div>
                    </AnimatePresence>
                  </Phone>
                </div>

                {/* Arrow and notification as one group, so they arrive and leave together:
                    the dashed curve draws from the phone while the card slides in alongside,
                    and the arrowhead lands on the card as both finish. */}
                <AnimatePresence mode="wait">
                  {toastReady && <motion.div
                    key={active}
                    className="absolute left-[calc(100%-14px)] top-[calc(50%-6px)] z-10"
                    exit={{ opacity: 0, transition: { duration: 0.18 } }}
                  >
                    <svg width="84" height="90" viewBox="0 0 84 90" fill="none" className="overflow-visible" aria-hidden="true">
                      <defs>
                        <mask id={`stepstory-arrow-${active}`} maskUnits="userSpaceOnUse">
                          <motion.path
                            d={ARROW_PATH}
                            stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: POP_DUR, delay: POP_DELAY, ease: 'easeInOut' }}
                          />
                        </mask>
                      </defs>
                      <motion.circle
                        cx="4" cy="78" r="4" fill="#18181b"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2, delay: POP_DELAY }}
                      />
                      <path
                        d={ARROW_PATH}
                        stroke="#18181b" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round"
                        mask={`url(#stepstory-arrow-${active})`}
                      />
                      <motion.path
                        d="M 63 12 L 72 18 L 63 24"
                        stroke="#18181b" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: POP_DELAY + POP_DUR - 0.12, duration: 0.15 }}
                      />
                    </svg>

                    <motion.div
                      initial={{ opacity: 0, x: -24, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: POP_DUR, delay: POP_DELAY, ease: 'easeInOut' }}
                      className="absolute left-[73px] -top-[14px] flex items-center gap-3 whitespace-nowrap rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)]"
                    >
                      <span className={`w-10 h-10 rounded-xl ${t.soft} ${t.text} flex items-center justify-center`}><toast.icon size={18} /></span>
                      <span className="leading-tight">
                        <span className="block text-sm font-bold text-zinc-900">{toast.title}</span>
                        <span className="block text-[11px] text-zinc-500">{toast.sub}</span>
                      </span>
                    </motion.div>
                  </motion.div>}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Phones and tablets: stacked steps */}
      <section className="lg:hidden py-20 bg-white">
        <div className="max-w-xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] mb-4 text-[#059669]">{eyebrow}</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">{title}</h2>
          </motion.div>
          <ol className="space-y-16">
            {steps.map((step, i) => {
              const st = TINTS[i % TINTS.length];
              const S = screens[i] || screens[0];
              return (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="text-center"
                >
                  <span className={`mx-auto w-12 h-12 rounded-2xl ${st.bg} text-white flex items-center justify-center shadow-lg ring-4 ${st.ring}`}><step.icon size={20} /></span>
                  <p className={`mt-4 text-[11px] font-bold uppercase tracking-wider ${st.text}`}>Step {i + 1}</p>
                  <h3 className="mt-1 text-xl font-bold text-zinc-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{step.desc}</p>
                  <div className="mt-6 flex justify-center h-[540px]">
                    <Phone audience={aud} step={i} t={st} className="scale-90 origin-top"><S t={st} /></Phone>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </section>
    </>
  );
};

export default StepStory;
