import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, 
  ChevronLeft, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  Download
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Applicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/applications/job/${jobId}`);
      setApplicants(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (applicationId, status) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/applications/${applicationId}/status`, { status });
      toast.success(res.data.msg);
      setApplicants(prev => prev.map(app => 
        app._id === applicationId ? { ...app, status } : app
      ));
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

  const handleDownloadResume = (app) => {
    if (app.applicant?.profile?.resumeUrl) {
      const url = app.applicant.profile.resumeUrl.startsWith('http') 
        ? app.applicant.profile.resumeUrl 
        : `${API_DOMAIN}${app.applicant.profile.resumeUrl}`;
      window.open(url, '_blank');
    } else {
      toast.error("No resume uploaded by this applicant");
    }
  };

  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.applicant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.applicant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || app.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const configs = {
      pending: "bg-amber-50 text-amber-700 border-amber-100",
      shortlisted: "bg-emerald-50 text-emerald-700 border-emerald-100",
      rejected: "bg-rose-50 text-rose-700 border-rose-100",
      reviewed: "bg-blue-50 text-blue-700 border-blue-100"
    };
    return configs[status] || "bg-muted text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="w-10 h-10 p-0 rounded-xl border-border hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Talent <span className="text-emerald-600">Pipeline</span>
            </h1>
            <p className="text-muted-foreground font-bold text-sm mt-1">
              Reviewing {applicants.length} candidates for this position
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl border-border bg-white"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl border-border bg-white gap-2 font-bold">
                <Filter size={16} />
                {filter === 'all' ? 'Filter' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
              <DropdownMenuItem onClick={() => setFilter('all')} className="rounded-md font-bold">All Applicants</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('pending')} className="rounded-md font-bold text-amber-600">Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('shortlisted')} className="rounded-md font-bold text-emerald-600">Shortlisted</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('rejected')} className="rounded-md font-bold text-rose-600">Rejected</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredApplicants.map((app) => (
          <Card key={app._id} className="rounded-[28px] border-border shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="p-8 flex flex-col lg:flex-row gap-8">
                {/* Applicant Profile */}
                <div className="flex gap-5 lg:w-1/3">
                  <Avatar className="w-16 h-16 rounded-[20px] border-2 border-border group-hover:border-emerald-600/20 transition-all">
                    <AvatarFallback className="bg-emerald-50 text-emerald-600 font-black text-xl">
                      {app.applicant?.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-foreground group-hover:text-emerald-600 transition-colors leading-tight">
                      {app.applicant?.name}
                    </h4>
                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs">
                      <Mail size={14} />
                      {app.applicant?.email}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs">
                      <Clock size={14} />
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Answers Section */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 rounded-2xl p-6 border border-border/50">
                  {app.answers?.slice(0, 4).map((ans, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{ans.questionText}</p>
                      <p className="text-sm font-bold text-foreground line-clamp-2">{Array.isArray(ans.answer) ? ans.answer.join(', ') : ans.answer || '—'}</p>
                    </div>
                  ))}
                  {app.answers?.length > 4 && (
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2 cursor-pointer hover:underline">
                      + {app.answers.length - 4} more answers
                    </p>
                  )}
                </div>

                {/* Actions Section */}
                <div className="lg:w-1/4 flex flex-col justify-between items-end gap-6">
                  <Badge className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border ${getStatusBadge(app.status)}`}>
                    {app.status}
                  </Badge>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      onClick={() => updateStatus(app._id, 'rejected')}
                      className="w-12 h-12 rounded-2xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                    >
                      <XCircle size={24} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => updateStatus(app._id, 'shortlisted')}
                      className="w-12 h-12 rounded-2xl text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all border border-transparent hover:border-emerald-100"
                    >
                      <CheckCircle size={24} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="w-12 h-12 rounded-2xl border-border bg-white shadow-sm">
                          <MoreVertical size={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
                        <DropdownMenuItem 
                          onClick={() => navigate(`/jobseeker/profile/${app.applicant?._id}`)}
                          className="rounded-md font-bold gap-2 cursor-pointer"
                        >
                          <ExternalLink size={14} /> View Full Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDownloadResume(app)}
                          className="rounded-md font-bold gap-2 cursor-pointer"
                        >
                          <Download size={14} /> Download Resume
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(app._id, 'reviewed')} className="rounded-md font-bold gap-2">
                          <CheckCircle size={14} className="text-blue-600" /> Mark as Reviewed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredApplicants.length === 0 && (
          <div className="py-20 text-center space-y-4 bg-muted/20 border border-dashed border-border rounded-3xl">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <h3 className="text-xl font-black text-muted-foreground">No applicants found</h3>
            <p className="text-sm font-bold text-muted-foreground/70 max-w-xs mx-auto">
              Refine your search or filters to find the right candidates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applicants;
