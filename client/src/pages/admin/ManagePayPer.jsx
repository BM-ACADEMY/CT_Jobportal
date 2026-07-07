import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Plus, Edit2, Trash2, Loader2, Sparkles, LayoutGrid, AlertTriangle, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const API_PAY_PER_URL = `${import.meta.env.VITE_API_BASE_URL}/pay-per/features`;

const FEATURE_OPTIONS = [
  { key: 'hasResumeBuilder', name: 'Resume Builder', roles: ['jobseeker'] },
  { key: 'hasProfileBoost', name: 'Profile Boost', roles: ['jobseeker'] },
  { key: 'hasProfileViewInsights', name: 'Profile View Insights', roles: ['jobseeker'] },
  { key: 'jobAlerts', name: 'Real-time Job Alerts', roles: ['jobseeker'] },
  { key: 'hasMessageRecruiters', name: 'Direct Messaging', roles: ['jobseeker', 'org_employee'] },
  { key: 'hasCareerCounselling', name: 'Career Counselling', roles: ['jobseeker'] },
  { key: 'hasInterviewPrep', name: 'Interview Prep', roles: ['jobseeker', 'college'] },
  { key: 'hasSalaryBenchmarking', name: 'Salary Benchmarking', roles: ['jobseeker'] },
  { key: 'hasSkillGapAnalysis', name: 'Skill Gap Analysis', roles: ['jobseeker'] },
  { key: 'hasPriorityBadge', name: 'Priority Application Badge', roles: ['jobseeker'] },
  { key: 'hasAiResumeReview', name: 'AI Resume Review', roles: ['jobseeker'] },
  { key: 'activeJobPostings', name: 'Additional Job Postings', roles: ['recruiter', 'company'] },
  { key: 'candidateSearchPerDay', name: 'Candidate Search Unlocks', roles: ['recruiter'] },
  { key: 'userSeats', name: 'Additional User Seats', roles: ['company'] },
  { key: 'companyProfileType', name: 'Branded Company Profile', roles: ['company'] },
  { key: 'hasBrandedCareersPage', name: 'Branded Careers Page', roles: ['company'] },
  { key: 'hasATSPipeline', name: 'ATS Pipeline', roles: ['company', 'recruiter', 'college'] },
  { key: 'hasAnalyticsDashboard', name: 'Analytics Dashboard', roles: ['company', 'recruiter', 'college'] },
  { key: 'hasCandidateDBExport', name: 'Candidate DB Export', roles: ['company', 'recruiter', 'college'] },
  { key: 'hasBulkMessaging', name: 'Bulk Messaging', roles: ['company', 'recruiter', 'college'] },
  { key: 'hasVideoInterview', name: 'Video Interview', roles: ['company', 'recruiter', 'college', 'org_employee'] },
  { key: 'hasPriorityListing', name: 'Priority Listing', roles: ['company', 'recruiter', 'college'] },
  { key: 'hasAICandidateMatching', name: 'AI Candidate Matching', roles: ['company', 'recruiter', 'college'] },
  { key: 'hasTeamCollaboration', name: 'Team Collaboration', roles: ['company', 'recruiter', 'college'] },
  { key: 'hasBulkApplicantManagement', name: 'Bulk Applicant Management', roles: ['company', 'recruiter', 'college'] },
  { key: 'hasInterviewScheduling', name: 'Interview Scheduling', roles: ['company', 'recruiter', 'college', 'org_employee'] },
  { key: 'hasApiIntegration', name: 'API & HRMS Integration', roles: ['company'] },
  { key: 'hasDedicatedOnboarding', name: 'Dedicated Onboarding', roles: ['company', 'recruiter', 'college'] },
  { key: 'hasCampusDrive', name: 'Campus Drive Management', roles: ['college'] },
  { key: 'hasVerifiedBadge', name: 'Verified Institution Badge', roles: ['college'] },
  { key: 'hasPlacementInsights', name: 'AI Placement Insights', roles: ['college'] },
  { key: 'hasRequests', name: 'Corporate Connect Request', roles: ['college', 'company'] },
];

