import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Zap, ChevronLeft, ChevronRight, IndianRupee } from 'lucide-react';

// role: 'recruiter' | 'company' | 'college' — matches PayPerFeature.role
const PayPerCarousel = ({ role, title = 'Pay Only For What You Need', subtitle = 'No forced bundles — unlock exactly the features you use.' }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);

  useEffect(() => {
    if (!role) return;
    axios.get(`${API_BASE_URL}/public/pay-per-features`, { params: { role } })
      .then(res => setFeatures(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [API_BASE_URL, role]);

  const scrollBy = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  if (!loading && features.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-3">
              <span className="w-8 h-px bg-emerald-300" /> Pay-Per-Use
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{title}</h2>
            <p className="text-slate-500 mt-2 font-medium max-w-xl">{subtitle}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => scrollBy(-1)} aria-label="Scroll left" className="w-11 h-11 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-900 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scrollBy(1)} aria-label="Scroll right" className="w-11 h-11 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-900 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-5 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-56 w-72 shrink-0 rounded-2xl border-2 border-slate-100 bg-slate-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div ref={trackRef} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {features.map((f, i) => (
              <motion.div
                key={f._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="snap-start shrink-0 w-72 flex flex-col p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-900 transition-all duration-300 bg-white"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center mb-5">
                  <Zap size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{f.name}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-5 flex-1">{f.description}</p>
                <div className="flex items-end justify-between pt-4 border-t border-slate-50">
                  <span className="flex items-center text-slate-900 font-black text-lg">
                    <IndianRupee size={14} />{f.cost}
                  </span>
                  <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide">{f.days} days</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PayPerCarousel;
