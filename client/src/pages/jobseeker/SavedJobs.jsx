import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Bookmark, 
  Search, 
  MapPin, 
  Building2, 
  Calendar, 
  ChevronRight,
  Briefcase,
  Trash2
} from 'lucide-react';
import { Button, Card, Tag, Typography, Skeleton, Space } from 'antd';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageSOPBanner from '../../components/common/PageSOPBanner';

const { Title, Text, Paragraph } = Typography;

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
      <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
        <Skeleton active paragraph={{ rows: 1 }} />
        <Card bordered={false} className="rounded-none border border-slate-200">
           <Skeleton active avatar={{ size: 64, shape: 'square' }} paragraph={{ rows: 2 }} />
        </Card>
        <Card bordered={false} className="rounded-none border border-slate-200">
           <Skeleton active avatar={{ size: 64, shape: 'square' }} paragraph={{ rows: 2 }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-4">
      <PageSOPBanner pageKey="savedJobs" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={2} className="m-0 font-black tracking-tight text-slate-900">Saved Opportunities</Title>
          <Text className="text-slate-500 font-medium">Manage and track your bookmarked career positions.</Text>
        </div>
        <Tag bordered={false} className="m-0 px-4 py-2 bg-emerald-50 text-emerald-600 font-bold uppercase tracking-widest text-[11px] rounded-sm border border-emerald-100 flex items-center shrink-0">
          {(savedJobs || []).length} {((savedJobs || []).length === 1) ? 'POSITION' : 'POSITIONS'} SAVED
        </Tag>
      </div>

      {(!savedJobs || savedJobs.length === 0) ? (
        <Card bordered={false} className="text-center py-20 rounded-3xl border border-dashed border-slate-200 bg-slate-50 shadow-none">
          <Bookmark size={48} className="text-slate-300 mx-auto mb-4" />
          <Title level={4} className="m-0 text-slate-700">Inventory Empty</Title>
          <Paragraph className="text-slate-500 mt-2 mb-8">
            Start exploring and bookmarking opportunities that align with your career roadmap.
          </Paragraph>
          <Link to="/jobs">
            <Button type="primary" size="large" className="rounded-sm bg-slate-900 hover:bg-emerald-600 font-bold text-xs uppercase tracking-widest px-8 shadow-none h-11 border-none transition-colors">
              Browse Opportunities
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5">
          {Array.isArray(savedJobs) && savedJobs.map((job) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link to={`/job/${job._id}`} className="block group">
                <Card 
                  bordered={false} 
                  bodyStyle={{ padding: '20px' }}
                  className="rounded-none border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all bg-white"
                >
                  <div className="flex flex-col md:flex-row gap-5">
                    {/* Logo and Company */}
                    <div className="flex items-start md:items-center gap-5 flex-1">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-slate-100 overflow-hidden shrink-0 group-hover:border-emerald-200 transition-colors shadow-sm p-1.5">
                        {job.company?.logo ? (
                          <img src={`${API_DOMAIN}${job.company.logo}`} alt={job.company.name} className="max-w-[80%] max-h-[80%] object-contain" />
                        ) : (
                          <Building2 size={20} className="text-slate-300" />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-base text-slate-800 group-hover:text-emerald-600 transition-colors truncate mb-2 m-0">
                          {job.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={12} className="text-slate-400 shrink-0" />
                            <span className="text-slate-500 truncate">{job.company?.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{job.location || 'Remote'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <Briefcase size={12} className="shrink-0" />
                            <span>{job.jobType}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row items-center justify-between md:justify-end gap-5 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 shrink-0 h-14">
                      <div className="text-right hidden md:flex flex-col justify-center h-full mr-2">
                        <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Saved Date</span>
                        <span className="text-[12px] font-semibold text-slate-700">{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => handleUnsave(e, job._id)}
                          className="flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Unsave Opportunity"
                        >
                          <Trash2 size={15} strokeWidth={2.5} />
                        </button>
                        <div className="h-9 w-9 rounded flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors cursor-pointer">
                          <ChevronRight size={16} strokeWidth={2} />
                        </div>
                      </div>
                    </div>
                  </div>
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
