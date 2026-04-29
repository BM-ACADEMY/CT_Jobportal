import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Briefcase, IndianRupee, Clock, Loader2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/jobs`);
        setJobs(response.data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [API_BASE_URL]);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSalary = (salary) => {
    if (!salary || salary.isRangeHidden) return "Not Disclosed";
    if (salary.min && salary.max) {
      return `₹${(salary.min / 100000).toFixed(1)}-${(salary.max / 100000).toFixed(1)} LPA`;
    }
    return "Competitive";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Explore All Jobs</h1>
          <p className="text-slate-500 font-medium">Find your next big opportunity among {jobs.length} open positions</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-10 flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 focus-within:border-primary/20 transition-all">
            <Search size={20} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by title, company or location..."
              className="bg-transparent border-none outline-none w-full text-slate-700 font-semibold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="h-12 px-8 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold">
            <Filter size={18} className="mr-2" /> Filters
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-slate-500 font-bold">Loading opportunities...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div key={job._id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:border-primary/20 transition-colors overflow-hidden">
                    {job.company?.logo ? (
                      <img src={`${API_DOMAIN}${job.company.logo}`} alt={job.company.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                        {job.company?.name?.[0] || 'J'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-lg group-hover:text-primary transition-colors truncate tracking-tight">{job.title}</h3>
                    <p className="text-slate-400 text-sm font-bold">{job.company?.name}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none font-bold text-[10px] px-3">
                    <MapPin size={10} className="mr-1" /> {job.location || 'Remote'}
                  </Badge>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none font-bold text-[10px] px-3">
                    <IndianRupee size={10} className="mr-1" /> {formatSalary(job.salary)}
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/5 border-none font-bold text-[10px] px-3">
                    {job.jobType}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Clock size={12} className="mr-1.5" />
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                  <Link to={`/job/${job._id}`}>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 font-bold shadow-sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            {filteredJobs.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <Briefcase size={40} className="mx-auto text-slate-200 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No jobs match your search</h3>
                <p className="text-slate-500">Try adjusting your keywords or filters</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
