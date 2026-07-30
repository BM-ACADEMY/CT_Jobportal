import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Building2, Briefcase, MapPin, User, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// type: 'company' | 'recruiter'
const CompanyRecruiterList = ({ type = 'company', title, subtitle, eyebrow, limit = 9 }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/public/companies`, { params: { type, limit } })
      .then(res => setItems(type === 'recruiter' ? res.data.recruiters : res.data.companies))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [API_BASE_URL, type, limit]);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -340, behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-4">
              <span className="w-8 h-px bg-emerald-300" /> {eyebrow} <span className="w-8 h-px bg-emerald-300" />
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{title}</h2>
            <p className="text-slate-500 mt-3 font-medium">{subtitle}</p>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            {!loading && items.length > 3 && (
              <div className="hidden md:flex gap-2 mr-2">
                <button onClick={scrollLeft} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white hover:border-emerald-400 hover:text-emerald-600 transition-colors shadow-sm">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={scrollRight} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white hover:border-emerald-400 hover:text-emerald-600 transition-colors shadow-sm">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            <Link to={type === 'recruiter' ? '/companies?type=recruiter' : '/companies'}>
              <Button variant="outline" className="h-11 px-7 rounded-xl border-slate-200 text-slate-700 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                View All <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl border-2 border-slate-100 bg-white animate-pulse" />
            ))}
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 -mb-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Tailwind scrollbar-hide equivalent for webkit */}
            <style>{`
              .flex.overflow-x-auto::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            
            {items.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="snap-start shrink-0 w-[85vw] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
              >
                <Link
                  to={type === 'recruiter' ? `/recruiters/${item._id}` : `/companies/${item._id}`}
                  className="group flex flex-col h-full p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-900 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl border border-slate-100 overflow-hidden shrink-0 relative bg-emerald-50">
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-emerald-600">
                        {(type === 'recruiter' ? item.name : (item.display_name || item.name))?.charAt(0)?.toUpperCase() || (type === 'recruiter' ? 'R' : 'C')}
                      </div>
                      {(item.logo || item.avatar) && (
                        <img 
                          src={`${API_DOMAIN}${item.logo || item.avatar}`} 
                          alt="" 
                          className="relative z-10 w-full h-full object-cover" 
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                        {type === 'recruiter' ? item.name : (item.display_name || item.name)}
                      </h3>
                      <p className="text-slate-400 text-xs font-semibold mt-0.5 truncate">
                        {type === 'recruiter' ? (item.jobTitle || item.company?.name || 'Recruiter') : (item.industry || 'Company')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 text-xs font-semibold">
                    <span className="flex items-center text-slate-400">
                      <MapPin size={12} className="mr-1.5" />{item.location || item.company?.location || 'India'}
                    </span>
                    {type === 'company' && (
                      <span className="flex items-center text-emerald-600">
                        <Briefcase size={12} className="mr-1.5" />{item.openPositions || 0} open
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CompanyRecruiterList;
