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
    steps: [
      { icon: GraduationCap, title: 'Register Your College', desc: 'Get verified and onboarded.' },
      { icon: UserPlus, title: 'Add Your Students', desc: 'Bulk-import student profiles.' },
      { icon: CalendarCheck, title: 'Run Placement Drives', desc: 'Invite companies, manage rounds.' },
      { icon: TrendingUp, title: 'Track Placements', desc: 'Real-time reports for your management.' },
    ],
  },
];

const ExplainerTabs = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive(prev => (prev + 1) % FLOWS.length), 6000);
    return () => clearInterval(id);
  }, [paused]);

  const flow = FLOWS[active];

  return (
    <section
      className="py-24 bg-slate-50 relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Soft blurry green glow on the left background */}
      <div className="absolute top-[20%] left-[-15%] w-[400px] h-[400px] bg-[#00D492]/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-[#00D492] text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <span className="w-8 h-px bg-[#00D492]/40" /> How It Works <span className="w-8 h-px bg-[#00D492]/40" />
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight">One Platform, Three Journeys</h2>
          <p className="text-zinc-500 mt-3 font-medium text-sm md:text-base">See how job seekers, recruiters, and colleges each move through the platform.</p>
        </div>

        <div className="flex justify-center gap-3 mb-14 flex-wrap">
          {FLOWS.map((f, i) => (
            <button
              key={f.key}
              onClick={() => setActive(i)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                i === active
                  ? 'bg-[#00D492] text-white border-transparent shadow-md'
                  : 'bg-white text-zinc-650 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 cursor-pointer shadow-sm'
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
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {flow.steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="relative bg-white border border-zinc-200 rounded-2xl p-6 shadow-md shadow-zinc-100/50 overflow-hidden z-10 group cursor-pointer"
              >
                {/* Background color hover fill: Slides down from top */}
                <div className="absolute inset-0 bg-[#00D492] -z-10 translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-500 ease-out origin-top" />

                {/* Card Elements (Relative z-index so they sit on top of the slide-in background) */}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-[#00D492] text-white group-hover:bg-white group-hover:text-[#00D492] flex items-center justify-center mb-5 transition-colors duration-300">
                    <step.icon size={22} />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00D492] group-hover:text-[#e0fff5] transition-colors duration-300">
                    Step {i + 1}
                  </span>

                  <h3 className="text-zinc-800 font-bold mt-2 mb-2 group-hover:text-white transition-colors duration-300 text-lg">
                    {step.title}
                  </h3>

                  <p className="text-zinc-500 text-xs leading-relaxed group-hover:text-[#f2fffb] transition-colors duration-300">
                    {step.desc}
                  </p>
                </div>

                {i < flow.steps.length - 1 && (
                  <ArrowRight size={16} className="hidden lg:block absolute top-1/2 -translate-y-1/2 -right-3 translate-x-1/2 text-zinc-400 group-hover:text-white z-10 transition-colors duration-300" />
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
              className={`h-1.5 rounded-full transition-all ${i === active ? 'w-8 bg-[#00D492]' : 'w-1.5 bg-zinc-200'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExplainerTabs;
