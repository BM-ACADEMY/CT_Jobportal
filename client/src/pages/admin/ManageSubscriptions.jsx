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
    roles: [],
    isActive: true,
    // Job Seeker
    hasResumeBuilder: false,
    resumeBuilderCount: 0,
    hasUnlimitedApplications: false,
    applicationLimit: 0,
    jobAlerts: 'None',
    hasProfileBoost: false,
    hasAIResumeReview: false,
    aiResumeReviewCount: 0,
    hasProfileViewInsights: false,
    hasMessageRecruiters: false,
    hasSalaryBenchmarking: false,
    hasSkillGapAnalysis: false,
    skillGapSessionsCount: 0,
    careerCounsellingCount: 0,
    hasInterviewPrep: false,
    hasPriorityBadge: false,
    // Recruiter
    activeJobPostings: 0,
    candidateSearchPerDay: 0,
    hasAICandidateMatching: false,
    aiCandidateMatchingCount: 0,
    hasATSPipeline: false,
    hasPriorityListing: false,
    hasAnalyticsDashboard: false,
    hasCandidateDBExport: false,
    hasBulkMessaging: false,
    hasVideoInterview: false,
    hasDedicatedManager: false,
    hasWhiteLabelProfile: false,
    // Organization
    userSeats: 1,
    companyProfileType: 'Basic',
    hasBrandedCareersPage: false,
    hasTeamCollaboration: false,
    teamCollaborationCount: 0,
    hasBulkApplicantManagement: false,
    hasInterviewScheduling: false,
    hasAPIIntegration: false,
    hasSSO: false,
    hasDedicatedOnboarding: false,
    hasSLAGuarantee: false,
    hasComplianceAudit: false
  });

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/subscriptions`);
      setSubscriptions(res.data);
    } catch (err) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const resetForm = () => {
    setForm({
      name: '', price: '', duration: 'Monthly', roles: [], isActive: true,
      hasResumeBuilder: false, resumeBuilderCount: 0,
      hasUnlimitedApplications: false, applicationLimit: 0,
      jobAlerts: 'None',
      hasProfileBoost: false, hasAIResumeReview: false, aiResumeReviewCount: 0,
      hasProfileViewInsights: false, hasMessageRecruiters: false,
      hasSalaryBenchmarking: false, hasSkillGapAnalysis: false, skillGapSessionsCount: 0,
      careerCounsellingCount: 0, hasInterviewPrep: false, hasPriorityBadge: false,
      activeJobPostings: 0, candidateSearchPerDay: 0, 
      hasAICandidateMatching: false, aiCandidateMatchingCount: 0,
      hasATSPipeline: false, hasPriorityListing: false, hasAnalyticsDashboard: false,
      hasCandidateDBExport: false, hasBulkMessaging: false, hasVideoInterview: false,
      hasDedicatedManager: false, hasWhiteLabelProfile: false,
      userSeats: 1, companyProfileType: 'Basic', hasBrandedCareersPage: false,
      hasTeamCollaboration: false, teamCollaborationCount: 0,
      hasBulkApplicantManagement: false,
      hasInterviewScheduling: false, hasAPIIntegration: false, hasSSO: false,
      hasDedicatedOnboarding: false, hasSLAGuarantee: false, hasComplianceAudit: false
    });
    setEditingId(null);
  };

  const handleEdit = (sub) => {
    setEditingId(sub._id);
    setForm({
      name: sub.name,
      price: sub.price,
      duration: sub.duration,
      roles: sub.roles || [],
      isActive: sub.isActive,
      // All flags & counts
      hasResumeBuilder: !!sub.hasResumeBuilder,
      resumeBuilderCount: sub.resumeBuilderCount || 0,
      hasUnlimitedApplications: !!sub.hasUnlimitedApplications,
      applicationLimit: sub.applicationLimit || 0,
      jobAlerts: sub.jobAlerts || 'None',
      hasProfileBoost: !!sub.hasProfileBoost,
      hasAIResumeReview: !!sub.hasAIResumeReview,
      aiResumeReviewCount: sub.aiResumeReviewCount || 0,
      hasProfileViewInsights: !!sub.hasProfileViewInsights,
      hasMessageRecruiters: !!sub.hasMessageRecruiters,
      hasSalaryBenchmarking: !!sub.hasSalaryBenchmarking,
      hasSkillGapAnalysis: !!sub.hasSkillGapAnalysis,
      skillGapSessionsCount: sub.skillGapSessionsCount || 0,
      careerCounsellingCount: sub.careerCounsellingCount || 0,
      hasInterviewPrep: !!sub.hasInterviewPrep,
      hasPriorityBadge: !!sub.hasPriorityBadge,
      activeJobPostings: sub.activeJobPostings || 0,
      candidateSearchPerDay: sub.candidateSearchPerDay || 0,
      hasAICandidateMatching: !!sub.hasAICandidateMatching,
      aiCandidateMatchingCount: sub.aiCandidateMatchingCount || 0,
      hasATSPipeline: !!sub.hasATSPipeline,
      hasPriorityListing: !!sub.hasPriorityListing,
      hasAnalyticsDashboard: !!sub.hasAnalyticsDashboard,
      hasCandidateDBExport: !!sub.hasCandidateDBExport,
      hasBulkMessaging: !!sub.hasBulkMessaging,
      hasVideoInterview: !!sub.hasVideoInterview,
      hasDedicatedManager: !!sub.hasDedicatedManager,
      hasWhiteLabelProfile: !!sub.hasWhiteLabelProfile,
      userSeats: sub.userSeats || 1,
      companyProfileType: sub.companyProfileType || 'Basic',
      hasBrandedCareersPage: !!sub.hasBrandedCareersPage,
      hasTeamCollaboration: !!sub.hasTeamCollaboration,
      teamCollaborationCount: sub.teamCollaborationCount || 0,
      hasBulkApplicantManagement: !!sub.hasBulkApplicantManagement,
      hasInterviewScheduling: !!sub.hasInterviewScheduling,
      hasAPIIntegration: !!sub.hasAPIIntegration,
      hasSSO: !!sub.hasSSO,
      hasDedicatedOnboarding: !!sub.hasDedicatedOnboarding,
      hasSLAGuarantee: !!sub.hasSLAGuarantee,
      hasComplianceAudit: !!sub.hasComplianceAudit
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };

      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/${editingId}`, payload);
        toast.success('Subscription updated');
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/subscriptions`, payload);
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
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/${id}`);
      toast.success('Subscription removed');
      setSubscriptions(subscriptions.filter(s => s._id !== id));
    } catch (err) {
      toast.error('Failed to delete subscription');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header - Simple & Professional */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Subscription Settings</h1>
            <p className="text-base text-slate-500 font-medium">Manage your platform's pricing models and service deliverability.</p>
          </div>
          
          <Button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="rounded-xl h-12 px-8 bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold text-sm shadow-sm flex items-center gap-2"
          >
            <Plus size={18} /> Create New Plan
          </Button>
        </div>
        <div className="h-px bg-slate-200 w-full" />
      </div>

      {/* Plans Directory - Simple Card Style */}
      <Card className="rounded-[24px] border-slate-200 shadow-sm overflow-hidden bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white gap-4">
             <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
             <p className="text-xs font-bold text-slate-400">Loading infrastructure...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Plan Name</th>
                  <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-center">Availability</th>
                  <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-center">Pricing</th>
                  <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-center">Status</th>
                  <th className="p-6 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-20 text-center text-slate-400 font-medium text-sm italic">No active subscription plans found.</td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 text-slate-900 flex items-center justify-center rounded-xl border border-slate-100 shadow-sm">
                             <Zap size={20} className={sub.isActive ? 'text-emerald-600 fill-emerald-600' : 'text-slate-400'} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 tracking-tight">{sub.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{sub.duration} billing</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                         <div className="flex flex-wrap justify-center gap-1.5">
                           {(sub.roles || []).map(r => (
                             <Badge key={r} variant="outline" className="px-2.5 py-0.5 bg-slate-50 text-slate-600 border-slate-200 text-[9px] font-bold uppercase tracking-tight rounded-md">
                               {r}
                             </Badge>
                           ))}
                         </div>
                      </td>
                      <td className="p-6 text-center">
                         <div className="text-sm font-bold text-slate-900">₹{sub.price.toLocaleString()}</div>
                         <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{sub.currency}</div>
                      </td>
                      <td className="p-6 text-center">
                         <div className="flex items-center justify-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${sub.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-tight ${sub.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {sub.isActive ? 'Active' : 'Draft'}
                            </span>
                         </div>
                      </td>
                      <td className="p-6 text-right">
                         <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(sub)} className="h-9 w-9 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
                              <Edit2 size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(sub._id)} className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
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
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Target Roles</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {[
                         { id: 'jobseeker', label: 'Job Seeker', icon: Users },
                         { id: 'recruiter', label: 'Recruiter', icon: ShieldCheck },
                         { id: 'company', label: 'Organization', icon: Building2 }
                       ].map(role => (
                         <div key={role.id} 
                           className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                             form.roles.includes(role.id) 
                             ? 'bg-emerald-50/50 border-emerald-600 shadow-sm' 
                             : 'bg-white border-slate-100 hover:border-slate-200'
                           }`} 
                           onClick={() => {
                             const newRoles = form.roles.includes(role.id) 
                               ? form.roles.filter(r => r !== role.id) 
                               : [...form.roles, role.id];
                             setForm({...form, roles: newRoles});
                           }}
                         >
                            <role.icon size={16} className={form.roles.includes(role.id) ? 'text-emerald-600' : 'text-slate-400'} />
                            <span className={`text-sm font-bold flex-1 ${form.roles.includes(role.id) ? 'text-emerald-700' : 'text-slate-600'}`}>{role.label}</span>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                               form.roles.includes(role.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200'
                            }`}>
                               {form.roles.includes(role.id) && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-10">
                    {/* Role-Specific Feature Toggles & Counts */}
                    <div className="space-y-12">
                       {form.roles.includes('jobseeker') && (
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                              <Users size={18} className="text-emerald-600" />
                              <Label className="text-xs font-bold uppercase text-slate-900 tracking-widest">Job Seeker Features & Limits</Label>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {[
                                { id: 'hasResumeBuilder', label: 'Resume Builder' },
                                { id: 'hasUnlimitedApplications', label: 'Unlimited Apps' },
                                { id: 'hasProfileBoost', label: 'Profile Boost' },
                                { id: 'hasAIResumeReview', label: 'AI Resume Review' },
                                { id: 'hasProfileViewInsights', label: 'View Insights' },
                                { id: 'hasMessageRecruiters', label: 'Msg Recruiters' },
                                { id: 'hasSalaryBenchmarking', label: 'Salary Bench' },
                                { id: 'hasSkillGapAnalysis', label: 'Skill Gap' },
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
                                 <Input type="number" value={form.resumeBuilderCount} onChange={(e) => setForm({...form, resumeBuilderCount: e.target.value})} className="h-10 rounded-xl bg-white" placeholder="Max Resumes" />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Application Limit</Label>
                                 <Input type="number" value={form.applicationLimit} onChange={(e) => setForm({...form, applicationLimit: e.target.value})} className="h-10 rounded-xl bg-white" placeholder="0 = Unlimited" />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">AI Review Limit</Label>
                                 <Input type="number" value={form.aiResumeReviewCount} onChange={(e) => setForm({...form, aiResumeReviewCount: e.target.value})} className="h-10 rounded-xl bg-white" placeholder="Max Reviews" />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Skill Gap Sessions</Label>
                                 <Input type="number" value={form.skillGapSessionsCount} onChange={(e) => setForm({...form, skillGapSessionsCount: e.target.value})} className="h-10 rounded-xl bg-white" placeholder="Sessions" />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Career Guidance</Label>
                                 <Input type="number" value={form.careerCounsellingCount} onChange={(e) => setForm({...form, careerCounsellingCount: e.target.value})} className="h-10 rounded-xl bg-white" placeholder="Sessions" />
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
                                       <SelectItem value="Real-time">Real-time</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                           </div>
                        </div>
                       )}

                       {form.roles.includes('recruiter') && (
                        <div className="space-y-6 pt-8 border-t border-slate-100">
                           <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                              <ShieldCheck size={18} className="text-blue-600" />
                              <Label className="text-xs font-bold uppercase text-slate-900 tracking-widest">Recruiter Features & Limits</Label>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {[
                                { id: 'hasAICandidateMatching', label: 'AI Matching' },
                                { id: 'hasATSPipeline', label: 'ATS Pipeline' },
                                { id: 'hasPriorityListing', label: 'Priority Listing' },
                                { id: 'hasAnalyticsDashboard', label: 'Analytics' },
                                { id: 'hasCandidateDBExport', label: 'DB Export' },
                                { id: 'hasBulkMessaging', label: 'Bulk Msg' },
                                { id: 'hasVideoInterview', label: 'Video Interview' },
                                { id: 'hasDedicatedManager', label: 'Ded. Manager' },
                                { id: 'hasWhiteLabelProfile', label: 'White-label' }
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
                                 <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">AI Matching Limit</Label>
                                 <Input type="number" value={form.aiCandidateMatchingCount} onChange={(e) => setForm({...form, aiCandidateMatchingCount: e.target.value})} className="h-10 rounded-xl bg-white" placeholder="0 = Unlimited" />
                              </div>
                           </div>
                        </div>
                       )}

                       {form.roles.includes('company') && (
                        <div className="space-y-6 pt-8 border-t border-slate-100">
                           <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                              <Building2 size={18} className="text-purple-600" />
                              <Label className="text-xs font-bold uppercase text-slate-900 tracking-widest">Organization Features & Limits</Label>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {[
                                { id: 'hasBrandedCareersPage', label: 'Branded Career' },
                                { id: 'hasTeamCollaboration', label: 'Collaboration' },
                                { id: 'hasBulkApplicantManagement', label: 'Bulk App Mgmt' },
                                { id: 'hasInterviewScheduling', label: 'Scheduling' },
                                { id: 'hasAPIIntegration', label: 'API/HRMS' },
                                { id: 'hasSSO', label: 'SSO/Security' },
                                { id: 'hasDedicatedOnboarding', label: 'Ded. Onboarding' },
                                { id: 'hasSLAGuarantee', label: 'SLA Guarantee' },
                                { id: 'hasComplianceAudit', label: 'Compliance' }
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
                                 <Input type="number" value={form.teamCollaborationCount} onChange={(e) => setForm({...form, teamCollaborationCount: e.target.value})} className="h-10 rounded-xl bg-white" placeholder="0 = Unlimited" />
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