const ManagePayPer = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCustomKey, setIsCustomKey] = useState(false);
  
  const [formData, setFormData] = useState({
    _id: null,
    name: '',
    featureKey: '',
    roles: ['jobseeker'],
    cost: '',
    days: '',
    usageCount: 0,
    description: '',
    isActive: true
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_PAY_PER_URL, { headers });
      setFeatures(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pay-per features');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (feature = null) => {
    if (feature) {
      setFormData({
        _id: feature._id,
        name: feature.name,
        featureKey: feature.featureKey,
        roles: feature.roles || [],
        cost: feature.cost,
        days: feature.days,
        usageCount: feature.usageCount || 0,
        description: feature.description || '',
        isActive: feature.isActive
      });
      setIsCustomKey(!FEATURE_OPTIONS.some(opt => opt.key === feature.featureKey));
    } else {
      setFormData({
        _id: null,
        name: '',
        featureKey: FEATURE_OPTIONS[0].key,
        roles: [FEATURE_OPTIONS[0].roles[0]],
        cost: '',
        days: 30,
        usageCount: 0,
        description: '',
        isActive: true
      });
      setIsCustomKey(false);
    }
    setShowModal(true);
  };

  const handleFeatureKeyChange = (key) => {
    if (key === 'CUSTOM') {
      setIsCustomKey(true);
      setFormData({ ...formData, featureKey: '' });
      return;
    }
    setIsCustomKey(false);
    const opt = FEATURE_OPTIONS.find(o => o.key === key);
    if (opt) {
      setFormData({
        ...formData,
        featureKey: key,
        name: formData.name || opt.name, // Only auto-fill if empty
        roles: opt.roles.some(r => formData.roles.includes(r)) ? formData.roles.filter(r => opt.roles.includes(r)) : [opt.roles[0]]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        cost: Number(formData.cost),
        days: Number(formData.days),
        usageCount: Number(formData.usageCount) || 0
      };

      if (formData._id) {
        await axios.put(`${API_PAY_PER_URL}/${formData._id}`, payload, { headers });
        toast.success('Feature updated successfully');
      } else {
        await axios.post(API_PAY_PER_URL, payload, { headers });
        toast.success('Feature created successfully');
      }
      setShowModal(false);
      fetchFeatures();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to save feature');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pay-per feature?')) return;
    try {
      await axios.delete(`${API_PAY_PER_URL}/${id}`, { headers });
      toast.success('Feature deleted successfully');
      setFeatures(features.filter(f => f._id !== id));
    } catch (err) {
      toast.error('Failed to delete feature');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`${API_PAY_PER_URL}/${id}`, { isActive: !currentStatus }, { headers });
      toast.success('Status updated');
      setFeatures(features.map(f => f._id === id ? { ...f, isActive: !currentStatus } : f));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Pay-per Features</h1>
          <p className="text-muted-foreground font-medium">Manage all features pricing for users without plans.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="h-11 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
          <Plus size={16} className="mr-2" /> Add Pay-per Feature
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : features.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
          <LayoutGrid size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800">No Pay-per Features</h3>
          <p className="text-sm text-slate-500 mt-2 mb-6">Create standalone features that users can purchase directly.</p>
          <Button onClick={() => handleOpenModal()} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            Create First Feature
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <Card key={f._id} className="rounded-[20px] shadow-sm hover:shadow-md transition-all border-slate-200 bg-white group overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {(f.roles || []).map(r => (
                      <Badge key={r} variant="outline" className="uppercase tracking-widest text-[9px] font-bold bg-slate-50 text-slate-500">
                        {r}
                      </Badge>
                    ))}
                  </div>
                  <button 
                    onClick={() => toggleStatus(f._id, f.isActive)}
                    className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md transition-colors ${f.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {f.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <CardTitle className="text-xl font-bold mt-2">{f.name}</CardTitle>
                <CardDescription className="font-medium text-xs font-mono text-slate-400">{f.featureKey}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-slate-600 line-clamp-2 min-h-[40px]">
                  {f.description || <span className="italic opacity-50">No description provided.</span>}
                </p>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Price</p>
                    <p className="text-2xl font-black text-emerald-600">₹{f.cost}</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="space-y-1 text-center">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Validity</p>
                    <p className="text-sm font-bold text-slate-700">{f.days} Days</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Usage Limit</p>
                    <p className="text-sm font-bold text-slate-700">{f.usageCount > 0 ? f.usageCount : 'Unlimited'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={() => handleOpenModal(f)} variant="outline" className="flex-1 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50">
                    <Edit2 size={14} className="mr-2" /> Edit
                  </Button>
                  <Button onClick={() => handleDelete(f._id)} variant="outline" className="rounded-xl border-rose-100 text-rose-600 hover:bg-rose-50 w-12 p-0">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden border-0">
            <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles size={18} /> {formData._id ? 'Edit Pay-per Feature' : 'Create Pay-per Feature'}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <X size={18} />
              </button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Target Roles</Label>
                  <div className="flex flex-wrap gap-4">
                    {['jobseeker', 'recruiter', 'company', 'college'].map(r => (
                      <label key={r} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formData.roles.includes(r)}
                          onChange={e => {
                            let newRoles = [...formData.roles];
                            if (e.target.checked) {
                              newRoles.push(r);
                            } else {
                              newRoles = newRoles.filter(role => role !== r);
                            }
                            if (newRoles.length === 0) newRoles = [r]; // prevent empty
                            
                            // Adjust valid featureKey if necessary
                            const validOptions = FEATURE_OPTIONS.filter(opt => opt.roles.some(optR => newRoles.includes(optR)));
                            let fKey = formData.featureKey;
                            let fName = formData.name;
                            if (fKey !== 'CUSTOM' && !isCustomKey) {
                              if (!validOptions.some(opt => opt.key === fKey)) {
                                fKey = validOptions.length > 0 ? validOptions[0].key : '';
                                fName = validOptions.length > 0 ? validOptions[0].name : '';
                              }
                            }
                            setFormData({...formData, roles: newRoles, featureKey: fKey, name: fName});
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="capitalize">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Feature Target</Label>
                    {isCustomKey && (
                      <button type="button" onClick={() => setIsCustomKey(false)} className="text-[10px] text-emerald-600 hover:underline font-bold">
                        Choose from list
                      </button>
                    )}
                  </div>
                  {!isCustomKey ? (
                    <select
                      required
                      value={formData.featureKey}
                      onChange={(e) => handleFeatureKeyChange(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="" disabled>Select a feature system key...</option>
                      {FEATURE_OPTIONS.filter(opt => opt.roles.some(r => formData.roles.includes(r))).map(opt => (
                        <option key={opt.key} value={opt.key}>{opt.name} ({opt.key})</option>
                      ))}
                      <option value="CUSTOM">-- Custom New Feature --</option>
                    </select>
                  ) : (
                    <Input 
                      required 
                      value={formData.featureKey} 
                      onChange={e => setFormData({...formData, featureKey: e.target.value})}
                      placeholder="e.g. hasCustomFeature"
                      className="rounded-xl h-11"
                    />
                  )}
                </div>

                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Display Name</Label>
                    <Input 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. 1 Month AI Review"
                      className="rounded-xl h-11"
                    />
                  </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Cost (₹)</Label>
                    <Input 
                      required 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost} 
                      onChange={e => setFormData({...formData, cost: e.target.value})}
                      placeholder="9.99"
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Validity (Days)</Label>
                    <Input 
                      required 
                      type="number"
                      min="1"
                      value={formData.days} 
                      onChange={e => setFormData({...formData, days: e.target.value})}
                      placeholder="30"
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Usage Count</Label>
                    <Input 
                      required 
                      type="number"
                      min="0"
                      value={formData.usageCount} 
                      onChange={e => setFormData({...formData, usageCount: e.target.value})}
                      placeholder="e.g. 1 (0 = unlimited)"
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description</Label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe what the user gets by buying this standalone feature..."
                    className="w-full h-24 rounded-xl border border-slate-200 p-3 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm mt-2">
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  {saving ? 'Saving...' : formData._id ? 'Save Changes' : 'Create Pay-per Feature'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ManagePayPer;
