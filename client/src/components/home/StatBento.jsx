import React from 'react';
import { motion } from 'framer-motion';
import AnimatedStat from './AnimatedStat';

// cards: [{ label, value, icon: LucideIcon, invert?: bool }]
const StatBento = ({ cards, dark = false }) => (
  <section className={`pt-4 pb-16 -mt-px ${dark ? 'bg-slate-950' : 'bg-white'}`}>
    <div className="max-w-6xl mx-auto px-6 flex justify-center">
      <div className={`w-full grid grid-cols-2 ${cards.length === 3 ? 'lg:grid-cols-3 max-w-4xl' : 'lg:grid-cols-4'} gap-5`}>
        {cards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all ${
              s.invert
                ? 'bg-slate-950 border-slate-950 hover:border-emerald-500'
                : dark
                  ? 'bg-white/5 border-white/10 hover:border-emerald-500'
                  : 'bg-white border-slate-200 hover:border-slate-900'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.invert ? 'bg-emerald-500 text-slate-900' : 'bg-slate-950 text-emerald-400'}`}>
              <s.icon size={22} />
            </div>
            <div>
              <p className={`text-2xl font-black leading-none ${s.invert || dark ? 'text-white' : 'text-slate-900'}`}><AnimatedStat value={s.value} /></p>
              <p className={`text-xs font-semibold mt-1 ${s.invert ? 'text-slate-400' : dark ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatBento;
