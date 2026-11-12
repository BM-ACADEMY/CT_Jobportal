import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, MotionConfig, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, QrCode, FileSpreadsheet, CalendarCheck, FileBarChart,
  MessageCircle, ArrowRight, CheckCircle2, Building2, Award, BadgeCheck, Plus, Check, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '../components/seo/SEOHead';
import HeroShell from '@/components/home/HeroShell';
import Reveal from '@/components/home/Reveal';
import MotionIcon from '@/components/home/MotionIcon';
import HireCta from '@/components/home/HireCta';
import Footer from '@/components/home/Footer';
import BackToTop from '@/components/home/BackToTop';
import { trackEvent } from '../utils/analytics';
import {
  QrFinder, SignupVisual, CertificateVisual, CsvVisual, ReportVisual, WhatsAppVisual, DrivesVisual,
} from '@/components/college/BenefitVisuals';

const API = import.meta.env.VITE_API_BASE_URL;
const EASE = [0.22, 1, 0.36, 1];

const heroStagger = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } };
const heroItem = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };
const dealGrid = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const dealCard = {
  hidden: { opacity: 0, y: 40, rotate: -2 },
  show: { opacity: 1, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 160, damping: 20 } },
};

const SectionEyebrow = ({ children }) => (
  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] mb-4 text-[#059669]">
    <span className="w-8 h-px bg-[#00D492]/50 shrink-0" /> {children} <span className="w-8 h-px bg-[#00D492]/50 shrink-0" />
  </span>
);

// ── Step visuals: small pieces of the real dashboard ─────────────────────────
const VerifyVisual = () => (
  <div className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-sky-100">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center"><GraduationCap size={18} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-zinc-900 truncate">Your college</p>
        <p className="text-[11px] text-zinc-500">Placement cell · TPO account</p>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
        <BadgeCheck size={13} /> Verified
      </span>
    </div>
  </div>
);

const StudentsVisual = () => (
  <div className="flex items-stretch gap-3">
    <div className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-orange-100 shrink-0">
      <QrFinder className="w-[60px] h-[60px]" />
    </div>
    <div className="flex-1 min-w-0 rounded-xl bg-white p-3 shadow-sm ring-1 ring-orange-100 flex flex-col justify-center gap-1.5">
      <p className="flex items-center gap-1.5 text-[12px] font-bold text-zinc-900 truncate"><FileSpreadsheet size={14} className="text-emerald-600 shrink-0" /> students-cse.csv</p>
      <div className="h-1.5 rounded-full bg-orange-100 overflow-hidden">
        <div className="h-full w-full rounded-full bg-orange-400 origin-left animate-[college-fill_3.2s_ease-in-out_infinite] motion-reduce:animate-none" />
      </div>
      <p className="text-[11px] text-zinc-500">Accounts created by batch</p>
    </div>
  </div>
);

const DriveVisual = () => (
  <ul className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-emerald-100 space-y-2">
    {[['Aptitude round', 'done'], ['Technical interview', 'done'], ['HR round', 'live']].map(([label, state]) => (
      <li key={label} className="flex items-center gap-2.5 text-[12px] font-semibold text-zinc-800">
        {state === 'done'
          ? <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check size={12} strokeWidth={3} /></span>
          : <span className="relative w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" /></span>}
        <span className="flex-1">{label}</span>
        <span className={`text-[11px] font-bold ${state === 'done' ? 'text-zinc-400' : 'text-emerald-600'}`}>{state === 'done' ? 'Done' : 'In progress'}</span>
      </li>
    ))}
  </ul>
);

const steps = [
  { icon: GraduationCap, title: 'Register your college', desc: 'Sign up as the placement officer (TPO). Our team verifies your institution, usually within a working day.', tint: 'bg-sky-50', badge: 'bg-sky-600', Visual: VerifyVisual },
  { icon: QrCode, title: 'Get your students in', desc: 'Upload a CSV once, or put a QR code on the notice board. Students join with just a name and WhatsApp number.', tint: 'bg-orange-50', badge: 'bg-orange-500', Visual: StudentsVisual },
  { icon: CalendarCheck, title: 'Run your drives', desc: 'Create a drive, invite companies, move students through every round and see the status live.', tint: 'bg-emerald-50', badge: 'bg-emerald-600', Visual: DriveVisual },
];

