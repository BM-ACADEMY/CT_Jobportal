import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ChevronRight,
  ListPlus,
  Zap,
  ShieldCheck,
  Package,
  AlertCircle,
  Users,
  Building2
} from 'lucide-react';
import PricingCard from '../../components/subscription/PricingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const ManageSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    price: '',
    duration: 'Monthly',
    role: '',
    isActive: true,
    // Job Seeker
    hasResumeBuilder: false,
    resumeBuilderCount: 0,
    jobAlerts: 'None',
    hasProfileBoost: false,
    hasProfileViewInsights: false,
    hasMessageRecruiters: false,
    hasCareerCounselling: false,
    careerCounsellingCount: 0,
    hasInterviewPrep: false,
    hasPriorityBadge: false,
    // Recruiter
    activeJobPostings: 0,
    candidateSearchPerDay: 0,
    hasATSPipeline: false,
    hasAnalyticsDashboard: false,
    hasCandidateDBExport: false,
    hasBulkMessaging: false,
    hasVideoInterview: false,
    // Organization
    userSeats: 1,
    companyProfileType: 'Basic',
    hasTeamCollaboration: false,
    teamCollaborationCount: 0,
    hasBulkApplicantManagement: false,
    hasInterviewScheduling: false,
    hasDedicatedOnboarding: false
  });

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setSubscriptions(res.data);
      } else {
        console.error('API returned non-array data for subscriptions:', res.data);
        setSubscriptions([]);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      toast.error('Failed to load subscriptions');
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const resetForm = () => {
    setForm({
      name: '', price: '', duration: 'Monthly', role: '', isActive: true,
      hasResumeBuilder: false, resumeBuilderCount: 0,
      jobAlerts: 'None',
      hasProfileBoost: false,
      hasProfileViewInsights: false, hasMessageRecruiters: false,
      hasCareerCounselling: false, careerCounsellingCount: 0, 
      hasInterviewPrep: false, hasPriorityBadge: false,
      activeJobPostings: 0, candidateSearchPerDay: 0, 
      hasATSPipeline: false, hasAnalyticsDashboard: false,
      hasCandidateDBExport: false, hasBulkMessaging: false, hasVideoInterview: false,
      userSeats: 1, companyProfileType: 'Basic', 
      hasTeamCollaboration: false, teamCollaborationCount: 0,
      hasBulkApplicantManagement: false,
      hasInterviewScheduling: false,
      hasDedicatedOnboarding: false
    });
    setEditingId(null);
  };

  const handleEdit = (sub) => {
    setEditingId(sub._id);
    setForm({
      name: sub.name,
      price: sub.price,
      duration: sub.duration,
      role: sub.role || (sub.roles && sub.roles[0]) || '',
      isActive: sub.isActive,
      // All flags & counts
      hasResumeBuilder: !!sub.hasResumeBuilder,
      resumeBuilderCount: sub.resumeBuilderCount || 0,
      jobAlerts: sub.jobAlerts || 'None',
      hasProfileBoost: !!sub.hasProfileBoost,
      hasProfileViewInsights: !!sub.hasProfileViewInsights,
      hasMessageRecruiters: !!sub.hasMessageRecruiters,
      hasCareerCounselling: !!sub.hasCareerCounselling,
      careerCounsellingCount: sub.careerCounsellingCount || 0,
      hasInterviewPrep: !!sub.hasInterviewPrep,
      hasPriorityBadge: !!sub.hasPriorityBadge,
      activeJobPostings: sub.activeJobPostings || 0,
      candidateSearchPerDay: sub.candidateSearchPerDay || 0,
      hasATSPipeline: !!sub.hasATSPipeline,
      hasAnalyticsDashboard: !!sub.hasAnalyticsDashboard,
      hasCandidateDBExport: !!sub.hasCandidateDBExport,
      hasBulkMessaging: !!sub.hasBulkMessaging,
      hasVideoInterview: !!sub.hasVideoInterview,
      userSeats: sub.userSeats || 1,
      companyProfileType: sub.companyProfileType || 'Basic',
      hasTeamCollaboration: !!sub.hasTeamCollaboration,
      teamCollaborationCount: sub.teamCollaborationCount || 0,
      hasBulkApplicantManagement: !!sub.hasBulkApplicantManagement,
      hasInterviewScheduling: !!sub.hasInterviewScheduling,
      hasDedicatedOnboarding: !!sub.hasDedicatedOnboarding
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };

      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/${editingId}`, payload, config);
        toast.success('Subscription updated');
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/subscriptions`, payload, config);
        toast.success('Subscription created');
      }
      setModalOpen(false);
      fetchSubscriptions();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to save subscription');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Subscription removed');
      setSubscriptions(subscriptions.filter(s => s._id !== id));
    } catch (err) {
      toast.error('Failed to delete subscription');
    }
  };

  const seekerFeatures = [
    { label: 'Resume builder', key: 'hasResumeBuilder' },
    { label: 'Job alerts', key: 'jobAlerts' },
    { label: 'Profile boost', key: 'hasProfileBoost' },
    { label: 'Profile view insights', key: 'hasProfileViewInsights' },
    { label: 'Message recruiters', key: 'hasMessageRecruiters' },
    { label: 'Career counselling', key: 'careerCounsellingCount', unit: 'Sessions' },
    { label: 'Interview prep', key: 'hasInterviewPrep' },
    { label: 'Priority badge', key: 'hasPriorityBadge' }
  ];

  const recruiterFeatures = [
    { label: 'Job postings', key: 'activeJobPostings' },
    { label: 'Candidate search', key: 'candidateSearchPerDay', unit: '/day' },
    { label: 'ATS pipeline', key: 'hasATSPipeline' },
    { label: 'Analytics dashboard', key: 'hasAnalyticsDashboard' },
    { label: 'Candidate DB export', key: 'hasCandidateDBExport' },
    { label: 'Bulk messaging', key: 'hasBulkMessaging' },
    { label: 'Video interview', key: 'hasVideoInterview' }
  ];

  const organizationFeatures = [
    { label: 'Job postings', key: 'activeJobPostings', unit: '/month' },
    { label: 'User seats', key: 'userSeats' },
    { label: 'Company profile', key: 'companyProfileType' },
    { label: 'Team collaboration', key: 'hasTeamCollaboration' },
    { label: 'Bulk app management', key: 'hasBulkApplicantManagement' },
    { label: 'Interview scheduling', key: 'hasInterviewScheduling' },
    { label: 'Dedicated onboarding', key: 'hasDedicatedOnboarding' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tight uppercase">Subscription Catalog</h1>
            <p className="text-base text-slate-500 font-medium italic">Architect your platform's monetization strategy and tier structures.</p>
          </div>
          
          <Button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="rounded-2xl h-14 px-8 bg-slate-900 text-white hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3"
          >
            <Plus size={18} strokeWidth={3} /> Add New Plan
          </Button>
        </div>
        <div className="h-px bg-slate-200 w-full" />
      </div>

      {/* Role-Based Filtering Tabs */}
      <Tabs defaultValue="jobseeker" className="w-full space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <TabsList className="bg-slate-100 p-1.5 rounded-2xl w-fit">
              <TabsTrigger value="jobseeker" className="rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md">Job Seekers</TabsTrigger>
              <TabsTrigger value="recruiter" className="rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md">Recruiters</TabsTrigger>
              <TabsTrigger value="company" className="rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md">Organizations</TabsTrigger>
           </TabsList>
           
           {loading && (
             <div className="flex items-center gap-3 text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Synchronizing Data...</span>
             </div>
           )}
        </div>

        {['jobseeker', 'recruiter', 'company'].map(role => (
          <TabsContent key={role} value={role} className="m-0 focus-visible:ring-0">
            <div className="flex flex-col gap-8">
              {subscriptions
                .filter(sub => sub.role === role)
                .map((sub, idx) => (
                  <PricingCard 
                    key={sub._id}
                    plan={sub}
                    features={role === 'jobseeker' ? seekerFeatures : (role === 'recruiter' ? recruiterFeatures : organizationFeatures)}
                    isPopular={idx === 1}
                    footer={
                      <div className="flex items-center gap-3">
                        <Button 
                          onClick={() => handleEdit(sub)}
                          className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800"
                        >
                          <Edit2 size={14} className="mr-2" /> Edit Plan
                        </Button>
                        <Button 
                          onClick={() => handleDelete(sub._id)}
                          variant="outline"
                          className="w-12 h-12 rounded-xl border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    }
                  />
                ))}
              {subscriptions.filter(sub => sub.role === role).length === 0 && !loading && (
                <div className="col-span-full py-32 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                     <Package className="text-slate-300" size={32} />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No plans established for {role} role.</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Subscription Form Modal - Seeker Style */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-4xl rounded-[24px] p-0 border-slate-200 shadow-2xl overflow-hidden bg-white">
           <DialogHeader className="p-8 border-b border-slate-100 bg-white">
              <div className="space-y-1">
                 <DialogTitle className="text-2xl font-bold text-[#0f172a] tracking-tight">
                   {editingId ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                 </DialogTitle>
                 <DialogDescription className="text-sm text-slate-500 font-medium">Define the pricing, features, and accessibility for this plan.</DialogDescription>
              </div>
           </DialogHeader>

           <form onSubmit={handleSubmit} className="flex flex-col bg-white">
              <div className="p-8 overflow-y-auto space-y-10 max-h-[70vh] custom-scrollbar">
                 {/* Basic Parameters */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Plan Name</Label>
                       <div className="relative group">
                          <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                          <Input 
                            value={form.name} 
                            onChange={(e) => setForm({...form, name: e.target.value})}
                            className="rounded-xl border-slate-200 h-12 pl-12 font-medium text-sm bg-white focus:border-emerald-600 focus:ring-0 transition-all"
                            placeholder="e.g. Enterprise Elite"
                            required
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Pricing (INR)</Label>
                       <div className="relative group">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                          <Input 
                            type="number"
                            value={form.price} 
                            onChange={(e) => setForm({...form, price: e.target.value})}
                            className="rounded-xl border-slate-200 h-12 pl-12 font-medium text-sm bg-white focus:border-emerald-600 focus:ring-0 transition-all"
                            placeholder="0.00"
                            required
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Billing Cycle</Label>
                       <Select value={form.duration} onValueChange={(v) => setForm({...form, duration: v})}>
                          <SelectTrigger className="rounded-xl border-slate-200 h-12 font-medium text-sm bg-white focus:ring-0 focus:border-emerald-600">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                             <SelectItem value="Monthly" className="text-sm py-2">Monthly</SelectItem>
                             <SelectItem value="Quarterly" className="text-sm py-2">Quarterly</SelectItem>
                             <SelectItem value="Yearly" className="text-sm py-2">Yearly</SelectItem>
                             <SelectItem value="Lifetime" className="text-sm py-2">Lifetime</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                 </div>

                 {/* Role Authorization */}
                 <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Target Role</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {[
                         { id: 'jobseeker', label: 'Job Seeker', icon: Users },
                         { id: 'recruiter', label: 'Recruiter', icon: ShieldCheck },
                         { id: 'company', label: 'Organization', icon: Building2 }
                       ].map(role => (
                         <div key={role.id} 
                           className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                             form.role === role.id 
                             ? 'bg-emerald-50/50 border-emerald-600 shadow-sm' 
                             : 'bg-white border-slate-100 hover:border-slate-200'
                           }`} 
                           onClick={() => setForm({...form, role: role.id})}
                         >
                            <role.icon size={16} className={form.role === role.id ? 'text-emerald-600' : 'text-slate-400'} />
                            <span className={`text-sm font-bold flex-1 ${form.role === role.id ? 'text-emerald-700' : 'text-slate-600'}`}>{role.label}</span>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                               form.role === role.id ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200'
                            }`}>
                               {form.role === role.id && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-10">
                    {/* Role-Specific Feature Toggles & Counts */}
                    <div className="space-y-12">
                       {form.role === 'jobseeker' && (
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                              <Users size={18} className="text-emerald-600" />
                              <Label className="text-xs font-bold uppercase text-slate-900 tracking-widest">Job Seeker Features & Limits</Label>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {[
                                { id: 'hasResumeBuilder', label: 'Resume Builder' },
                                { id: 'hasProfileBoost', label: 'Profile Boost' },
                                
                                { id: 'hasProfileViewInsights', label: 'View Insights' },
                                { id: 'hasMessageRecruiters', label: 'Msg Recruiters' },
                                { id: 'hasCareerCounselling', label: 'Career Guidance' },
                                { id: 'hasInterviewPrep', label: 'Interview Prep' },
                                { id: 'hasPriorityBadge', label: 'Priority Badge' }
                              ].map(feature => (
                                <div key={feature.id} 
                                  onClick={() => setForm({...form, [feature.id]: !form[feature.id]})}
                                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                                    form[feature.id] ? 'bg-emerald-50/30 border-emerald-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'
                                  }`}
                                >
                                   <span className="text-[10px] font-bold text-slate-700">{feature.label}</span>
                                   <div className={`w-8 h-4 rounded-full relative transition-all ${form[feature.id] ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${form[feature.id] ? 'right-0.5' : 'left-0.5'}`} />
                                   </div>
                                </div>
                              ))}
                           </div>

                           {/* Numeric Limits for Seeker */}
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                              <div className="space-y-2">
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Resume Limit</Label>
                                 <Input type="number" disabled={!form.hasResumeBuilder} value={form.resumeBuilderCount} onChange={(e) => setForm({...form, resumeBuilderCount: e.target.value})} className="h-10 rounded-xl bg-white disabled:bg-slate-100/50 disabled:text-slate-400" placeholder="Max Resumes" />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Career Guidance</Label>
                                 <Input type="number" disabled={!form.hasCareerCounselling} value={form.careerCounsellingCount} onChange={(e) => setForm({...form, careerCounsellingCount: e.target.value})} className="h-10 rounded-xl bg-white disabled:bg-slate-100/50 disabled:text-slate-400" placeholder="Sessions" />
                              </div>
                              <div className="space-y-2 lg:col-span-1">
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Job Alerts</Label>
                                 <Select value={form.jobAlerts} onValueChange={(v) => setForm({...form, jobAlerts: v})}>
                                    <SelectTrigger className="h-10 rounded-xl bg-white">
                                       <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="None">None</SelectItem>
                                       <SelectItem value="Daily">Daily</SelectItem>
                                       <SelectItem value="Weekly">Weekly</SelectItem>
                                       <SelectItem value="Monthly">Monthly</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                           </div>
                        </div>
                       )}

                       {form.role === 'recruiter' && (
                        <div className="space-y-6 pt-8 border-t border-slate-100">
                           <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                              <ShieldCheck size={18} className="text-blue-600" />
                              <Label className="text-xs font-bold uppercase text-slate-900 tracking-widest">Recruiter Features & Limits</Label>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {[
                                
                                { id: 'hasATSPipeline', label: 'ATS Pipeline' },
                                
                                { id: 'hasAnalyticsDashboard', label: 'Analytics' },
                                { id: 'hasCandidateDBExport', label: 'DB Export' },
                                { id: 'hasBulkMessaging', label: 'Bulk Msg' },
                                { id: 'hasVideoInterview', label: 'Video Interview' },
                                
                                
                              ].map(feature => (
                                <div key={feature.id} 
                                  onClick={() => setForm({...form, [feature.id]: !form[feature.id]})}
                                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                                    form[feature.id] ? 'bg-blue-50/30 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'
                                  }`}
                                >
                                   <span className="text-[10px] font-bold text-slate-700">{feature.label}</span>
                                   <div className={`w-8 h-4 rounded-full relative transition-all ${form[feature.id] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${form[feature.id] ? 'right-0.5' : 'left-0.5'}`} />
                                   </div>
                                </div>
                              ))}
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-blue-50/20 rounded-2xl border border-blue-50">
                              <div className="space-y-2">
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Active Job Postings</Label>
                                 <Input type="number" value={form.activeJobPostings} onChange={(e) => setForm({...form, activeJobPostings: e.target.value})} className="h-10 rounded-xl bg-white" placeholder="0 = Unlimited" />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Candidate Search/Day</Label>
                                 <Input type="number" value={form.candidateSearchPerDay} onChange={(e) => setForm({...form, candidateSearchPerDay: e.target.value})} className="h-10 rounded-xl bg-white" placeholder="0 = Unlimited" />
                              </div>
                              <div className="space-y-2">
                                 
                                 
                              </div>
                           </div>
                        </div>
                       )}

                       {form.role === 'company' && (
                        <div className="space-y-6 pt-8 border-t border-slate-100">
                           <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                              <Building2 size={18} className="text-purple-600" />
                              <Label className="text-xs font-bold uppercase text-slate-900 tracking-widest">Organization Features & Limits</Label>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {[
                                
                                { id: 'hasTeamCollaboration', label: 'Collaboration' },
                                { id: 'hasBulkApplicantManagement', label: 'Bulk App Mgmt' },
                                { id: 'hasInterviewScheduling', label: 'Scheduling' },
                                
                                
                                { id: 'hasDedicatedOnboarding', label: 'Ded. Onboarding' },
                                
                                
                              ].map(feature => (
                                <div key={feature.id} 
                                  onClick={() => setForm({...form, [feature.id]: !form[feature.id]})}
                                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                                    form[feature.id] ? 'bg-purple-50/30 border-purple-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'
                                  }`}
                                >
                                   <span className="text-[10px] font-bold text-slate-700">{feature.label}</span>
                                   <div className={`w-8 h-4 rounded-full relative transition-all ${form[feature.id] ? 'bg-purple-600' : 'bg-slate-200'}`}>
                                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${form[feature.id] ? 'right-0.5' : 'left-0.5'}`} />
                                   </div>
                                </div>
                              ))}
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-purple-50/20 rounded-2xl border border-purple-50">
                              <div className="space-y-2">
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">User Seats</Label>
                                 <Input type="number" value={form.userSeats} onChange={(e) => setForm({...form, userSeats: e.target.value})} className="h-10 rounded-xl bg-white" placeholder="Max Seats" />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Team Collaboration Limit</Label>
                                 <Input type="number" disabled={!form.hasTeamCollaboration} value={form.teamCollaborationCount} onChange={(e) => setForm({...form, teamCollaborationCount: e.target.value})} className="h-10 rounded-xl bg-white disabled:bg-slate-100/50 disabled:text-slate-400" placeholder="0 = Unlimited" />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Profile Type</Label>
                                 <Select value={form.companyProfileType} onValueChange={(v) => setForm({...form, companyProfileType: v})}>
                                    <SelectTrigger className="h-10 rounded-xl bg-white">
                                       <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="Basic">Basic</SelectItem>
                                       <SelectItem value="Branded">Branded</SelectItem>
                                       <SelectItem value="Full Custom">Full Custom</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                           </div>
                        </div>
                       )}
                    </div>
                 </div>

                  {/* Overall Status */}
                  <div className="pt-8 border-t border-slate-100 flex justify-end items-center gap-6">
                    <div className="flex items-center gap-3">
                       <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Plan Status</Label>
                       <Select value={form.isActive.toString()} onValueChange={(v) => setForm({...form, isActive: v === 'true'})}>
                          <SelectTrigger className={`rounded-xl h-10 w-32 font-bold text-xs transition-all focus:ring-0 ${form.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-red-200 bg-red-50 text-red-600'}`}>
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                             <SelectItem value="true" className="text-emerald-600 text-xs font-bold">Active</SelectItem>
                             <SelectItem value="false" className="text-red-600 text-xs font-bold">Draft</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                  </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 justify-end">
                 <Button 
                   type="button" 
                   variant="ghost" 
                   className="rounded-xl h-12 px-6 font-bold text-sm text-slate-500 hover:bg-slate-100 transition-all" 
                   onClick={() => setModalOpen(false)}
                 >
                   Cancel
                 </Button>
                 <Button 
                   type="submit" 
                   className="rounded-xl h-12 px-8 font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm"
                 >
                   {editingId ? 'Save Changes' : 'Create Plan'}
                 </Button>
              </div>
           </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageSubscriptions;
