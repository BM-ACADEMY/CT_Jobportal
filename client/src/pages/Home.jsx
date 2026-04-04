import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Tag } from 'antd';
import { Search, Briefcase, Building2, Users, TrendingUp, Star, ArrowRight, ChevronRight, MapPin, CheckCircle } from 'lucide-react';

const stats = [
  { label: 'Jobs Posted', value: '2L+', icon: <Briefcase size={20} /> },
  { label: 'Companies', value: '10K+', icon: <Building2 size={20} /> },
  { label: 'Job Seekers', value: '50L+', icon: <Users size={20} /> },
  { label: 'Placements', value: '1L+', icon: <TrendingUp size={20} /> },
];

const popularCategories = [
  { label: 'IT & Software', count: '45K Jobs', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Marketing', count: '12K Jobs', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Finance', count: '18K Jobs', color: 'bg-green-50 text-green-700 border-green-200' },
  { label: 'Design', count: '9K Jobs', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { label: 'Sales', count: '22K Jobs', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { label: 'Healthcare', count: '15K Jobs', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { label: 'Education', count: '8K Jobs', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { label: 'Engineering', count: '30K Jobs', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
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
    <div className="w-full overflow-x-hidden">

      {/* ─── HERO SECTION ─── */}
      <section className="hero-bg relative overflow-hidden px-4 py-24 lg:py-32 border-b border-gray-100">
        {/* Decorative Blobs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400 opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-400 opacity-20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center w-full max-w-5xl mx-auto relative z-10 flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-blue-200 rounded-full px-4 py-2 mb-8 shadow-sm">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-blue-700 text-sm font-bold tracking-wide">India's #1 Job Portal · 2L+ Active Jobs</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-tight mb-6 tracking-tight">
            Find Your
            <span className="gradient-text block mt-1">Dream Job</span>
            <span className="text-gray-900 block mt-1">Today</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Connect with 10,000+ top companies. Get hired faster with AI-powered recommendations tailored just for you.
          </p>

          {/* Search Bar */}
          <div className="w-full bg-white rounded-2xl p-3 shadow-xl shadow-blue-900/5 flex flex-col md:flex-row gap-3 max-w-3xl mx-auto mb-8 border border-gray-100">
            <div className="flex items-center gap-3 flex-1 bg-gray-50 rounded-xl px-4 py-3.5 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all">
              <Search size={22} className="text-blue-600 flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Job title, skills, or company..."
                className="flex-1 text-gray-800 font-medium bg-transparent outline-none text-base"
              />
            </div>
            <div className="flex items-center gap-3 flex-1 bg-gray-50 rounded-xl px-4 py-3.5 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all">
              <MapPin size={22} className="text-gray-400 flex-shrink-0" />
              <input
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                placeholder="City, state, or remote..."
                className="flex-1 text-gray-800 font-medium bg-transparent outline-none text-base"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base flex-shrink-0"
            >
              Search Jobs <ArrowRight size={18} />
            </button>
          </div>

          {/* Popular Searches */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider mr-2">Popular:</span>
            {['React Developer', 'Python', 'Product Manager', 'Remote', 'Freshers'].map(tag => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="text-sm px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all font-semibold"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-20 relative z-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 text-center border border-white hover:-translate-y-1 transition-transform shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-blue-600 bg-blue-100 p-1.5 rounded-lg">{stat.icon}</span>
                <span className="text-3xl font-black text-gray-900">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-600 font-bold tracking-wide uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── POPULAR CATEGORIES ─── */}
      <section className="py-20 px-4 bg-white">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-3">Browse by Category</h2>
            <p className="text-gray-500 text-lg font-medium">Explore thousands of jobs across all industries</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {popularCategories.map((cat, i) => (
              <Link
                key={i}
                to="/jobs"
                className={`flex flex-col items-start p-5 rounded-2xl border-2 ${cat.color} hover-lift transition-all group`}
              >
                <span className="font-bold text-base mb-1 group-hover:underline">{cat.label}</span>
                <span className="text-xs font-semibold opacity-75">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED JOBS ─── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-2">Featured Jobs</h2>
              <p className="text-gray-500 font-medium">Handpicked opportunities from top companies</p>
            </div>
            <Link to="/login" className="flex items-center gap-1 text-blue-600 font-bold hover:underline">
              View all <ChevronRight size={18} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredJobs.map((job, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover-lift cursor-pointer group">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 ${job.color} rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                    {job.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-base group-hover:text-blue-600 transition-colors truncate">{job.title}</h3>
                    <p className="text-gray-500 text-sm font-medium">{job.company}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full font-semibold border border-gray-100">
                    <MapPin size={12} /> {job.location}
                  </span>
                  <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-semibold border border-green-100">{job.salary}</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-100">{job.type}</span>
                </div>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border-2 border-gray-100 text-gray-600 font-bold text-sm hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  Apply Now <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 px-4 bg-white">
        <div className="w-full max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-500 text-lg font-medium mb-14">Get hired in 3 simple steps</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Profile', desc: 'Sign up, add your skills, experience and let AI build your resume.', color: 'from-blue-400 to-blue-600' },
              { step: '02', title: 'Discover Opportunities', desc: 'Get AI-powered job recommendations that match your profile.', color: 'from-purple-400 to-purple-600' },
              { step: '03', title: 'Get Hired Fast', desc: 'Apply with one click. Track applications & get interview alerts.', color: 'from-green-400 to-green-600' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-black text-xl mb-5 shadow-lg`}>
                  {item.step}
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-3">Success Stories</h2>
            <p className="text-blue-100 text-lg font-medium">Join millions who found their dream job</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card rounded-2xl p-6">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 font-medium text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR RECRUITERS CTA ─── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="w-full max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 shadow-2xl shadow-blue-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white mb-3">Are You Hiring?</h2>
              <p className="text-blue-100 text-lg font-medium mb-8">Post jobs for free. Reach 50L+ active job seekers across India.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="bg-white text-blue-700 font-black px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Post a Job Free <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-white/40 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  Recruiter Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 w-full">
        <div className="w-full max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-black text-base">N</span>
              </div>
              <span className="text-white font-black text-xl">naukri</span>
            </div>
            <p className="text-sm leading-relaxed">India's #1 job portal connecting talent with opportunity since 1997.</p>
          </div>
          {[
            { title: 'Job Seekers', links: ['Search Jobs', 'Create Resume', 'Career Advice', 'Salary Calculator'] },
            { title: 'Recruiters', links: ['Post a Job', 'Search Resumes', 'Pricing', 'Employer Branding'] },
            { title: 'Company', links: ['About Us', 'Contact', 'Privacy Policy', 'Terms of Service'] },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="text-white font-bold mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}><a href="#" className="text-sm hover:text-blue-400 transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="w-full max-w-[1200px] mx-auto border-t border-gray-800 pt-8 text-center text-sm">
          © {new Date().getFullYear()} Naukri Clone. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