const benefits = [
  { icon: QrCode, title: 'QR sign-up in 20 seconds', desc: 'No long forms and no password to remember. Students scan, enter a name and WhatsApp number, and take a skill test straight away.', span: 'lg:col-span-2', Visual: SignupVisual, split: true },
  { icon: Award, title: 'Certificates with your name on them', desc: 'Students who pass a skill test get an instant certificate. Paid plans add your college branding.', Visual: CertificateVisual },
  { icon: FileSpreadsheet, title: 'Bring your existing student list', desc: 'Bulk-upload a CSV by department and batch. Accounts are created for you.', Visual: CsvVisual },
  { icon: FileBarChart, title: 'Reports for your principal', desc: 'Placement numbers by drive and department, plus a one-link executive summary you can share with management.', span: 'lg:col-span-2', Visual: ReportVisual, split: true },
  { icon: MessageCircle, title: 'WhatsApp updates', desc: 'Students hear about new rounds and interview schedules on the app they already use.', span: 'lg:col-span-2', Visual: WhatsAppVisual, split: true },
  { icon: GraduationCap, title: 'Student internships in one view', desc: 'See which internships your students applied to, and who was shortlisted or selected, without chasing them.' },
  { icon: Building2, title: 'Free internships and walk-in drives', desc: 'Your students can find paid and unpaid internships from verified companies and join walk-in hiring drives near them, all free.' },
  { icon: Building2, title: 'Company drives in one place', desc: 'Invite companies to a drive, track who accepted, and keep every round and result together.', Visual: DrivesVisual },
];

const faqs = [
  { q: 'Will my students have to learn another portal?', a: 'No. At a drive they scan a QR code, enter a name and WhatsApp number, and they are done. Their results and certificate come to WhatsApp.' },
  { q: 'We do not have time for data entry.', a: 'You do not need to type students in. Upload the list you already have as a CSV, or let students register themselves through your QR code.' },
  { q: 'What does it cost?', a: 'You can start on the free plan with no card. Paid plans add things like co-branded certificates, company drive invites, WhatsApp interview invites and scheduled reports. Current prices are listed above.' },
  { q: 'Will companies actually come to our drives?', a: 'Paid plans let you invite companies to each drive and track their replies. We cannot promise which companies will accept, since your own placement relationships still matter, but everything runs from one dashboard.' },
  { q: 'I need reports for my principal and accreditation files.', a: 'The platform gives you placement reports by drive and department, and a shareable executive summary link for your principal.' },
  { q: 'What happens to our students’ data?', a: 'It is used to run your placement drives and the services students sign up for. We do not sell personal data. Students can ask us to correct or delete their data, or close their account. The details are in our Privacy Policy.' },
];

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const capacityOf = (plan) => (plan.features || []).find((f) => f.name === 'Student Capacity' && f.isActive)?.value;

