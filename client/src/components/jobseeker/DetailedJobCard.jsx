import React, { useState } from 'react';
import { Briefcase, MapPin, EyeOff, Star, CircleCheck, BookmarkPlus } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, Typography, Tag, Button, Space, Divider } from 'antd';

const { Text, Title, Paragraph } = Typography;

const formatSalary = (salary) => {
  if (typeof salary === 'string') return salary;
  if (!salary || salary.isRangeHidden) return 'Not Disclosed';
  if (salary.min && salary.max) return `₹${(salary.min / 100000).toFixed(1)}–${(salary.max / 100000).toFixed(1)} LPA`;
  if (salary.min) return `₹${(salary.min / 100000).toFixed(1)}+ LPA`;
  return 'Competitive';
};

const formatExperience = (experience) => {
  if (typeof experience === 'string') return experience;
  if (!experience || (!experience.min && !experience.max)) return 'Any Experience';
  if (experience.min && experience.max) return `${experience.min}-${experience.max} Yrs`;
  return `${experience.min || experience.max}+ Yrs`;
};

const DetailedJobCard = ({ job, application, onRevoke }) => {
  const navigate = useNavigate();
  const [isHidden, setIsHidden] = useState(false);

  // Generate a background color for fallback avatar based on company name
  const colors = ['#eab308', '#334155', '#22c55e', '#0284c7', '#ea580c', '#7c3aed'];
  const colorIndex = job.company ? job.company.charCodeAt(0) % colors.length : 0;
  const bgColor = colors[colorIndex];

  const handleHide = async (e) => {
    e.stopPropagation();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/hide-job/${job.id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIsHidden(true);
      toast.success('Job hidden');
    } catch (err) {
      toast.error('Failed to hide job');
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/save-job/${job.id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Job saved');
    } catch (err) {
      toast.error('Failed to save job');
    }
  };

  if (isHidden) return null;

  return (
    <Card 
      bordered={false}
      onClick={() => navigate(`/job/${job.id}`)}
      bodyStyle={{ padding: '28px' }}
      className="mb-5 bg-white hover:shadow-lg transition-all cursor-pointer group shadow-sm border border-slate-200 rounded-none overflow-hidden"
    >
      <div className="flex gap-5">
        {/* Job Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center w-full">
               {/* Logo Block */}
               {job.logo && job.logo !== '/default-company-logo.png' && !job.logo.includes('default') ? (
                 <div className="w-16 h-16 bg-white flex items-center justify-center shrink-0 border border-slate-100">
                    <img src={job.logo} alt={job.company} className="max-w-[80%] max-h-[80%] object-contain" />
                 </div>
               ) : (
                 <div 
                   className="w-16 h-16 flex items-center justify-center text-white shrink-0 font-black text-2xl"
                   style={{ backgroundColor: bgColor }}
                 >
                   {job.company?.[0]?.toUpperCase() || <Briefcase size={28} />}
                 </div>
               )}

               <div className="flex-1 pr-4">
                 <div className="flex items-center gap-3 mb-2">
                   <Title level={4} className="m-0 text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                     {job.title}
                   </Title>
                   {application && application.status !== 'withdrawn' && (
                     <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                       <CircleCheck className="w-3.5 h-3.5 text-emerald-600" />
                       <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Applied</span>
                     </div>
                   )}
                 </div>
                 <div className="flex flex-wrap items-center gap-3">
                   <Text className="text-sm font-semibold text-slate-600">{job.company}</Text>
                   {job.rating && (
                     <>
                       <div className="h-4 w-px bg-slate-200" />
                       <div className="flex items-center gap-1 text-xs font-black text-green-600">
                         {job.rating} <Star size={12} className="fill-green-600" />
                       </div>
                     </>
                   )}
                   {job.reviews && (
                     <>
                       <div className="h-4 w-px bg-slate-200" />
                       <Text className="text-slate-400 text-xs font-semibold">
                         {job.reviews} Reviews
                       </Text>
                     </>
                   )}
                 </div>
               </div>
            </div>
          </div>

          {/* Job Metadata */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-6 text-[13px] font-semibold text-slate-600">
            <div className="flex items-center gap-2.5">
              <div className="text-slate-400">
                <Briefcase size={16} />
              </div>
              <span>{formatExperience(job.experience)}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="text-slate-400 font-bold text-sm">
                ₹
              </div>
              <span>{formatSalary(job.salary)}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="text-slate-400">
                <MapPin size={16} />
              </div>
              <span>{job.location}</span>
            </div>
          </div>

          {/* Summary / Description snippet */}
          <Paragraph className="mt-5 text-[14px] text-slate-500 line-clamp-2 leading-relaxed m-0">
            {job.summary}
          </Paragraph>

          {/* Tags */}
          <div className="mt-5 flex flex-wrap gap-2">
            {job.tags?.map((tag, idx) => (
              <Tag key={idx} bordered={false} className="px-3 py-1 text-[11px] font-bold tracking-wide bg-slate-100 text-slate-600 uppercase m-0 rounded-sm">
                {tag}
              </Tag>
            ))}
          </div>

          <Divider className="my-6" />

          {/* Footer of Card */}
          <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
            <div className="flex items-center">
               <Text className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-sm uppercase tracking-wider">
                 {job.postedAt}
               </Text>
            </div>
            <Space size="middle" className="self-end sm:self-center">
              <Button 
                onClick={handleHide}
                type="text"
                icon={<EyeOff size={16} />}
                className="hidden sm:flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
              >
                Hide
              </Button>
              {application && application.status !== 'withdrawn' ? (
                <Button 
                  onClick={async (e) => {
                     e.stopPropagation();
                     try {
                       const token = localStorage.getItem('token');
                       await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/applications/${application._id}/revoke`, {}, { headers: { Authorization: `Bearer ${token}` }});
                       toast.success('Application revoked');
                       if (onRevoke) onRevoke();
                     } catch (err) {
                       toast.error(err.response?.data?.msg || 'Error revoking application');
                     }
                  }}
                  danger
                  className="flex items-center text-xs font-bold uppercase tracking-wider rounded-sm px-6 h-9"
                >
                  Revoke
                </Button>
              ) : (
                <Button 
                  onClick={handleSave}
                  icon={<BookmarkPlus size={16} />}
                  className="flex items-center text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-600 uppercase tracking-wider rounded-sm px-6 h-9"
                >
                  Save
                </Button>
              )}
            </Space>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DetailedJobCard;
