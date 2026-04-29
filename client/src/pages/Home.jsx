import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Search, Briefcase, Building2, Users, TrendingUp, Star, ArrowRight, ChevronRight, MapPin, Loader2, Clock, IndianRupee, Sparkles } from 'lucide-react';


const stats = [
  { label: 'Jobs Posted', value: '2L+', icon: <Briefcase size={20} /> },
  { label: 'Companies', value: '10K+', icon: <Building2 size={20} /> },
  { label: 'Job Seekers', value: '50L+', icon: <Users size={20} /> },
  { label: 'Placements', value: '1L+', icon: <TrendingUp size={20} /> },
];

const popularCategories = [
  { label: 'IT & Software', count: '45K Jobs', color: 'bg-emerald-50/50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50' },
  { label: 'Marketing', count: '12K Jobs', color: 'bg-green-50/50 text-green-700 border-green-100 hover:bg-green-100/50' },
  { label: 'Finance', count: '18K Jobs', color: 'bg-teal-50/50 text-teal-700 border-teal-100 hover:bg-teal-100/50' },
  { label: 'Design', count: '9K Jobs', color: 'bg-emerald-50/50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50' },
  { label: 'Sales', count: '22K Jobs', color: 'bg-green-50/50 text-green-700 border-green-100 hover:bg-green-100/50' },
  { label: 'Healthcare', count: '15K Jobs', color: 'bg-teal-50/50 text-teal-700 border-teal-100 hover:bg-teal-100/50' },
  { label: 'Education', count: '8K Jobs', color: 'bg-emerald-50/50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50' },
  { label: 'Engineering', count: '30K Jobs', color: 'bg-green-50/50 text-green-700 border-green-100 hover:bg-green-100/50' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Software Engineer', text: 'Land My dream job in just 2 weeks. The AI-powered recommendations were spot on!', rating: 5 },
  { name: 'Rahul Mehta', role: 'Product Manager', text: 'The platform\'s reach is unmatched. I received 20+ interview calls within days of uploading my resume.', rating: 5 },
  { name: 'Sneha Patel', role: 'UI/UX Designer', text: 'Super easy to use. The job filters are super detailed and helped me find exactly what I was looking for.', rating: 5 },
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
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/jobs`);
        setJobs(response.data.slice(0, 6)); // Show first 6 jobs on home page
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [API_BASE_URL]);

  const handleSearch = () => {
    navigate(`/jobs?q=${searchQuery}&loc=${locationQuery}`);
  };

  const formatSalary = (salary) => {
    if (!salary || salary.isRangeHidden) return "Not Disclosed";
    if (salary.min && salary.max) {
      return `₹${(salary.min / 100000).toFixed(1)}-${(salary.max / 100000).toFixed(1)} LPA`;
    }
    if (salary.min) return `₹${(salary.min / 100000).toFixed(1)}+ LPA`;
    return "Competitive";
  };

  return (
    <div className="w-full overflow-x-hidden bg-white">
      {/* ─── PREMIUM SPLIT HERO SECTION ─── */}
      <section className="relative min-h-[850px] flex items-center bg-white overflow-hidden pt-32 pb-40">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-50/50 rounded-full blur-[120px] -mr-96 -mt-96 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-50/30 rounded-full blur-[100px] -ml-48 -mb-48" />

        <div className="max-w-7xl mx-auto w-full px-6 grid lg:grid-cols-2 gap-20 items-center relative z-10">
          
          {/* Left Content: Typography & Search */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 mb-8 w-fit">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">New: 2,480 jobs posted today</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-[1.1] mb-8 tracking-tight">
              Discover the <br />
              <span className="text-primary italic">Perfect Career</span> <br />
              Path for You.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-lg leading-relaxed">
              We connect world-class talent with the industry's most visionary companies. Your next big move starts with a single click.
            </p>

            {/* Advanced Search Bar */}
            <div className="bg-white rounded-2xl p-3 shadow-xl border border-slate-50 flex flex-col md:flex-row gap-3 mb-10 group focus-within:ring-2 ring-primary/10 transition-all">
              <div className="flex items-center gap-4 flex-1 px-6 py-3 border-r border-slate-100 last:border-0">
                <Search size={24} className="text-primary" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Job title, keywords..."
                  className="flex-1 bg-transparent outline-none text-lg font-semibold text-slate-800 placeholder:text-slate-300"
                />
              </div>
              <div className="flex items-center gap-4 flex-1 px-6 py-3 hidden sm:flex">
                <MapPin size={24} className="text-slate-300" />
                <input
                  value={locationQuery}
                  onChange={e => setLocationQuery(e.target.value)}
                  placeholder="Location or Remote..."
                  className="flex-1 bg-transparent outline-none text-lg font-semibold text-slate-800 placeholder:text-slate-300"
                />
              </div>
              <Button
                onClick={handleSearch}
                size="lg"
                className="h-16 rounded-xl px-12 text-lg font-bold bg-slate-900 hover:bg-primary text-white shadow-lg transition-all"
              >
                Search Jobs
              </Button>
            </div>

            {/* Trust Badges / Stats */}
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                  +10k
                </div>
              </div>
              <div className="h-10 w-px bg-slate-100" />
              <div>
                <p className="text-xl font-bold text-slate-900 leading-none">4.9/5</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-1">Candidate Satisfaction</p>
              </div>
            </div>
          </motion.div>

          {/* Right Content: Visual Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white max-w-[500px] ml-auto">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1000" 
                alt="Professional" 
                className="w-full h-full object-cover aspect-[4/5]"
              />
            </div>

            {/* Floating Elements - Adjusted positions to avoid overlap */}
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 -left-6 z-20 bg-white rounded-3xl p-6 shadow-2xl border border-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                   <TrendingUp size={24} />
                </div>
                <div>
                   <p className="text-2xl font-bold text-slate-900 leading-none">95%</p>
                   <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-1">Success Rate</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-10 right-0 z-20 bg-white rounded-3xl p-6 shadow-2xl border border-slate-50 translate-x-1/4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                   <Users size={24} />
                </div>
                <div>
                   <p className="text-2xl font-bold text-slate-900 leading-none">5,000+</p>
                   <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-1">Hired Locally</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Dynamic Category Slider - Fixed at the bottom with proper spacing */}
        <div className="absolute bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-50 py-10 z-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="relative overflow-hidden">
               <motion.div 
                className="flex gap-12 whitespace-nowrap"
                animate={{ x: [0, -1500] }}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
               >
                 {[...popularCategories, ...popularCategories, ...popularCategories].map((cat, i) => (
                   <div key={i} className="inline-flex items-center gap-4 group cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm leading-none mb-1">{cat.label}</p>
                        <p className="text-[10px] font-semibold text-primary uppercase tracking-wide leading-none">{cat.count}</p>
                      </div>
                   </div>
                 ))}
               </motion.div>
            </div>
          </div>
        </div>
      </section>



      {/* ─── RECENT OPPORTUNITIES ─── */}
      <section className="py-32 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Recent Opportunities</h2>
              <p className="text-slate-500 font-medium text-lg">Hand-picked roles from top-tier companies across India.</p>
            </div>
            <Link to="/jobs">
              <Button variant="outline" className="h-12 px-8 rounded-lg border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all">
                View All Jobs <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Synchronizing Database...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {jobs.map((job) => (
                <Card key={job._id} className="group hover:shadow-xl transition-all duration-500 border-slate-100 rounded-xl overflow-hidden">
                  <CardHeader className="p-8 pb-0 flex flex-row items-center gap-5 space-y-0">
                    <Avatar className="h-16 w-16 rounded-xl border border-slate-50 bg-slate-50 group-hover:border-primary/20 transition-colors overflow-hidden">
                       <AvatarImage src={`${API_DOMAIN}${job.company?.logo}`} className="object-cover" />
                       <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                         {job.company?.name?.[0] || 'J'}
                       </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold text-slate-900 truncate group-hover:text-primary transition-colors tracking-tight">{job.title}</CardTitle>
                      <CardDescription className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">{job.company?.name}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="flex flex-wrap gap-2 mb-6">
                      <Badge variant="secondary" className="bg-slate-50 text-slate-500 hover:bg-slate-100 border-none px-3 py-1 font-semibold text-[10px]">
                        <MapPin size={12} className="mr-1.5" /> {job.location || 'Remote'}
                      </Badge>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none px-3 py-1 font-semibold text-[10px]">
                        <IndianRupee size={12} className="mr-1.5" /> {formatSalary(job.salary)}
                      </Badge>
                    </div>
                    <Separator className="bg-slate-50" />
                  </CardContent>
                  <CardFooter className="p-8 pt-0 flex justify-between items-center">
                    <div className="flex items-center text-[10px] font-semibold text-slate-300 uppercase tracking-wide">
                       <Clock size={14} className="mr-2" /> {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                    <Link to={`/job/${job._id}`}>
                      <Button size="sm" className="bg-slate-900 hover:bg-primary text-white rounded-lg px-6 font-bold transition-all shadow-md">
                        Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── POPULAR CATEGORIES ─── */}
      <section className="py-32 px-4 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Explore Categories</h2>
            <p className="text-slate-500 font-medium text-lg">Find opportunities across diverse industries and domains.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularCategories.map((cat, i) => (
              <Card key={i} className={`border-none group cursor-pointer hover:-translate-y-2 transition-all duration-300 rounded-xl p-10 ${cat.color}`}>
                <CardContent className="p-0 flex flex-col items-start">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-slate-900 mb-8 shadow-sm group-hover:scale-110 transition-transform">
                    <Briefcase size={28} />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-2">{cat.label}</h3>
                  <p className="font-semibold opacity-60 text-xs uppercase tracking-wider">{cat.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-32 px-4 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -mr-64 -mt-64" />
        <div className="max-w-6xl mx-auto relative z-10 text-white">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Success Stories</h2>
            <p className="text-emerald-100 font-medium text-lg italic opacity-80">Join 50,000+ professionals who found their career path through us.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {testimonials.map((t, i) => (
              <Card key={i} className="bg-white/10 backdrop-blur-xl border-white/10 text-white rounded-2xl p-10 hover:bg-white/15 transition-all">
                <CardContent className="p-0">
                  <div className="flex gap-1 mb-8">
                    {[...Array(t.rating)].map((_, j) => <Star key={j} size={16} fill="#fbbf24" className="text-yellow-400" />)}
                  </div>
                  <p className="text-lg font-medium leading-relaxed mb-10 italic">"{t.text}"</p>
                  <div className="flex items-center gap-5">
                    <Avatar className="h-14 w-14 rounded-lg border-2 border-white/20 shadow-xl">
                      <AvatarFallback className="bg-white/20 text-white font-bold text-lg">{t.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-xl tracking-tight leading-none mb-1">{t.name}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RECRUITER CTA ─── */}
      <section className="py-32 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-900 rounded-3xl p-16 md:p-24 text-center border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">Ready to Scale?</h2>
              <p className="text-slate-400 text-lg md:text-xl font-medium mb-12 max-w-xl mx-auto leading-relaxed">Post your requirements today and reach India's top 1% talent pool instantly.</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link to="/register">
                  <Button className="h-16 px-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl transition-all hover:scale-[1.05]">
                    Start Hiring Now
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="h-16 px-12 rounded-xl border-white/10 text-white hover:bg-white/5 font-bold text-lg">
                    Recruiter Login
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white pt-32 pb-20 px-4 border-t border-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-20 mb-24">
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-white font-bold text-2xl">C</span>
                </div>
                <span className="text-slate-900 font-bold text-3xl tracking-tight">careerpoint</span>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed">India's most trusted job portal connecting visionary companies with exceptional talent across the nation.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-16 md:gap-24">
              <div className="space-y-6">
                <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Platform</p>
                <ul className="space-y-4 text-sm font-medium text-slate-400">
                  <li><Link to="/jobs" className="hover:text-primary transition-colors">Find Jobs</Link></li>
                  <li><Link to="/register" className="hover:text-primary transition-colors">Post a Job</Link></li>
                  <li><Link to="#" className="hover:text-primary transition-colors">Pricing Plans</Link></li>
                </ul>
              </div>
              <div className="space-y-6">
                <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Company</p>
                <ul className="space-y-4 text-sm font-medium text-slate-400">
                  <li><Link to="#" className="hover:text-primary transition-colors">About Us</Link></li>
                  <li><Link to="#" className="hover:text-primary transition-colors">Contact</Link></li>
                  <li><Link to="#" className="hover:text-primary transition-colors">Privacy</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <Separator className="mb-12 bg-slate-50" />
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
             <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
               © {new Date().getFullYear()} CareerPoint India. All Rights Reserved.
             </p>
             <div className="flex gap-6 opacity-30">
               <div className="w-10 h-10 bg-slate-900 rounded-full" />
               <div className="w-10 h-10 bg-slate-900 rounded-full" />
               <div className="w-10 h-10 bg-slate-900 rounded-full" />
             </div>
          </div>
        </div>
      </footer>
    </div>

  );
};

export default HomePage;