// Every feature of every plan in one table. Built from the plan data itself, so it never disagrees with the cards.
const PlanCompare = ({ plans }) => {
  const names = [];
  plans.forEach((p) => (p.features || []).forEach((f) => { if (f.name !== 'Student Capacity' && !names.includes(f.name)) names.push(f.name); }));
  if (plans.length < 2 || names.length === 0) return null;
  const cell = (p, name) => {
    const f = (p.features || []).find((x) => x.name === name);
    if (!f || !f.isActive || f.value === false) return <span className="text-zinc-300" aria-label="Not included">—</span>;
    if (f.value === true || f.value === undefined || f.value === null || f.value === '') return <CheckCircle2 size={16} className="text-[#059669] inline" aria-label="Included" />;
    return <span className="text-xs font-semibold text-zinc-700">{typeof f.value === 'number' ? f.value.toLocaleString('en-IN') : String(f.value)}</span>;
  };
  return (
    <details className="mt-8 rounded-2xl border border-zinc-200 bg-white">
      <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-zinc-900">Compare all features side by side</summary>
      <div className="overflow-x-auto px-2 pb-4">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-2 font-bold">Feature</th>
              {plans.map((p) => <th key={p._id} className="px-3 py-2 font-bold text-center">{p.name}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-zinc-100">
              <td className="px-3 py-2 text-zinc-700">Students</td>
              {plans.map((p) => { const c = capacityOf(p); return <td key={p._id} className="px-3 py-2 text-center text-xs font-semibold text-zinc-700">{c === undefined ? '—' : typeof c === 'number' ? c.toLocaleString('en-IN') : String(c)}</td>; })}
            </tr>
            {names.map((n) => (
              <tr key={n} className="border-t border-zinc-100">
                <td className="px-3 py-2 text-zinc-700">{n}</td>
                {plans.map((p) => <td key={p._id} className="px-3 py-2 text-center">{cell(p, n)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
};

const FaqItem = ({ item, open, onToggle, id }) => (
  <div className={`rounded-2xl border transition-colors ${open ? 'border-emerald-200 bg-emerald-50/50' : 'border-zinc-200 bg-white hover:border-emerald-200'}`}>
    <h3>
      <button
        type="button"
        id={`${id}-q`}
        aria-expanded={open}
        aria-controls={`${id}-a`}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-[15px] font-bold text-zinc-900 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#059669]"
      >
        {item.q}
        <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${open ? 'bg-[#059669] text-white rotate-45' : 'bg-zinc-100 text-zinc-600'}`}>
          <Plus size={16} />
        </span>
      </button>
    </h3>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id={`${id}-a`}
          role="region"
          aria-labelledby={`${id}-q`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="overflow-hidden"
        >
          <p className="px-6 pb-5 -mt-1 text-sm text-zinc-600 leading-relaxed max-w-2xl">{item.a}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const ForColleges = () => {
  const [plans, setPlans] = useState([]);
  const [pack, setPack] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    axios.get(`${API}/college/public/student-pack-info`).then((res) => setPack(res.data)).catch(() => {});
    axios.get(`${API}/subscriptions`)
      .then((res) => {
        const college = (res.data || []).filter((p) => p.role === 'college' && p.isActive);
        setPlans(college.sort((a, b) => (a.price || 0) - (b.price || 0)));
      })
      .catch(() => {});
  }, []);

  const startFree = () => trackEvent('generate_lead', { placement: 'for_colleges_cta' });

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-white overflow-x-clip">
        <SEOHead
          title="Campus Placement Software for Colleges in TN | Velaivaaipu"
          description="Run campus drives, track students and share placement reports with your principal. Students join by QR code with just a WhatsApp number. Start free."
          path="/for-colleges"
        />

        {/* Hero */}
        <HeroShell compact>
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <motion.div variants={heroStagger} initial="hidden" animate="show" className="lg:col-span-7 space-y-7">
              <motion.p variants={heroItem} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#059669]">
                <span className="w-8 h-px bg-[#00D492]/50" /> For colleges &amp; placement officers
              </motion.p>
              <motion.h1 variants={heroItem} className="text-4xl md:text-5xl lg:text-[4rem] font-bold text-zinc-900 tracking-tight leading-[1.1]">
                Run Campus <span className="home-gradient-text">Placements</span>
                <br />Without the{' '}
                <span className="relative inline-block text-zinc-400">
                  Paperwork
                  {/* Red pencil scribble: two hand-drawn passes (there and back) with a grainy,
                      ragged edge from the turbulence filter, drawn on after the heading lands */}
                  <svg className="absolute -left-[3%] top-1/2 -translate-y-1/2 w-[106%] h-[0.6em] overflow-visible" viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <filter id="red-pencil" x="-5%" y="-50%" width="110%" height="200%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="grain" />
                        <feDisplacementMap in="SourceGraphic" in2="grain" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="rough" />
                        <feComponentTransfer in="grain" result="speckle">
                          <feFuncA type="table" tableValues="0.55 1" />
                        </feComponentTransfer>
                        <feComposite in="rough" in2="speckle" operator="in" />
                      </filter>
                    </defs>
                    <g filter="url(#red-pencil)" fill="none" stroke="#D92D20" strokeLinecap="round" strokeLinejoin="round">
                      <motion.path
                        d="M3 17 C 30 13, 58 19, 92 14 S 160 12, 197 10"
                        strokeWidth="3.4"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.55, delay: 0.9, ease: [0.65, 0, 0.35, 1] }}
                      />
                      <motion.path
                        d="M195 14 C 160 18, 120 15, 84 19 S 30 21, 6 22"
                        strokeWidth="2.6"
                        strokeOpacity="0.85"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.45, delay: 1.45, ease: [0.65, 0, 0.35, 1] }}
                      />
                    </g>
                  </svg>
                </span>
              </motion.h1>

              <motion.p variants={heroItem} className="text-zinc-600 text-base md:text-lg max-w-xl leading-relaxed">
                Campus placement software for colleges in Tamil Nadu and Puducherry. Bring students in with a QR code, run drives with companies, and give your principal a clear report, all from one dashboard.
              </motion.p>

              <motion.div variants={heroItem} className="flex flex-col sm:flex-row gap-3">
                <Link to="/register?role=college" onClick={startFree}>
                  <Button className="group home-shine relative overflow-hidden w-full sm:w-auto h-12 px-8 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-base shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] cursor-pointer">
                    Start Free <MotionIcon icon={ArrowRight} animation="nudge" trigger="hover" size={18} />
                  </Button>
                </Link>
                <Link to="/contact?segment=college&subject=Campus%20placement%20software">
                  <Button variant="outline" className="w-full sm:w-auto h-12 px-8 rounded-xl border-zinc-300 bg-white text-zinc-800 font-bold text-base hover:border-[#059669] hover:text-[#059669] hover:bg-white active:scale-[0.98] cursor-pointer">
                    Talk to Our Team
                  </Button>
                </Link>
              </motion.div>

              <motion.ul variants={heroItem} className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-zinc-600">
                {['No card needed to start', 'Students join with a WhatsApp number', 'Verified within a working day'].map((t) => (
                  <li key={t} className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#059669]" /> {t}</li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
              className="lg:col-span-5 relative mt-6 lg:mt-0"
            >
              <div className="relative w-full max-w-[420px] mx-auto">
                <div className="absolute inset-6 rounded-[2rem] bg-gradient-to-tr from-[#00D492]/40 to-teal-200/40 blur-2xl" aria-hidden="true" />
                <img
                  src="/images/for-colleges-hero.webp"
                  alt="College student with a laptop and placement ID card"
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

        {/* Steps */}
        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal className="text-center mb-14">
              <SectionEyebrow>How it works</SectionEyebrow>
              <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight">Up and Running in Three Steps</h2>
              <p className="text-zinc-600 mt-3 font-medium text-sm md:text-base">From sign-up to your first drive, without typing a single student in by hand.</p>
            </Reveal>

            <motion.ol variants={dealGrid} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="grid md:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <motion.li key={s.title} variants={dealCard} className="group h-full min-w-0">
                  <article className="h-full flex flex-col rounded-[22px] bg-white border border-zinc-200/80 p-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                    <div className={`flex-1 flex flex-col rounded-2xl ${s.tint} p-5`}>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-bold text-white ${s.badge}`}>Step {i + 1}</span>
                        <span className="w-10 h-10 rounded-xl bg-white text-zinc-800 shadow-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                          <s.icon size={19} />
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-zinc-900">{s.title}</h3>
                      <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">{s.desc}</p>
                      <div className="mt-auto pt-5"><s.Visual /></div>
                    </div>
                  </article>
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </section>

        {/* Benefits bento */}
        <section className="py-24 bg-[#fafafa]">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal className="text-center mb-14">
              <SectionEyebrow>Why colleges switch</SectionEyebrow>
              <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight">Built So Students and Staff Say Yes</h2>
              <p className="text-zinc-600 mt-3 font-medium text-sm md:text-base">Less work for your placement cell, and nothing new for students to learn.</p>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b, i) => (
                <Reveal key={b.title} delay={(i % 3) * 0.08} className={`${b.span || ''} min-w-0`}>
                  <article className={`group h-full rounded-[22px] bg-white border border-zinc-200/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-emerald-200 ${b.split ? 'sm:grid sm:grid-cols-2 sm:gap-6 sm:items-center' : 'flex flex-col'}`}>
                    <div>
                      <span className="w-11 h-11 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center transition-colors duration-300 group-hover:bg-[#059669] group-hover:text-white">
                        <b.icon size={20} />
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-zinc-900">{b.title}</h3>
                      <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">{b.desc}</p>
                    </div>
                    {b.Visual && <div className={b.split ? 'mt-6 sm:mt-0' : 'mt-auto pt-6'}><b.Visual /></div>}
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Plans (live from the platform) */}
        {plans.length > 0 && (
          <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-6">
              <Reveal className="text-center mb-14">
                <SectionEyebrow>Pricing</SectionEyebrow>
                <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight">Simple Plans for Colleges</h2>
                <p className="text-zinc-600 mt-3 font-medium text-sm md:text-base">Start free and upgrade only when you need more.</p>
              </Reveal>
              <motion.div
                variants={dealGrid}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                className={`grid sm:grid-cols-2 gap-6 ${plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
              >
                {plans.map((p) => {
                  const capacity = capacityOf(p);
                  const included = (p.features || []).filter((f) => f.isActive && f.name !== 'Student Capacity' && f.value !== false).slice(0, 5);
                  const free = !(p.price > 0);
                  return (
                    <motion.article
                      key={p._id}
                      variants={dealCard}
                      className={`group relative flex flex-col rounded-[22px] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${free ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-white border border-zinc-200/80 shadow-sm'}`}
                    >
                      <h3 className="text-base font-bold text-zinc-900">{p.name}</h3>
                      <p className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">
                        {free ? 'Free' : rupees(p.price)}
                        {!free && <span className="text-sm font-semibold text-zinc-400"> / {String(p.duration || 'year').toLowerCase().replace('ly', '')}</span>}
                      </p>
                      {capacity !== undefined && (
                        <p className="mt-2 text-sm font-bold text-[#059669]">
                          {typeof capacity === 'number' ? `Up to ${capacity.toLocaleString('en-IN')} students` : `${capacity} students`}
                        </p>
                      )}
                      <ul className="mt-5 pt-5 border-t border-zinc-200/70 space-y-2.5 text-sm text-zinc-600 flex-1">
                        {included.map((f) => (
                          <li key={f.name} className="flex gap-2"><CheckCircle2 size={16} className="text-[#059669] shrink-0 mt-0.5" />{f.name}</li>
                        ))}
                      </ul>
                      <Link
                        to="/register?role=college"
                        onClick={startFree}
                        className={`mt-6 inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${free ? 'bg-[#059669] text-white hover:bg-[#047857]' : 'bg-zinc-100 text-zinc-900 hover:bg-[#10213D] hover:text-white'}`}
                      >
                        {free ? 'Start free' : `Choose ${p.name}`}
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </motion.article>
                  );
                })}
              </motion.div>
              <p className="text-center text-xs text-zinc-400 mt-6">Prices shown are what you will see at checkout. GST may apply.</p>
              <PlanCompare plans={plans} />
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="m-0 text-base font-bold text-zinc-900">Want something different for your college?</p>
                  <p className="m-0 mt-1 text-sm text-zinc-600">If you want to buy one of these plans, choose it above. If you need something customised, such as more students, several campuses or special reports, send us a message and our team will contact you.</p>
                </div>
                <Link to="/contact?segment=college&subject=Customised%20college%20plan" className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-bold bg-zinc-900 text-white whitespace-nowrap">
                  Talk to our team <ArrowRight size={16} />
                </Link>
              </div>
              {pack?.price > 0 && (
                <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="m-0 text-base font-bold text-zinc-900">Need a little more room? Add a student pack</p>
                    <p className="m-0 mt-1 text-sm text-zinc-600">
                      +{pack.students} students for a year at {rupees(pack.price)} + GST, up to {pack.maxPacks} packs. Request it from your dashboard once your college is verified. Our team adds the students after payment.
                    </p>
                  </div>
                  <p className="m-0 text-3xl font-bold tracking-tight text-zinc-900 whitespace-nowrap">{rupees(pack.price)}<span className="text-sm font-semibold text-zinc-400"> / {pack.students} students</span></p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Data safety */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 md:p-8">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm"><ShieldCheck size={18} /> How we look after your students’ data</div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700 list-none p-0">
              <li>We do not sell personal data, to companies or anyone else.</li>
              <li>Student details are used to run your drives and the services your students sign up for.</li>
              <li>Students can ask us to correct or delete their data, or close their account, at any time.</li>
              <li>Your principal’s report opens only with a private link and a code that you share. You can issue a new code whenever you want.</li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">Read the full <Link to="/privacy-policy" className="underline">Privacy Policy</Link>, or write to hello@velaivaaipu.in with any question before you sign up.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className={`py-24 ${plans.length > 0 ? 'bg-[#fafafa]' : 'bg-white'}`}>
          <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-10 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] mb-4 text-[#059669]">
                <span className="w-8 h-px bg-[#00D492]/50" /> FAQ
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight">Questions Placement Officers Ask</h2>
              <p className="text-zinc-600 mt-4 text-sm md:text-base leading-relaxed">Something we have not answered? Our team will walk you through it.</p>
              <Link to="/contact" className="group mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-zinc-900 hover:text-[#059669] transition-colors">
                Talk to our team <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <div className="lg:col-span-8 space-y-3">
              {faqs.map((f, i) => (
                <FaqItem key={f.q} id={`college-faq-${i}`} item={f} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
              ))}
            </div>
          </div>
        </section>

        <HireCta
          eyebrow="For Colleges & Placement Officers"
          title={<>Try It With <span className="text-[#10213D]">One Drive</span></>}
          text="Create your college account, set up a drive and share the QR code. If it is not right for you, you have lost nothing."
          primary={{ to: '/register?role=college', label: 'Start Free', onClick: startFree }}
          secondary={{ to: '/contact', label: 'Talk to Our Team' }}
        />

        <Footer />
        <BackToTop />
      </div>
    </MotionConfig>
  );
};

export default ForColleges;
