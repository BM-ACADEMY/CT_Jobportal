import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Briefcase, Building2, Users, TrendingUp, Star, ArrowRight, ChevronRight, MapPin, CircleCheck } from 'lucide-react';

const stats = [
  { label: 'Jobs Posted', value: '2L+', icon: <Briefcase size={20} /> },
  { label: 'Companies', value: '10K+', icon: <Building2 size={20} /> },
  { label: 'Job Seekers', value: '50L+', icon: <Users size={20} /> },
  { label: 'Placements', value: '1L+', icon: <TrendingUp size={20} /> },
];

const popularCategories = [
  { label: 'IT & Software', count: '45K Jobs', color: 'bg-blue-50/50 text-blue-700 border-blue-100 hover:bg-blue-100/50' },
  { label: 'Marketing', count: '12K Jobs', color: 'bg-purple-50/50 text-purple-700 border-purple-100 hover:bg-purple-100/50' },
  { label: 'Finance', count: '18K Jobs', color: 'bg-green-50/50 text-green-700 border-green-100 hover:bg-green-100/50' },
  { label: 'Design', count: '9K Jobs', color: 'bg-pink-50/50 text-pink-700 border-pink-100 hover:bg-pink-100/50' },
  { label: 'Sales', count: '22K Jobs', color: 'bg-orange-50/50 text-orange-700 border-orange-100 hover:bg-orange-100/50' },
  { label: 'Healthcare', count: '15K Jobs', color: 'bg-teal-50/50 text-teal-700 border-teal-100 hover:bg-teal-100/50' },
  { label: 'Education', count: '8K Jobs', color: 'bg-yellow-50/50 text-yellow-700 border-yellow-100 hover:bg-yellow-100/50' },
  { label: 'Engineering', count: '30K Jobs', color: 'bg-indigo-50/50 text-indigo-700 border-indigo-100 hover:bg-indigo-100/50' },
];

