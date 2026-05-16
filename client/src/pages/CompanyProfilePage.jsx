import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, MapPin, Globe, Users, Calendar, Briefcase, 
  ChevronRight, 
  CheckCircle2, Sparkles, FileText, PlayCircle, Image as ImageIcon,
  ShieldCheck, Info, ArrowLeft, Loader2, Link2, ExternalLink
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

const CompanyProfilePage = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/public/companies/${id}`);
        setCompany(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load company profile");
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center bg-white gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
            <Building2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Company Not Found</h2>
        <Link to="/companies">
            <Button variant="ghost" className="text-emerald-600 font-bold">Return to Directory</Button>
        </Link>
      </div>
    );
  }

  const hasFullProfile = company.subscription?.companyProfileType && company.subscription.companyProfileType !== 'No';

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero / Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <Link to="/companies" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors mb-8 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Back to Companies</span>
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
              ) : (
                <Building2 size={40} className="text-slate-200" />
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{company.display_name || company.name}</h1>
                {company.is_verified && (
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 size={12} className="mr-1.5" /> Verified
                  </Badge>
                )}
              </div>
              <p className="text-lg text-slate-500 font-medium max-w-2xl">{company.tagline || company.industry}</p>
              
              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <MapPin size={14} className="text-emerald-600/70" /> {company.location || 'Global'}
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <Users size={14} className="text-emerald-600/70" /> {company.company_size_range || company.employeeCount || '10-50'} Employees
                </div>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-xs uppercase tracking-widest">
                    <Globe size={14} /> Website
                  </a>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                <Button className="h-12 px-10 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10">
                    Follow Company
                </Button>
                <div className="flex justify-center md:justify-end gap-4">
                    {company.social_links?.linkedin && <a href={company.social_links.linkedin} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100"><ExternalLink size={18} /></a>}
                    {company.social_links?.twitter && <a href={company.social_links.twitter} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100"><Globe size={18} /></a>}
                    {company.social_links?.instagram && <a href={company.social_links.instagram} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100"><Link2 size={18} /></a>}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="bg-transparent border-b border-slate-100 w-full justify-start rounded-none h-auto p-0 gap-8 mb-8">
              <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-slate-400 data-[state=active]:text-slate-900 font-bold text-xs uppercase tracking-widest px-0 py-4 transition-all">About</TabsTrigger>
              {hasFullProfile && <TabsTrigger value="gallery" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-slate-400 data-[state=active]:text-slate-900 font-bold text-xs uppercase tracking-widest px-0 py-4 transition-all">Gallery & Media</TabsTrigger>}
              {hasFullProfile && <TabsTrigger value="norms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-slate-400 data-[state=active]:text-slate-900 font-bold text-xs uppercase tracking-widest px-0 py-4 transition-all">Norms & Policies</TabsTrigger>}
              <TabsTrigger value="jobs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-slate-400 data-[state=active]:text-slate-900 font-bold text-xs uppercase tracking-widest px-0 py-4 transition-all">Open Roles ({company.openJobs?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-0 outline-none">
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <FileText size={16} />
                    </div>
                    Corporate Overview
                  </h3>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-600 leading-relaxed font-medium text-base whitespace-pre-wrap">
                      {company.about_us || company.description || 'No detailed description available.'}
                    </p>
                  </div>
                </div>

                {hasFullProfile && company.mission_statement && (
                  <div className="p-8 rounded-[32px] bg-emerald-600 text-white relative overflow-hidden">
                    <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
                    <div className="relative z-10 space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">Our Mission</p>
                      <p className="text-xl font-bold italic leading-relaxed">"{company.mission_statement}"</p>
                    </div>
                  </div>
                )}

                {hasFullProfile && company.culture_values?.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Sparkles size={16} />
                      </div>
                      Culture & Values
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {company.culture_values.map((val, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:border-emerald-200">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">{i+1}</div>
                          <span className="font-bold text-slate-700">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {hasFullProfile && (
              <TabsContent value="gallery" className="mt-0 outline-none">
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {company.video_intro_url && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <PlayCircle size={16} />
                        </div>
                        Corporate Feature
                      </h3>
                      <div className="aspect-video rounded-[32px] overflow-hidden border border-slate-100 bg-slate-900 shadow-2xl">
                         {/* Simple placeholder for video if it's not embeddable easily or just show link */}
                         <iframe 
                           className="w-full h-full"
                           src={company.video_intro_url.replace('watch?v=', 'embed/')} 
                           title="Company Video"
                           frameBorder="0"
                           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                           allowFullScreen
                         ></iframe>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <ImageIcon size={16} />
                      </div>
                      Visual Gallery
                    </h3>
                    {company.gallery_images?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {company.gallery_images.map((img, i) => (
                          <div key={i} className="group relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-video shadow-sm transition-all hover:shadow-xl">
                            <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                <p className="text-white text-xs font-bold uppercase tracking-widest">Explore Campus {i+1}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30 text-slate-300">
                        <ImageIcon size={48} className="mb-4 opacity-10" />
                        <p className="text-xs font-bold uppercase tracking-widest opacity-50">No visuals added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}

            {hasFullProfile && (
              <TabsContent value="norms" className="mt-0 outline-none">
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <ShieldCheck size={16} />
                      </div>
                      Operational Norms & Guidelines
                    </h3>
                    <div className="p-10 rounded-[32px] bg-white border border-slate-100 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -mr-16 -mt-16 z-0" />
                       <div className="relative z-10 prose prose-slate max-w-none">
                         <p className="text-slate-600 leading-relaxed font-medium text-base whitespace-pre-wrap">
                            {company.norms_conditions || "Standard corporate policies apply. Please contact HR for specific guidelines."}
                         </p>
                       </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="jobs" className="mt-0 outline-none">
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {company.openJobs?.length > 0 ? (
                    company.openJobs.map((job) => (
                      <Card key={job._id} className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                        <CardContent className="p-0">
                          <Link to={`/job/${job._id}`} className="flex flex-col md:flex-row items-start md:items-center p-6 gap-6">
                            <div className="flex-1 space-y-2">
                              <h4 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{job.title}</h4>
                              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><MapPin size={12} className="text-emerald-500" /> {job.location}</span>
                                <span className="flex items-center gap-1.5"><Briefcase size={12} className="text-emerald-500" /> {job.jobType}</span>
                                <span className="flex items-center gap-1.5"><Calendar size={12} className="text-emerald-500" /> {new Date(job.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 w-full md:w-auto">
                              <div className="hidden md:block text-right">
                                <p className="text-sm font-bold text-slate-900">{job.salary || 'Competitive'}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{job.experienceLevel}</p>
                              </div>
                              <Button variant="ghost" size="icon" className="ml-auto md:ml-0 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                                <ChevronRight size={20} />
                              </Button>
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    ))
                 ) : (
                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30 text-slate-300">
                      <Briefcase size={48} className="mb-4 opacity-10" />
                      <p className="text-xs font-bold uppercase tracking-widest opacity-50">No active job opportunities</p>
                    </div>
                 )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[32px] border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-8 space-y-8">
               <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                   <Info size={16} />
                 </div>
                 Firm Metrics
               </h3>
               
               <div className="space-y-6">
                 {[
                   { label: 'Founded', value: company.founded_year || company.foundedYear, icon: Calendar },
                   { label: 'Headquarters', value: company.location, icon: MapPin },
                   { label: 'Industry', value: company.industry, icon: Factory },
                   { label: 'Work Model', value: company.work_model?.join(', '), icon: Briefcase },
                 ].map((stat, i) => (
                   <div key={i} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600">
                        {stat.icon && <stat.icon size={18} />}
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <p className="text-sm font-bold text-slate-900">{stat.value || 'N/A'}</p>
                      </div>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>

          {company.perks && (
             <Card className="rounded-[32px] border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-8 space-y-6">
                   <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Sparkles size={16} />
                    </div>
                    Premium Perks
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {company.perks.health_insurance && <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 font-bold py-2 px-3 rounded-lg">Health Insurance</Badge>}
                    {company.perks.unlimited_pto && <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 font-bold py-2 px-3 rounded-lg">Unlimited PTO</Badge>}
                    {company.perks.equity_package && <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 font-bold py-2 px-3 rounded-lg">Equity Package</Badge>}
                  </div>
                </CardContent>
             </Card>
          )}

          <Card className="rounded-[32px] border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-8 space-y-6 text-center">
              <Sparkles className="w-10 h-10 text-emerald-500 mx-auto opacity-20" />
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Career Assistance</h4>
                <p className="text-xs text-slate-500 font-medium">Need help getting noticed by {company.name}?</p>
              </div>
              <Link to="/jobseeker/resume-builder" className="block">
                <Button variant="outline" className="w-full rounded-xl border-slate-100 font-bold text-xs uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600">Optimize Resume</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Internal Factory component for icon placeholder
const Factory = ({ size, className }) => <Building2 size={size} className={className} />;

export default CompanyProfilePage;
