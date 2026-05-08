import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Bookmark, 
  Loader2, 
  Search, 
  MapPin, 
  Building2, 
  Calendar, 
  ChevronRight,
  Briefcase,
  Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, updateUser } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/user/saved-jobs`);
        if (Array.isArray(response.data)) {
          setSavedJobs(response.data);
        } else {
          console.error('API returned non-array data for saved jobs:', response.data);
          setSavedJobs([]);
        }
      } catch (error) {
        console.error('Error fetching saved jobs:', error);
        toast.error("Failed to load saved jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchSavedJobs();
  }, [API_BASE_URL]);

  const handleUnsave = async (e, jobId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await axios.post(`${API_BASE_URL}/user/save-job/${jobId}`);
      setSavedJobs(savedJobs.filter(job => job._id !== jobId));
      updateUser({ savedJobs: response.data.savedJobs });
      toast.success("Job removed from saved jobs");
    } catch (error) {
      console.error('Error removing job:', error);
      toast.error("Failed to remove job");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-slate-400 font-bold text-xs mt-4 uppercase tracking-widest">Loading Saved Jobs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Saved Opportunities</h1>
          <p className="text-base text-slate-500 font-medium">Manage and track your bookmarked career positions.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-4 py-1.5 rounded-lg text-xs tracking-tight">
          {(savedJobs || []).length} {((savedJobs || []).length === 1) ? 'Position' : 'Positions'} Saved
        </Badge>
      </div>

      {(!savedJobs || savedJobs.length === 0) ? (
        <Card className="border-dashed border-2 border-slate-200 bg-white rounded-[24px] p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-6 border border-slate-100">
            <Bookmark size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Inventory Empty</h3>
          <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto mb-8">
            Start exploring and bookmarking opportunities that align with your career roadmap.
          </p>
          <Link to="/jobs">
            <Button className="rounded-xl px-8 h-12 bg-slate-900 hover:bg-emerald-600 text-white font-bold transition-all text-xs uppercase tracking-widest">
              Browse Opportunities
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {Array.isArray(savedJobs) && savedJobs.map((job) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link to={`/job/${job._id}`}>
                <Card className="group border-slate-200 hover:border-emerald-200 hover:shadow-sm transition-all duration-300 rounded-[24px] overflow-hidden bg-white">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Logo and Company */}
                      <div className="flex items-center gap-5 flex-1">
                        <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 overflow-hidden shrink-0 group-hover:border-emerald-100 transition-colors shadow-sm">
                          {job.company?.logo ? (
                            <img src={`${API_DOMAIN}${job.company.logo}`} alt={job.company.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 size={24} className="text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            <div className="flex items-center gap-1.5">
                              <Building2 size={12} className="text-slate-300" />
                              <span className="text-slate-600">{job.company?.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} className="text-slate-300" />
                              <span>{job.location || 'Remote'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <Briefcase size={12} />
                              <span className="tracking-widest">{job.jobType}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-row items-center justify-between md:justify-end gap-6 border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6">
                        <div className="text-right hidden md:block space-y-0.5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Saved Date</p>
                          <p className="text-xs font-bold text-slate-900">{new Date(job.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => handleUnsave(e, job._id)}
                            className="h-10 w-10 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Unsave Opportunity"
                          >
                            <Trash2 size={18} />
                          </Button>
                          <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
