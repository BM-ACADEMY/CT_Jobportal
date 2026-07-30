import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// steps: [{ step: '01', title, desc, icon: LucideIcon }]
const StepFlow = ({ eyebrow = 'Simple Process', title, steps, dark = false }) => (
  <section className={`py-24 ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] mb-4 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
          <span className={`w-8 h-px ${dark ? 'bg-emerald-500/40' : 'bg-emerald-300'}`} /> {eyebrow} <span className={`w-8 h-px ${dark ? 'bg-emerald-500/40' : 'bg-emerald-300'}`} />
        </span>
        <h2 className={`text-3xl md:text-5xl font-black tracking-tighter ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className={`relative overflow-hidden rounded-3xl p-8 border-2 group hover:-translate-y-1 transition-all duration-300 ${
              dark
                ? 'bg-white/5 border-white/10 hover:border-emerald-500'
                : 'bg-white border-slate-200 hover:border-slate-900'
            }`}
          >
            <span className={`absolute -top-4 -right-2 text-8xl font-black select-none leading-none transition-colors ${dark ? 'text-white/5 group-hover:text-emerald-500/10' : 'text-slate-50 group-hover:text-emerald-50'}`}>{step.step}</span>
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-950 text-emerald-400 mb-6 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-all duration-300">
              <step.icon size={28} />
            </div>
            <h3 className={`relative text-xl font-bold mb-3 ${dark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
            <p className={`relative text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{step.desc}</p>
            {i < steps.length - 1 && (
              <ArrowRight size={18} className={`hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10 ${dark ? 'text-slate-700' : 'text-slate-300'}`} />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StepFlow;
