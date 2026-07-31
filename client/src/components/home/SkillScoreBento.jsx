import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Award, Loader2 } from 'lucide-react';

const SkillScoreBento = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/skill-tests/my-results`)
      .then(res => setResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [API_BASE_URL]);

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-3">
              <span className="w-8 h-px bg-emerald-300" /> AI Skill Tests
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Your Skill Scores</h2>
            <p className="text-slate-500 mt-2 font-medium">Verified scores from tests you've taken — earn badges recruiters trust.</p>
          </div>
          <Link to="/free-assessment">
            <Button variant="outline" className="h-11 px-7 rounded-xl border-slate-200 text-slate-700 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all shrink-0">
              Take a Test <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 px-6 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
            <Sparkles className="w-10 h-10 text-emerald-500 mb-4" />
            <h3 className="font-bold text-slate-900 mb-1">No skill tests taken yet</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">Take a free AI-generated skill test and get a verified score recruiters can see on your profile.</p>
            <Link to="/free-assessment">
              <Button className="h-11 px-7 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold">
                Start Your First Test
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {results.slice(0, 4).map((r, i) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => navigate('/jobseeker/skill-tests')}
                className="p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-900 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center">
                    <Award size={18} />
                  </div>
                  {r.passed && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Passed</span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 capitalize mb-3">{r.skill}</h3>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${r.passed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${r.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">{r.percentage}% · {r.score}/{r.total} correct</p>
                  {r.createdAt && (
                    <span className="text-[10px] font-bold text-slate-400">{new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SkillScoreBento;
