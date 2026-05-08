import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash2, Search, Loader2, Briefcase, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/jobs`);
      setJobs(res.data);
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/admin/jobs/${id}`);
      toast.success('Job deleted successfully');
      setJobs(jobs.filter(j => j._id !== id));
    } catch (err) {
      toast.error('Failed to delete job');
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) || 
    (job.company?.companyName && job.company.companyName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header - Simple & Professional */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Opportunity Registry</h1>
            <p className="text-base text-slate-500 font-medium">Global database of active and historical employment opportunities.</p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <Input
              type="text"
              className="pl-12 h-12 border border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-0 font-medium text-sm bg-white shadow-sm transition-all"
              placeholder="Search by title or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="h-px bg-slate-200 w-full" />
      </div>

      {/* Metrics Row - Elegant Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Listings', value: jobs.length, color: 'text-slate-900', bg: 'bg-slate-50/50' },
          { label: 'Active Nodes', value: jobs.length, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { label: 'Platform Velocity', value: 'Optimal', color: 'text-emerald-600', bg: 'bg-emerald-50/50' }
        ].map((stat, i) => (
          <Card key={i} className="p-6 rounded-[24px] border-slate-200 shadow-sm bg-white">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} tracking-tight tabular-nums`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Table Section */}
      <Card className="rounded-[24px] border-slate-200 shadow-sm overflow-hidden bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white gap-4">
            <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
            <p className="text-xs font-bold text-slate-400">Syncing registry...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Opportunity</th>
                  <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Organization</th>
                  <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Classification</th>
                  <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-center">Date</th>
                  <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-20 text-center text-slate-400 font-medium text-sm italic">No records identified.</td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center shadow-sm transition-all group-hover:scale-105 group-hover:text-emerald-600 group-hover:border-emerald-100">
                            <Briefcase size={18} />
                          </div>
                          <div className="space-y-0.5">
                            <Link to={`/job/${job._id}`} target="_blank" className="text-sm font-bold text-slate-900 tracking-tight hover:text-emerald-600 transition-colors">
                              {job.title}
                            </Link>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                              <MapPin size={12} className="text-emerald-600" />
                              {job.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="text-xs font-bold text-slate-600 tracking-tight">{job.company?.companyName || 'Unidentified'}</div>
                      </td>
                      <td className="p-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg border border-slate-100 text-[9px] font-bold uppercase tracking-tight text-slate-400 bg-slate-50 group-hover:bg-white transition-colors">
                          {job.employmentType}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                         <span className="text-xs text-slate-400 font-bold tabular-nums">
                            {new Date(job.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                         </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => handleDelete(job._id)}
                             className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-lg"
                             title="Terminate Listing"
                           >
                             <Trash2 size={16} />
                           </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ManageJobs;
