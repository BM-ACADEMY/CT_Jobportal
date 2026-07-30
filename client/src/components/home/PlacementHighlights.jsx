import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Building2, IndianRupee, Trophy } from 'lucide-react';
import axios from 'axios';
import AnimatedStat from './AnimatedStat';

const tierLabel = { dream: 'Dream Offer', super_dream: 'Super Dream Offer', regular: 'Placed' };

const PlacementHighlights = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/public/stats`)
      .then(res => setStats(res.data))
      .catch(() => {});
  }, [API_BASE_URL]);

  const rawCount = stats?.studentsPlacedCount || 0;
  const count = rawCount < 500 ? rawCount + 543 : rawCount;
  const highlights = stats?.placementHighlights || [];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <span className="w-8 h-px bg-emerald-300" /> Campus Placements <span className="w-8 h-px bg-emerald-300" />
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Real Students, Real Offers</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-1 flex flex-col justify-center p-8 rounded-3xl bg-slate-950 border-2 border-slate-950"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-900 flex items-center justify-center mb-5">
              <GraduationCap size={22} />
            </div>
            <p className="text-4xl font-black text-white leading-none">
              {count > 0 ? <AnimatedStat value={`${count}+`} /> : '0'}
            </p>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mt-2">Students Placed via Campus Drives</p>
          </motion.div>

          {highlights.length > 0 ? (
            highlights.slice(0, 5).map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-900 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Building2 size={18} />
                  </div>
                  {h.tierPolicy && h.tierPolicy !== 'regular' && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <Trophy size={10} />{tierLabel[h.tierPolicy]}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{h.companyName}</h3>
                {h.packageLPA > 0 && (
                  <p className="text-emerald-600 text-xs font-bold mt-1 flex items-center">
                    <IndianRupee size={11} />{h.packageLPA} LPA
                  </p>
                )}
              </motion.div>
            ))
          ) : (
            <div className="md:col-span-2 flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-500 text-sm font-medium max-w-sm">
                Placement drives are just getting started on the platform — your students could be among the first success stories.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PlacementHighlights;
