import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Briefcase, Building2, Users, TrendingUp, Star, ArrowRight,
  MapPin, Loader2, Clock, IndianRupee,
  Code2, Stethoscope, BarChart2, Palette, ShoppingBag, GraduationCap,
  Cpu, HeartHandshake, CheckCircle2, Zap, Shield, Award
} from 'lucide-react';

const stats = [
  { label: 'Jobs Posted', value: '2L+', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Companies', value: '10K+', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Job Seekers', value: '50L+', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Placements', value: '1L+', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const categories = [
  { label: 'IT & Software', count: '45K Jobs', icon: Code2, color: 'bg-blue-50 text-blue-700 border-blue-100', hover: 'hover:bg-blue-100' },
  { label: 'Healthcare', count: '15K Jobs', icon: Stethoscope, color: 'bg-rose-50 text-rose-700 border-rose-100', hover: 'hover:bg-rose-100' },
  { label: 'Finance', count: '18K Jobs', icon: BarChart2, color: 'bg-emerald-50 text-emerald-700 border-emerald-100', hover: 'hover:bg-emerald-100' },
  { label: 'Design', count: '9K Jobs', icon: Palette, color: 'bg-violet-50 text-violet-700 border-violet-100', hover: 'hover:bg-violet-100' },
  { label: 'Sales', count: '22K Jobs', icon: ShoppingBag, color: 'bg-amber-50 text-amber-700 border-amber-100', hover: 'hover:bg-amber-100' },
  { label: 'Education', count: '8K Jobs', icon: GraduationCap, color: 'bg-teal-50 text-teal-700 border-teal-100', hover: 'hover:bg-teal-100' },
  { label: 'Engineering', count: '30K Jobs', icon: Cpu, color: 'bg-orange-50 text-orange-700 border-orange-100', hover: 'hover:bg-orange-100' },
  { label: 'Non-Profit', count: '5K Jobs', icon: HeartHandshake, color: 'bg-pink-50 text-pink-700 border-pink-100', hover: 'hover:bg-pink-100' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Software Engineer @ Google', text: 'Found my dream job in just 2 weeks. The AI-powered recommendations were incredibly accurate for my skill set!', rating: 5, avatar: 'PS' },
  { name: 'Rahul Mehta', role: 'Product Manager @ Flipkart', text: 'The platform\'s reach is unmatched. I received 20+ interview calls within days of uploading my resume.', rating: 5, avatar: 'RM' },
  { name: 'Sneha Patel', role: 'UI/UX Designer @ Swiggy', text: 'Super easy to use. The detailed job filters helped me find exactly what I was looking for in just days.', rating: 5, avatar: 'SP' },
];

const howItWorks = [
  { step: '01', title: 'Create Your Profile', desc: 'Build your professional profile in minutes. Upload your resume and showcase your skills.', icon: Users },
  { step: '02', title: 'Explore Opportunities', desc: 'Browse thousands of curated jobs from top companies across India and abroad.', icon: Search },
  { step: '03', title: 'Apply & Get Hired', desc: 'Apply with one click and track your applications in real-time through your dashboard.', icon: CheckCircle2 },
];

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

  useEffect(() => {
    axios.get(`${API_BASE_URL}/jobs`)
      .then(res => setJobs(res.data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [API_BASE_URL]);

  const handleSearch = (e) => {
    e?.preventDefault();
    navigate(`/jobs?q=${searchQuery}&loc=${locationQuery}`);
  };

  const formatSalary = (salary) => {
    if (!salary || salary.isRangeHidden) return 'Not Disclosed';
    if (salary.min && salary.max) return `₹${(salary.min / 100000).toFixed(1)}–${(salary.max / 100000).toFixed(1)} LPA`;
    if (salary.min) return `₹${(salary.min / 100000).toFixed(1)}+ LPA`;
    return 'Competitive';
  };

  return (
    <div className="w-full overflow-x-hidden bg-white">

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
        {/* Mesh gradient blobs */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[140px] -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -ml-32 -mb-32 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 pt-32 pb-40 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">2,480 new jobs posted today</span>
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.05] mb-8 tracking-tight">
                Find Your{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                    Dream Job
                  </span>
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full" />
                </span>{' '}
                <br />in India's Top Companies
              </h1>

              <p className="text-slate-400 text-lg md:text-xl font-normal mb-12 max-w-xl leading-relaxed">
                Connect with world-class employers. Discover opportunities that match your skills, location, and career aspirations.
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col md:flex-row gap-2 mb-10 shadow-2xl shadow-black/30">
                <div className="flex items-center gap-3 flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/5">
                  <Search size={20} className="text-emerald-400 shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Job title or keywords..."
                    className="flex-1 bg-transparent outline-none text-white font-medium placeholder:text-slate-500 text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/5">
                  <MapPin size={20} className="text-slate-500 shrink-0" />
                  <input
                    value={locationQuery}
                    onChange={e => setLocationQuery(e.target.value)}
                    placeholder="City or Remote..."
                    className="flex-1 bg-transparent outline-none text-white font-medium placeholder:text-slate-500 text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-12 rounded-xl px-8 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/25 transition-all shrink-0"
                >
                  Search Jobs
                </Button>
              </form>

              {/* Trust Bar */}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex -space-x-2.5">
                  {[11, 12, 13, 14].map(i => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-slate-900 bg-slate-700 overflow-hidden ring-1 ring-white/10">
                      <img src={`https://i.pravatar.cc/100?img=${i}`} alt="" />
                    </div>
                  ))}
                  <div className="w-9 h-9 rounded-full border-2 border-slate-900 bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-slate-900 ring-1 ring-white/10">+10k</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <p className="text-white font-bold text-lg leading-none">4.9 / 5</p>
                  <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest mt-0.5">Candidate Rating</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <p className="text-white font-bold text-lg leading-none">95%</p>
                  <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest mt-0.5">Placement Rate</p>
                </div>
              </div>
            </motion.div>

            {/* Right - Visual Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className="relative hidden lg:flex justify-center items-center"
            >
              {/* Central image */}
              <div className="relative w-80 h-96 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"
                  alt="Professional"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              </div>

              {/* Floating card 1 */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -left-10 bg-white rounded-2xl p-5 shadow-2xl shadow-black/30 border border-slate-100 min-w-[200px]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white"><TrendingUp size={20} /></div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 leading-none">95%</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">Success Rate</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#f59e0b" className="text-amber-400" />)}
                </div>
              </motion.div>

              {/* Floating card 2 */}
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -bottom-4 -right-8 bg-white rounded-2xl p-5 shadow-2xl shadow-black/30 border border-slate-100 min-w-[190px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center text-white"><Users size={20} /></div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 leading-none">5,000+</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">Hired This Month</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating card 3 */}
              <motion.div
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute top-1/2 -right-14 -translate-y-1/2 bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[160px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Live Activity</p>
                </div>
                <p className="text-white font-bold text-sm">238 applied today</p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 80H1440V40C1200 80 960 0 720 40C480 80 240 0 0 40V80Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="pt-4 pb-16 bg-white -mt-px">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon size={22} className={s.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{s.value}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-4">
              <span className="w-8 h-px bg-emerald-300" /> Simple Process <span className="w-8 h-px bg-emerald-300" />
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Get Hired in 3 Simple Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="absolute top-1/2 left-1/3 right-1/3 h-px bg-gradient-to-r from-emerald-200 to-teal-200 hidden md:block -translate-y-1/2 z-0" />
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative z-10 bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center group hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 mx-auto">
                  <step.icon size={28} />
                </div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] block mb-2">{step.step}</span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT JOBS ── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div>
              <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-3">
                <span className="w-8 h-px bg-emerald-300" /> Fresh Listings
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Recent Opportunities</h2>
              <p className="text-slate-500 mt-2 font-medium">Hand-picked roles from top-tier companies across India.</p>
            </div>
            <Link to="/jobs">
              <Button variant="outline" className="h-11 px-7 rounded-xl border-slate-200 text-slate-700 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                View All <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-24">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-400 font-semibold text-sm">Loading opportunities...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job, i) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link to={`/job/${job._id}`} className="group block bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-100 transition-all duration-300 h-full">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-14 h-14 rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden shrink-0 group-hover:border-emerald-200 transition-colors">
                        {job.company?.logo ? (
                          <img src={`${API_DOMAIN}${job.company.logo}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xl">
                            {job.company?.name?.[0] || 'J'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-emerald-600 transition-colors">{job.title}</h3>
                        <p className="text-slate-400 text-sm font-medium mt-0.5">{job.company?.name}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-5">
                      <Badge className="bg-slate-100 text-slate-600 border-none text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-slate-100">
                        <MapPin size={11} className="mr-1" />{job.location || 'Remote'}
                      </Badge>
                      {job.jobType && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-none text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-emerald-50">
                          {job.jobType}
                        </Badge>
                      )}
                      <Badge className="bg-amber-50 text-amber-700 border-none text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-amber-50">
                        <IndianRupee size={11} className="mr-0.5" />{formatSalary(job.salary)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <span className="flex items-center text-slate-400 text-[11px] font-semibold">
                        <Clock size={12} className="mr-1.5" />{new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Apply Now <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-4">
              <span className="w-8 h-px bg-emerald-300" /> Browse by Domain <span className="w-8 h-px bg-emerald-300" />
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Explore Job Categories</h2>
            <p className="text-slate-500 mt-3 font-medium">Find opportunities across diverse industries and domains.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={`/jobs?category=${cat.label}`}
                  className={`flex flex-col items-start p-6 rounded-2xl border cursor-pointer group ${cat.color} ${cat.hover} transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform">
                    <cat.icon size={22} className="opacity-80" />
                  </div>
                  <h3 className="font-bold text-base mb-1">{cat.label}</h3>
                  <p className="text-[11px] font-semibold opacity-70 uppercase tracking-wider">{cat.count}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-[0.25em] mb-4">
              <span className="w-8 h-px bg-emerald-500/40" /> Real Stories <span className="w-8 h-px bg-emerald-500/40" />
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Success Stories</h2>
            <p className="text-slate-400 mt-3 font-medium">Join 50,000+ professionals who found their career path through us.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/8 transition-all"
              >
                <div className="flex gap-1 mb-5">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={14} fill="#fbbf24" className="text-amber-400" />)}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-8 font-medium">"{t.text}"</p>
                <div className="flex items-center gap-4 pt-5 border-t border-white/10">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-900 font-bold text-sm shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{t.name}</p>
                    <p className="text-emerald-400 text-[11px] font-semibold mt-0.5">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECRUITER CTA ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl overflow-hidden p-12 md:p-20 text-center shadow-2xl shadow-emerald-500/20"
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-[60px] -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-black/10 rounded-full blur-[60px] -ml-16 -mb-16" />
            <div className="relative z-10">
              <Badge className="bg-white/20 text-white border-white/30 text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 mb-8 rounded-full">
                For Recruiters & Companies
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                Ready to Hire India's Best Talent?
              </h2>
              <p className="text-emerald-50 text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                Post a job in minutes and reach millions of qualified candidates. Leverage our AI-powered matching to find the perfect fit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button className="h-14 px-12 rounded-2xl bg-white text-emerald-700 hover:bg-white/90 font-bold text-base shadow-xl shadow-black/10 transition-all hover:scale-105">
                    Post a Job Free
                  </Button>
                </Link>
                <Link to="/company-login">
                  <Button variant="outline" className="h-14 px-12 rounded-2xl border-white/30 text-white hover:bg-white/10 font-bold text-base">
                    Company Login
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-white/20">
                {[{ icon: Zap, text: 'Post in 5 minutes' }, { icon: Shield, text: 'Verified candidates' }, { icon: Award, text: 'Top employer badge' }].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/80">
                    <item.icon size={16} />
                    <span className="text-sm font-semibold">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 pt-20 pb-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <span className="text-slate-900 font-black text-lg">C</span>
                </div>
                <span className="text-white font-bold text-2xl tracking-tight">careerpoint</span>
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
                India's most trusted job portal connecting visionary companies with exceptional talent across the nation.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-5">Platform</p>
              <ul className="space-y-3">
                {[{ to: '/jobs', label: 'Find Jobs' }, { to: '/companies', label: 'Companies' }, { to: '/register', label: 'Post a Job' }, { to: '/contact', label: 'Contact Us' }].map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-slate-500 text-sm font-medium hover:text-emerald-400 transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-5">Account</p>
              <ul className="space-y-3">
                {[{ to: '/login', label: 'Job Seeker Login' }, { to: '/company-login', label: 'Company Login' }, { to: '/register', label: 'Create Account' }].map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-slate-500 text-sm font-medium hover:text-emerald-400 transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 text-xs font-semibold">© {new Date().getFullYear()} CareerPoint India. All Rights Reserved.</p>
            <div className="flex gap-6">
              <Link to="#" className="text-slate-600 text-xs font-semibold hover:text-slate-400 transition-colors">Privacy Policy</Link>
              <Link to="#" className="text-slate-600 text-xs font-semibold hover:text-slate-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
