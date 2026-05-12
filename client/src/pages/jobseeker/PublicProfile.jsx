import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  ChevronLeft, 
  Download,
  Globe,
  Loader2,
  Calendar,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/user/profile/${id}`);
        setProfile(res.data);
        
        // Track view if visitor is not the owner
        const token = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (token && storedUser.id !== id) {
          axios.post(`${API_BASE_URL}/user/profile/${id}/view`).catch(() => {});
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!profile) return null;

  const handleDownloadCV = async () => {
    if (!profile.profile?.resumeUrl) {
      toast.error("No resume uploaded");
      return;
    }
    try {
      const url = profile.profile.resumeUrl.startsWith('http')
        ? profile.profile.resumeUrl
        : `${API_DOMAIN}${profile.profile.resumeUrl}`;
      const filename = profile.profile.resumeName || `${profile.name || 'resume'}.pdf`;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Failed to download resume");
    }
  };

  const handleOpenPortfolio = () => {
    if (profile.profile?.portfolioUrl) {
      const url = profile.profile.portfolioUrl.startsWith('http') 
        ? profile.profile.portfolioUrl 
        : `https://${profile.profile.portfolioUrl}`;
      window.open(url, '_blank');
    } else {
      toast.error("No portfolio provided");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="rounded-xl hover:bg-slate-100 font-bold text-slate-500"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Back
        </Button>
      </div>

      {/* Header Profile Card */}
      <Card className="rounded-[40px] border-none bg-slate-900 text-white overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <CardContent className="p-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <Avatar className="w-40 h-40 rounded-[48px] border-4 border-white/10 shadow-2xl">
              <AvatarFallback className="bg-emerald-600 text-white text-5xl font-black">
                {profile.name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h1 className="text-4xl font-black tracking-tight">{profile.name}</h1>
                  <CheckCircle2 size={24} className="text-emerald-500" />
                </div>
                <p className="text-emerald-400 font-bold text-lg">{profile.profile?.headline || 'Professional Job Seeker'}</p>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-white/60 font-bold text-sm">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-emerald-500" />
                  {profile.email}
                </div>
                {profile.profile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-emerald-500" />
                    {profile.profile.phone}
                  </div>
                )}
                {profile.profile?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-500" />
                    {profile.profile.location}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                <Button 
                  onClick={handleDownloadCV}
                  disabled={!profile.profile?.resumeUrl}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 font-black shadow-xl shadow-emerald-600/20"
                >
                  <Download size={18} className="mr-2" /> Download CV
                </Button>
                {profile.profile?.portfolioUrl ? (
                  <Button 
                    onClick={handleOpenPortfolio}
                    variant="outline" 
                    className="rounded-2xl px-8 border-white/20 text-white hover:bg-white/10 hover:border-white/40 font-black transition-all"
                  >
                    <Globe size={18} className="mr-2 text-emerald-500" /> View Portfolio
                  </Button>
                ) : (
                  <Button 
                    disabled
                    variant="outline" 
                    className="rounded-2xl px-8 border-white/5 text-white/20 bg-white/5 font-black cursor-not-allowed"
                  >
                    <Globe size={18} className="mr-2 opacity-20" /> No Portfolio
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Skills */}
        <div className="space-y-8">
          <Card className="rounded-[32px] border-slate-100 shadow-sm p-8 space-y-6">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">About Me</h3>
            <p className="text-slate-600 font-bold text-sm leading-relaxed">
              {profile.profile?.bio || 'No bio provided.'}
            </p>
            
            <Separator className="bg-slate-50" />
            
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Core Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {profile.profile?.skills?.map((skill, i) => (
                <Badge key={i} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider">
                  {skill}
                </Badge>
              )) || <p className="text-xs text-muted-foreground italic">No skills listed</p>}
            </div>
          </Card>
        </div>

        {/* Right Column: Experience & Education */}
        <div className="lg:col-span-2 space-y-8">
          {/* Experience */}
          <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Briefcase size={20} />
                </div>
                Professional Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {profile.profile?.experience?.map((exp, i) => (
                <div key={i} className="flex gap-6 relative group">
                  {i !== profile.profile.experience.length - 1 && (
                    <div className="absolute left-[20px] top-[40px] bottom-[-32px] w-0.5 bg-slate-50 group-hover:bg-emerald-100 transition-colors" />
                  )}
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 z-10 group-hover:border-emerald-600/20 transition-all">
                    <Building2 size={18} className="text-slate-400 group-hover:text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-900 leading-tight">{exp.role}</h4>
                    <p className="text-emerald-600 font-bold text-sm">{exp.company}</p>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest pt-1">
                      <Calendar size={12} />
                      {exp.duration}
                    </div>
                    <p className="text-slate-500 text-sm font-medium pt-2 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                </div>
              ))}
              {(!profile.profile?.experience || profile.profile.experience.length === 0) && (
                <p className="text-center py-4 text-sm font-bold text-muted-foreground italic">No experience added</p>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <GraduationCap size={20} />
                </div>
                Academic Background
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {profile.profile?.qualification?.map((edu, i) => (
                <div key={i} className="flex gap-6 relative group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:border-emerald-600/20 transition-all">
                    <GraduationCap size={18} className="text-slate-400 group-hover:text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-900 leading-tight">{edu.degree}</h4>
                    <p className="text-emerald-600 font-bold text-sm">{edu.institution}</p>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest pt-1">Class of {edu.year}</p>
                  </div>
                </div>
              ))}
              {(!profile.profile?.qualification || profile.profile.qualification.length === 0) && (
                <p className="text-center py-4 text-sm font-bold text-muted-foreground italic">No education added</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
