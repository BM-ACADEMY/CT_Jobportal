import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowUpRight, MapPin, IndianRupee, Clock, Briefcase, Loader2 } from 'lucide-react';

const formatSalary = (salary) => {
  if (!salary || salary.isRangeHidden) return 'Not Disclosed';
  if (salary.min && salary.max) return `₹${(salary.min / 100000).toFixed(1)}–${(salary.max / 100000).toFixed(1)} LPA`;
  if (salary.min) return `₹${(salary.min / 100000).toFixed(1)}+ LPA`;
  return 'Competitive';
};

const JobCarousel = ({
  jobs = [],
  loading,
  eyebrow = 'Fresh Listings',
  title = 'Recent Opportunities',
  subtitle = 'The latest roles posted on the platform.',
  badgeText = 'Just Posted',
  emptyText = 'No jobs posted yet — check back soon.',
  viewAllLink = '/jobs',
}) => {
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

  // Show only dynamic database jobs (up to 6)
  const displayJobs = (jobs || []).slice(0, 6);

  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.25em] mb-3">
              <span className="w-8 h-px bg-emerald-300" /> {eyebrow}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tighter">{title}</h2>
            <p className="text-slate-500 mt-2 font-medium">{subtitle}</p>
          </div>
          <Link to={viewAllLink}>
            <Button className="h-11 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shrink-0 shadow-md shadow-emerald-600/10">
              View All
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-400 font-semibold text-sm">Loading opportunities...</p>
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <Briefcase className="w-10 h-10 text-slate-300 mb-4" />
            <p className="text-slate-400 font-semibold text-sm">{emptyText}</p>
          </div>
        ) : (
          <div>
            {/* Grid Layout of Job Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayJobs.map((job) => (
                <Link
                  key={job._id}
                  to={`/job/${job._id}`}
                  className="group bg-emerald-50/30 rounded-lg p-6 border border-emerald-100/80 hover:border-emerald-500 hover:bg-emerald-50/60 shadow-sm hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between min-h-[220px]"
                >
                  <div>
                    {/* Top Row: Logo, Title, and Action button */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg border border-emerald-100/60 bg-white overflow-hidden flex items-center justify-center shrink-0">
                          {job.company?.logo ? (
                            <img src={`${API_DOMAIN}${job.company.logo}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                              {job.company?.name?.[0] || 'J'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Badge className="bg-emerald-100/70 text-emerald-800 border-none text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 mb-1.5">
                            {badgeText}
                          </Badge>
                          <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors line-clamp-1">
                            {job.title}
                          </h3>
                          <p className="text-slate-500 text-xs font-semibold mt-0.5 line-clamp-1">{job.company?.name}</p>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <ArrowUpRight size={16} />
                      </div>
                    </div>

                    {/* Badges Row - Bottom of card */}
                    <div className="flex flex-wrap gap-2 mt-6">
                      <Badge className="bg-slate-50 text-slate-600 border border-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-md hover:bg-slate-50">
                        <MapPin size={10} className="mr-1 text-slate-400" />{job.location || 'Remote'}
                      </Badge>
                      {job.jobType && (
                        <Badge className="bg-slate-50 text-slate-600 border border-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-md hover:bg-slate-50">
                          {job.jobType}
                        </Badge>
                      )}
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-[10px] font-bold px-2 py-0.5 rounded-md hover:bg-emerald-50">
                        <IndianRupee size={10} className="mr-0.5 text-emerald-500" />{formatSalary(job.salary)}
                      </Badge>
                      <Badge className="bg-slate-50 text-slate-600 border border-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-md hover:bg-slate-50">
                        <Clock size={10} className="mr-1 text-slate-400" />{new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Button at the Bottom */}
            <div className="flex justify-center mt-12">
              <Link to={viewAllLink}>
                <Button className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer">
                  Load More
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default JobCarousel;
