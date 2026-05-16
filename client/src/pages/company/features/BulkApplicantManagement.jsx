import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Users, Send, FileText, CheckCircle2, Clock, AlertCircle, 
  Loader2, Sparkles, ChevronRight, LayoutGrid
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/AuthContext';

import FeatureGate from '@/components/subscription/FeatureGate';

const BulkApplicantManagement = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    jobId: '',
    count: '',
    adminNotes: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/jobs/company-jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setJobs(res.data.filter(j => j.status !== 'Closed'));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.jobId || !formData.count) {
      return toast.error("Please select a job and enter the required applicant count.");
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/requests/bulk-application`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Request submitted successfully. Admin will review it.");
      setFormData({ jobId: '', count: '', adminNotes: '' });
    } catch (err) {
      toast.error(err.response?.data?.msg || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <FeatureGate
      featureKey="hasBulkApplicantManagement"
      featureName="Bulk Applicant Management"
      description="Request high-volume candidate sourcing for your strategic job roles. Our team will help you find and screen top talent at scale."
      subscriptionPath="/company/subscription"
    >
      <div className="max-w-5xl mx-auto space-y-8 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bulk Applicant <span className="text-emerald-600">Request</span></h1>
          <p className="text-sm text-slate-500 font-medium">Request high-volume candidate sourcing for your strategic job roles.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <Card className="lg:col-span-2 rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                  <Send className="w-5 h-5" />
                </div>
                Submission Interface
              </CardTitle>
              <CardDescription>Fill out the details to initiate a bulk sourcing request.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Job Role</Label>
                  <select 
                    value={formData.jobId}
                    onChange={(e) => setFormData({...formData, jobId: e.target.value})}
                    className="w-full h-11 rounded-xl bg-slate-50 border border-slate-100 px-4 focus:outline-none focus:border-emerald-300 transition-all font-medium text-sm"
                  >
                    <option value="">Select an active job</option>
                    {jobs.map(job => (
                      <option key={job._id} value={job._id}>{job.title} — {job.location}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Requested Applicant Count</Label>
                  <Input 
                    type="number"
                    placeholder="e.g. 50"
                    value={formData.count}
                    onChange={(e) => setFormData({...formData, count: e.target.value})}
                    className="h-11 rounded-xl bg-slate-50 border-slate-100 px-4 focus:border-emerald-300 transition-all font-medium text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Additional Strategic Notes</Label>
                  <textarea 
                    className="w-full min-h-[120px] p-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-sm font-medium transition-all"
                    placeholder="Mention specific requirements or urgency..."
                    value={formData.adminNotes}
                    onChange={(e) => setFormData({...formData, adminNotes: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Dispatch Request
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <Card className="rounded-[24px] border-emerald-100 bg-emerald-50/50 shadow-none overflow-hidden">
              <CardContent className="p-8 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">How it works</h3>
                <ul className="space-y-3">
                  {[
                    "Select a job from your active listings.",
                    "Specify the number of candidates needed.",
                    "Admin reviews and approves your request.",
                    "Our sourcing team delivers high-quality matches."
                  ].map((text, i) => (
                    <li key={i} className="flex gap-3 text-xs text-slate-600 font-medium leading-relaxed">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">{i+1}</span>
                      {text}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-slate-200 bg-white shadow-sm overflow-hidden">
              <CardContent className="p-8 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Service Level</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Most bulk requests are reviewed within 24-48 business hours. You will be notified via email once a recruiter is assigned.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};

export default BulkApplicantManagement;
