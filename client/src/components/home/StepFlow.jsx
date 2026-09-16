import React from 'react';
import { motion } from 'framer-motion';

const StepFlow = ({ eyebrow = 'Simple Process', title, steps }) => {
  return (
    <section className="relative overflow-hidden py-24 bg-white border-t border-zinc-100">
      {/* Clean Vector Dot Background Pattern with fading edges */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#00D492 1px, transparent 1px)', 
          backgroundSize: '24px 24px',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
          maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
        }} 
      />

      {/* Left-bottom green color splash background (positioned to fade out before bottom edge) */}
      <div 
        className="absolute -left-20 bottom-10 w-96 h-96 rounded-full opacity-20 pointer-events-none blur-[130px]"
        style={{ backgroundColor: '#34b678' }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] mb-4 text-[#00D492]">
            <span className="w-8 h-px bg-[#00D492]/40" /> {eyebrow} <span className="w-8 h-px bg-[#00D492]/40" />
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900">{title}</h2>
        </div>

        <div className="relative">
          {/* Animated green connecting line: Step 1 to Step 2 */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
            style={{ originX: 0 }}
            className="hidden md:block absolute top-9 left-[16.67%] w-[33.33%] h-[2px] bg-[#00D492]"
          />

          {/* Animated green connecting line: Step 2 to Step 3 */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeInOut', delay: 1.5 }}
            style={{ originX: 0 }}
            className="hidden md:block absolute top-9 left-[50%] w-[33.33%] h-[2px] bg-[#00D492]"
          />

          <div className="grid md:grid-cols-3 gap-y-14 gap-x-8 relative">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.3, duration: 0.6 }}
                className="relative flex flex-col items-center text-center group cursor-pointer"
              >
                {/* Node: icon circle with orbiting number badge */}
                <div className="relative mb-7">
                  <motion.div
                    initial={{ borderColor: 'rgb(228, 228, 231)' }}
                    whileInView={{ borderColor: '#00D492' }}
                    viewport={{ once: true }}
                    transition={{ delay: i === 0 ? 0.3 : i === 1 ? 1.5 : 2.7, duration: 0.6 }}
                    className="relative w-[72px] h-[72px] rounded-full bg-white border-2 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1"
                  >
                    <motion.div
                      initial={{ color: '#27272a' }}
                      whileInView={{ color: '#00D492' }}
                      viewport={{ once: true }}
                      transition={{ delay: i === 0 ? 0.3 : i === 1 ? 1.5 : 2.7, duration: 0.6 }}
                    >
                      <step.icon size={26} className="stroke-[1.5]" />
                    </motion.div>
                  </motion.div>
                  <motion.div
                    initial={{ backgroundColor: '#09090b' }}
                    whileInView={{ backgroundColor: '#00D492' }}
                    viewport={{ once: true }}
                    transition={{ delay: i === 0 ? 0.3 : i === 1 ? 1.5 : 2.7, duration: 0.6 }}
                    className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center transition-colors duration-300 ring-4 ring-white"
                  >
                    {i + 1}
                  </motion.div>
                </div>

                <div className="w-full max-w-[280px] bg-white border border-zinc-200/80 rounded-2xl px-6 py-6 shadow-sm group-hover:shadow-md group-hover:border-[#00D492]/50 group-hover:-translate-y-1 transition-all duration-300">
                  <h3 className="text-lg font-bold text-zinc-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StepFlow;
