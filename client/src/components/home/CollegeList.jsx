import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { GraduationCap, MapPin, ShieldCheck } from 'lucide-react';

const CollegeList = ({ limit = 8 }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/public/colleges`, { params: { limit } })
      .then(res => setColleges(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [API_BASE_URL, limit]);

  if (!loading && colleges.length === 0) return null;

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <span className="w-8 h-px bg-emerald-300" /> Growing Together <span className="w-8 h-px bg-emerald-300" />
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Colleges Already Onboard</h2>
          <p className="text-slate-500 mt-3 font-medium">Institutions already running their placement drives with us.</p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl border-2 border-slate-100 bg-white animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {colleges.map((college, i) => (
              <motion.div
                key={college._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-col p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-900 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                    {college.logo ? (
                      <img src={`${API_DOMAIN}${college.logo}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <GraduationCap size={20} className="text-emerald-600" />
                    )}
                  </div>
                  <ShieldCheck size={16} className="text-emerald-500 ml-auto" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm leading-snug">{college.name}</h3>
                {(college.university || college.location) && (
                  <p className="text-slate-400 text-xs font-semibold mt-1.5 flex items-center gap-1">
                    <MapPin size={11} />{college.university || college.location}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CollegeList;
