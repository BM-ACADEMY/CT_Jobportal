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
        setSavedJobs(response.data);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Saved Jobs</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">Manage all your bookmarked opportunities in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-4 py-1.5 rounded-full">
            {savedJobs.length} {savedJobs.length === 1 ? 'Job' : 'Jobs'} Saved
          </Badge>
        </div>
      </div>

      {savedJobs.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-[32px] p-12 text-center">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-sm border border-slate-100">
            <Bookmark size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No saved jobs yet</h3>
          <p className="text-slate-500 font-bold text-sm max-w-sm mx-auto mb-8">
            Start exploring jobs and bookmark the ones that match your career goals.
          </p>
          <Link to="/jobs">
            <Button className="rounded-2xl px-8 h-14 bg-slate-900 hover:bg-emerald-600 text-white font-black transition-all">
              Browse Latest Jobs
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6">
          {savedJobs.map((job) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <Link to={`/job/${job._id}`}>
                <Card className="group border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-[32px] overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Logo and Company */}
                      <div className="flex items-start gap-6 flex-1">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shrink-0 group-hover:border-emerald-100 transition-colors">
                          {job.company?.logo ? (
                            <img src={`${API_DOMAIN}${job.company.logo}`} alt={job.company.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 size={32} className="text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors truncate">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-slate-500">
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className="text-slate-300" />
                              <span className="text-slate-900">{job.company?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-slate-300" />
                              <span>{job.location || 'Remote'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <Briefcase size={14} />
                              <span className="uppercase text-[10px] tracking-wider">{job.jobType}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                        <div className="text-right hidden md:block">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Posted On</p>
                          <p className="text-sm font-bold text-slate-900">{new Date(job.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => handleUnsave(e, job._id)}
                            className="h-12 w-12 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={20} />
                          </Button>
                          <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <ChevronRight size={24} />
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
