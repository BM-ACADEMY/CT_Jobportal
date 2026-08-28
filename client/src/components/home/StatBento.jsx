import React from 'react';
import { motion } from 'framer-motion';
import AnimatedStat from './AnimatedStat';

// cards: [{ label, value, icon: LucideIcon, invert?: bool }]
const StatBento = ({ cards }) => (
  <section className="py-10 bg-white">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 items-center">
        {cards.map((s, i) => (
          <div key={i} className="flex flex-col items-center text-center space-y-1 w-full px-4">
            <div className="text-[#00D492] mb-1">
              <s.icon size={26} className="stroke-[1.5]" />
            </div>
            <p className="text-3xl font-semibold text-zinc-950 tracking-tight">
              <AnimatedStat value={s.value} />
            </p>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default StatBento;