const featuredJobs = [
  { title: 'Senior React Developer', company: 'Google', location: 'Bengaluru', salary: '₹25-40 LPA', type: 'Full-time', logo: 'G', color: 'bg-blue-500' },
  { title: 'Product Manager', company: 'Microsoft', location: 'Hyderabad', salary: '₹30-50 LPA', type: 'Full-time', logo: 'M', color: 'bg-green-500' },
  { title: 'UI/UX Designer', company: 'Flipkart', location: 'Remote', salary: '₹12-20 LPA', type: 'Full-time', logo: 'F', color: 'bg-orange-500' },
  { title: 'Data Scientist', company: 'Amazon', location: 'Pune', salary: '₹20-35 LPA', type: 'Full-time', logo: 'A', color: 'bg-yellow-600' },
  { title: 'DevOps Engineer', company: 'Infosys', location: 'Chennai', salary: '₹15-25 LPA', type: 'Full-time', logo: 'I', color: 'bg-blue-700' },
  { title: 'Backend Engineer', company: 'Swiggy', location: 'Bengaluru', salary: '₹18-30 LPA', type: 'Full-time', logo: 'S', color: 'bg-orange-600' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Software Engineer at Google', text: 'Naukri helped me land my dream job in just 2 weeks. The AI-powered recommendations were spot on!', rating: 5 },
  { name: 'Rahul Mehta', role: 'Product Manager at Flipkart', text: 'The platform\'s reach is unmatched. I received 20+ interview calls within days of uploading my resume.', rating: 5 },
  { name: 'Sneha Patel', role: 'UI/UX Designer at Razorpay', text: 'Super easy to use. The job filters are super detailed and helped me find exactly what I was looking for.', rating: 5 },
];

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate(`/jobs?q=${searchQuery}&loc=${locationQuery}`);
  };

  return (
    <div className="w-full overflow-x-hidden bg-background">

      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden px-4 py-24 lg:py-32 border-b border-border">
        {/* Decorative Blobs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center w-full max-w-5xl mx-auto relative z-10 flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-background border border-primary/20 rounded-full px-4 py-1.5 mb-8 shadow-sm">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-primary text-[11px] font-black uppercase tracking-widest">India's #1 Job Portal · 2L+ Active Jobs</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-foreground leading-[0.9] mb-8 tracking-tighter">
            Find Your
            <span className="block text-primary">Dream Job</span>
            <span className="block italic font-serif font-light text-muted-foreground tracking-normal lowercase">Today</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-bold leading-relaxed">
            Connect with 10,000+ top companies. Get hired faster with AI-powered recommendations tailored just for you.
          </p>

          {/* Search Bar */}
          <div className="w-full bg-background/80 backdrop-blur-xl rounded-[32px] p-2 shadow-2xl shadow-primary/10 flex flex-col md:flex-row gap-2 max-w-3xl mx-auto mb-10 border border-border">
            <div className="flex items-center gap-3 flex-1 bg-muted/30 rounded-[24px] px-6 py-4.5 border border-transparent focus-within:border-primary/20 focus-within:bg-background transition-all">
              <Search size={22} className="text-primary flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Job title, skills, or company..."
                className="flex-1 text-foreground font-black bg-transparent outline-none text-base placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex items-center gap-3 flex-1 bg-muted/30 rounded-[24px] px-6 py-4.5 border border-transparent focus-within:border-primary/20 focus-within:bg-background transition-all">
              <MapPin size={22} className="text-muted-foreground flex-shrink-0" />
              <input
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                placeholder="City, state, or remote..."
                className="flex-1 text-foreground font-black bg-transparent outline-none text-base placeholder:text-muted-foreground/50"
              />
            </div>
            <Button
              onClick={handleSearch}
              size="lg"
              className="h-[64px] rounded-[24px] px-10 text-base font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 flex-shrink-0"
            >
              Search Jobs <ArrowRight size={18} />
            </Button>
          </div>

          {/* Popular Searches */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mr-4">Popular:</span>
            {['React Developer', 'Python', 'Product Manager', 'Remote', 'Freshers'].map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer bg-background hover:bg-primary/5 hover:text-primary hover:border-primary/30 py-1.5 px-4 rounded-full font-black text-[11px] transition-all"
                onClick={() => setSearchQuery(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-24 relative z-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-background/40 backdrop-blur-md rounded-[28px] p-8 text-center border border-border group hover:bg-background/60 hover:-translate-y-1 transition-all shadow-sm">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-primary bg-primary/10 p-2 rounded-xl group-hover:scale-110 transition-transform">{stat.icon}</span>
                <span className="text-4xl font-black text-foreground leading-none">{stat.value}</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── POPULAR CATEGORIES ─── */}
      <section className="py-24 px-4 bg-background">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tighter">Browse by Category</h2>
            <p className="text-muted-foreground text-lg font-bold">Explore thousands of jobs across all industries</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {popularCategories.map((cat, i) => (
              <Link
                key={i}
                to="/jobs"
                className={`flex flex-col items-start p-6 rounded-3xl border-2 ${cat.color} hover:scale-[1.02] transition-all group`}
              >
                <span className="font-black text-lg mb-2 group-hover:underline transition-all tracking-tight">{cat.label}</span>
                <span className="text-[11px] font-black uppercase tracking-widest opacity-60">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED JOBS ─── */}
      <section className="py-24 px-4 bg-muted/20">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tighter">Featured Jobs</h2>
              <p className="text-muted-foreground text-lg font-bold">Handpicked opportunities from top companies</p>
            </div>
            <Link to="/login">
              <Button variant="ghost" className="font-black text-primary hover:text-primary/80 gap-2 px-6">
                View all jobs <ChevronRight size={18} />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job, i) => (
              <div key={i} className="bg-background rounded-[32px] p-8 border border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all group">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-14 h-14 ${job.color} rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0`}>
                    {job.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-foreground text-lg group-hover:text-primary transition-colors truncate tracking-tight">{job.title}</h3>
                    <p className="text-muted-foreground text-sm font-bold">{job.company}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-8">
                  <Badge variant="secondary" className="bg-muted hover:bg-muted font-black text-[10px] px-3 py-1 rounded-lg border-none flex items-center gap-1.5 opacity-80">
                    <MapPin size={12} /> {job.location}
                  </Badge>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 font-black text-[10px] px-3 py-1 rounded-lg border-none opacity-80">{job.salary}</Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10 font-black text-[10px] px-3 py-1 rounded-lg border-none opacity-80">{job.type}</Badge>
                </div>
                <Link to="/login">
                  <Button className="w-full h-12 rounded-2xl font-black text-sm bg-muted text-foreground hover:bg-primary hover:text-primary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all flex items-center justify-center gap-2">
                    Apply Now <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 px-4 bg-background">
        <div className="w-full max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tighter">How It Works</h2>
          <p className="text-muted-foreground text-lg font-bold mb-20">Get hired in 3 simple steps</p>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Create Your Profile', desc: 'Sign up, add your skills, experience and let AI build your resume.', color: 'from-blue-400 to-blue-600' },
              { step: '02', title: 'Discover Opportunities', desc: 'Get AI-powered job recommendations that match your profile.', color: 'from-violet-400 to-violet-600' },
              { step: '03', title: 'Get Hired Fast', desc: 'Apply with one click. Track applications & get interview alerts.', color: 'from-emerald-400 to-emerald-600' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center group">
                <div className={`w-20 h-20 rounded-[24px] bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-black text-2xl mb-8 shadow-xl group-hover:scale-110 transition-transform`}>
                  {item.step}
                </div>
                <h3 className="text-xl font-black text-foreground mb-3 tracking-tight">{item.title}</h3>
                <p className="text-muted-foreground font-bold text-sm leading-relaxed max-w-[240px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 px-4 bg-primary relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)]" />
        <div className="w-full max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">Success Stories</h2>
            <p className="text-white/70 text-lg font-bold">Join millions who found their dream job</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 shadow-2xl relative">
                <div className="flex gap-0.5 mb-6">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white font-bold text-base leading-relaxed mb-8 italic">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary font-black text-lg">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-black text-white text-base tracking-tight">{t.name}</p>
                    <p className="text-white/60 text-xs font-bold">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR RECRUITERS CTA ─── */}
      <section className="py-24 px-4 bg-background">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-foreground rounded-[48px] p-12 md:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-black text-background mb-6 tracking-tighter">Are You Hiring?</h2>
              <p className="text-background/60 text-lg font-bold mb-10 max-w-lg mx-auto leading-relaxed">Post jobs for free. Reach 50L+ active job seekers across India with our high-performance talent network.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="xl" className="w-full sm:w-auto h-16 px-12 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:scale-[1.05] active:scale-[0.95] transition-all">
                    Post a Job Free <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto h-16 px-12 rounded-2xl border-background/20 text-background font-black text-lg hover:bg-background/10 transition-all">
                    Recruiter Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-foreground text-background/50 py-20 px-8 w-full border-t border-background/10">
        <div className="w-full max-w-6xl mx-auto grid md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6 no-underline">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-black text-lg">N</span>
              </div>
              <span className="text-background font-black text-2xl tracking-tighter">naukri</span>
            </Link>
            <p className="text-sm font-bold leading-relaxed mb-8">India's #1 job portal connecting talent with opportunity since 1997.</p>
            <div className="flex gap-4">
              {/* Social icons would go here */}
            </div>
          </div>
          {[
            { title: 'Job Seekers', links: ['Search Jobs', 'Create Resume', 'Career Advice', 'Salary Calculator'] },
            { title: 'Recruiters', links: ['Post a Job', 'Search Resumes', 'Pricing', 'Employer Branding'] },
            { title: 'Company', links: ['About Us', 'Contact', 'Privacy Policy', 'Terms of Service'] },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="text-background font-black uppercase text-xs tracking-widest mb-6">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((link, j) => (
                  <li key={j}><Link to="#" className="text-sm font-bold hover:text-primary transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="w-full max-w-6xl mx-auto border-t border-background/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-background/30 italic">Made with ❤️ in India</p>
          <p className="text-xs font-black uppercase tracking-widest text-background/30">
            © {new Date().getFullYear()} Naukri Clone. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
