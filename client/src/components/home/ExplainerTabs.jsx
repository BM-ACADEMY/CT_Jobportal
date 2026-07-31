import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, CheckCircle2, Award,
  Building2, Briefcase, UserCheck, Handshake,
  GraduationCap, UserPlus, CalendarCheck, TrendingUp,
  ArrowRight,
} from 'lucide-react';

const FLOWS = [
  {
    key: 'jobseeker',
    label: 'Job Seeker',
    color: 'emerald',
    steps: [
      { icon: Users, title: 'Create Your Profile', desc: 'Add your skills, resume and preferences.' },
      { icon: Search, title: 'Get Matched', desc: 'AI surfaces roles that fit your skills.' },
      { icon: CheckCircle2, title: 'Apply Instantly', desc: 'One-click apply, track status live.' },
      { icon: Award, title: 'Get Hired', desc: 'Interview, offer, and start your new role.' },
    ],
  },
  {
    key: 'recruiter',
    label: 'Recruiter / Company',
    color: 'emerald',
    steps: [
      { icon: Building2, title: 'Set Up Company Profile', desc: 'Showcase your brand to candidates.' },
      { icon: Briefcase, title: 'Post Jobs', desc: 'Publish roles in minutes, reach millions.' },
      { icon: UserCheck, title: 'Review Candidates', desc: 'AI-ranked applicants, ATS pipeline.' },
      { icon: Handshake, title: 'Hire With Confidence', desc: 'Schedule interviews, extend offers.' },
    ],
  },
  {
    key: 'college',
    label: 'College / TPO',
    color: 'emerald',
    steps: [
      { icon: GraduationCap, title: 'Register Your College', desc: 'Get verified and onboarded.' },
      { icon: UserPlus, title: 'Add Your Students', desc: 'Bulk-import student profiles.' },
      { icon: CalendarCheck, title: 'Run Placement Drives', desc: 'Invite companies, manage rounds.' },
      { icon: TrendingUp, title: 'Track Placements', desc: 'Real-time reports for your management.' },
    ],
  },
];

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400', ring: 'border-emerald-500' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-400', ring: 'border-blue-500' },
  violet: { bg: 'bg-violet-500', text: 'text-violet-400', ring: 'border-violet-500' },
};

const ExplainerTabs = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive(prev => (prev + 1) % FLOWS.length), 6000);
    return () => clearInterval(id);
  }, [paused]);

  const flow = FLOWS[active];
  const colors = COLOR_MAP[flow.color];

  return (
    <section
      className="py-24 bg-slate-950 relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <span className="w-8 h-px bg-emerald-500/40" /> How It Works <span className="w-8 h-px bg-emerald-500/40" />
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">One Platform, Three Journeys</h2>
          <p className="text-slate-400 mt-3 font-medium">See how job seekers, recruiters, and colleges each move through the platform.</p>
        </div>

        <div className="flex justify-center gap-2 mb-14 flex-wrap">
          {FLOWS.map((f, i) => (
            <button
              key={f.key}
              onClick={() => setActive(i)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${
                i === active
                  ? `${COLOR_MAP[f.color].bg} text-slate-900 border-transparent`
                  : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={flow.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {flow.steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-slate-900 mb-5`}>
                  <step.icon size={22} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${colors.text}`}>Step {i + 1}</span>
                <h3 className="text-white font-bold mt-2 mb-2">{step.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
                {i < flow.steps.length - 1 && (
                  <ArrowRight size={16} className="hidden lg:block absolute top-1/2 -translate-y-1/2 -right-2.5 translate-x-1/2 text-slate-600 z-10" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-2 mt-10">
          {FLOWS.map((f, i) => (
            <button
              key={f.key}
              onClick={() => setActive(i)}
              aria-label={`Show ${f.label} flow`}
              className={`h-1.5 rounded-full transition-all ${i === active ? `w-8 ${COLOR_MAP[f.color].bg}` : 'w-1.5 bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExplainerTabs;
