import React, { useState } from 'react';
import { Briefcase, MapPin, Building2, Clock, Globe, Bookmark, EyeOff, Star, CircleCheck } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// job.salary/experience are normally pre-formatted strings by the caller, but guard against
// receiving the raw backend shape ({min, max, currency, isRangeHidden}) directly to avoid
// "Objects are not valid as a React child" crashes.
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
      onClick={() => navigate(`/job/${job.id}`)}
      className="mb-5 rounded-[20px] border-border bg-card hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer group"
    >
      <CardContent className="p-6">
        <div className="flex gap-5">
          {/* Application Status Marker */}
          {application && application.status !== 'withdrawn' && (
            <div className="pt-1.5 flex flex-col justify-start">
               <CircleCheck className="w-5 h-5 text-emerald-500" />
            </div>
          )}

          {/* Job Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 pr-4">
                <h3 className="text-xl font-extrabold text-foreground group-hover:text-primary transition-colors leading-tight mb-1.5">
                  {job.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-bold text-foreground/80">{job.company}</span>
                  <Badge variant="outline" className="flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-lg bg-green-50 text-green-700 border-green-100 hover:bg-green-50 group-hover:bg-green-100 transition-colors">
                    {job.rating} <Star size={12} className="fill-green-700" />
                  </Badge>
                  <div className="h-4 w-px bg-border" />
                  <span className="text-muted-foreground text-xs font-bold">
                    {job.reviews} Reviews
                  </span>
                </div>
              </div>
              
              {/* Company Logo in Card */}
              <Avatar className="w-14 h-14 rounded-2xl border border-border flex items-center justify-center overflow-hidden bg-background shadow-sm flex-shrink-0 group-hover:border-primary/20 transition-colors p-2">
                 {job.logo && <AvatarImage src={job.logo} alt={job.company} className="object-contain" />}
                 <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold text-sm">
                   {job.company?.[0]?.toUpperCase() || 'C'}
                 </AvatarFallback>
              </Avatar>
            </div>

            {/* Job Metadata */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-5 text-[13px] font-bold text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  <Briefcase size={14} />
                </div>
                <span className="text-foreground/70">{formatExperience(job.experience)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  <span className="font-black text-xs">₹</span>
                </div>
                <span className="text-foreground/70">{formatSalary(job.salary)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  <MapPin size={14} />
                </div>
                <span className="text-foreground/70">{job.location}</span>
              </div>
            </div>

            {/* Summary / Description snippet */}
            <p className="mt-4 text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">
              {job.summary}
            </p>

            {/* Tags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {job.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1 text-[11px] font-bold tracking-wide rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-border/50"></div>

            {/* Footer of Card */}
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
              <div className="flex items-center gap-4 self-start sm:self-center">
                 <Badge variant="outline" className="text-xs text-muted-foreground font-bold bg-muted/30 px-2.5 py-1 rounded-full uppercase tracking-wider border-none">
                   {job.postedAt}
                 </Badge>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-center">
                <Button 
                  onClick={handleHide}
                  variant="ghost" 
                  size="sm" 
                  className="hidden sm:flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-destructive hover:bg-destructive/10 uppercase tracking-wider h-10 px-4 rounded-xl"
                >
                  <EyeOff size={16} /> <span>Hide</span>
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
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-2 text-xs font-black text-rose-500 hover:text-rose-600 hover:bg-rose-50 uppercase tracking-wider h-10 px-5 rounded-xl transition-colors border border-transparent hover:border-rose-200"
                  >
                    <span>Revoke</span>
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSave}
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2 text-xs font-black text-foreground/70 hover:text-primary hover:bg-primary/10 border-transparent hover:border-primary/20 uppercase tracking-wider h-10 px-5 rounded-xl transition-colors"
                  >
                    <Bookmark size={16} /> <span>Save</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetailedJobCard;
