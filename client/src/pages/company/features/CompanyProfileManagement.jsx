import React, { useState } from 'react';
import axios from 'axios';
import { 
  Building2, Sparkles, Layout, Globe, Users, Target, 
  Send, Loader2, Lock, ArrowRight, CheckCircle2, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const CompanyProfileManagement = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    websiteDetails: '',
    websiteGoal: '',
    targetAudience: '',
    adminNotes: ''
  });

  const profileType = user?.subscription?.companyProfileType || 'No';
  const isEnabled = profileType !== 'No';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/requests/website-request`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Request submitted successfully!');
      setFormData({ websiteDetails: '', websiteGoal: '', targetAudience: '', adminNotes: '' });
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
          <Lock size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Unlock Your Company Profile</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Stand out from the crowd with a branded company profile, multimedia gallery, and custom website features.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mb-10 text-left">
          {[
            { icon: Layout, title: 'Branded Profile', desc: 'Custom layout with your brand colors and logo.' },
            { icon: Globe, title: 'Custom Website', desc: 'A dedicated public URL for your company portal.' },
            { icon: Users, title: 'Talent Brand', desc: 'Showcase your culture with images and videos.' },
            { icon: Sparkles, title: 'Premium Badge', desc: 'Get a priority verification badge in search.' }
          ].map((feature, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white border border-slate-100 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                <feature.icon size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{feature.title}</p>
                <p className="text-xs text-slate-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link to="/company/subscription">
          <Button className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-600/20">
            <Sparkles size={18} />
            Upgrade to Use This Feature
            <ArrowRight size={18} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company Profile Management</h1>
          </div>
          <p className="text-slate-500 text-sm">
            You are currently on the <span className="font-bold text-emerald-600 uppercase">{profileType}</span> profile tier.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="px-5 py-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Tier</p>
              <p className="text-xs font-bold text-slate-800">{profileType}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send size={18} className="text-emerald-600" />
                Request Custom Website Creation
              </CardTitle>
              <CardDescription>
                Submit your requirements and our team will build a professional landing page for your brand.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <Layout size={14} className="text-slate-400" />
                      What kind of website do you need?
                    </Label>
                    <Input 
                      placeholder="e.g. A minimal hiring portal with video background"
                      value={formData.websiteDetails}
                      onChange={e => setFormData(p => ({...p, websiteDetails: e.target.value}))}
                      className="rounded-xl border-slate-200 h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <Target size={14} className="text-slate-400" />
                      What is the primary goal?
                    </Label>
                    <Input 
                      placeholder="e.g. Attract top-tier engineering talent"
                      value={formData.websiteGoal}
                      onChange={e => setFormData(p => ({...p, websiteGoal: e.target.value}))}
                      className="rounded-xl border-slate-200 h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      Who is your target audience?
                    </Label>
                    <Input 
                      placeholder="e.g. Experienced developers and fresh graduates"
                      value={formData.targetAudience}
                      onChange={e => setFormData(p => ({...p, targetAudience: e.target.value}))}
                      className="rounded-xl border-slate-200 h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <MessageSquare size={14} className="text-slate-400" />
                      Additional Details / Preferences
                    </Label>
                    <Textarea 
                      placeholder="Share any specific features, color schemes, or references..."
                      value={formData.adminNotes}
                      onChange={e => setFormData(p => ({...p, adminNotes: e.target.value}))}
                      className="rounded-2xl border-slate-200 min-h-[120px] resize-none"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-600/10 transition-all active:scale-[0.98]"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Submit Request to Admin
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-6">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-400" />
              What happens next?
            </h3>
            
            <div className="space-y-4">
              {[
                { step: '01', title: 'Review', desc: 'Admin reviews your requirements and goals.' },
                { step: '02', title: 'Consultation', desc: 'Our design team contacts you for assets and branding guide.' },
                { step: '03', title: 'Development', desc: 'We build and deploy your custom company profile.' },
                { step: '04', title: 'Go Live', desc: 'Your new branded portal is visible to all candidates.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="text-emerald-400 font-black text-lg opacity-40 leading-none">{item.step}</div>
                  <div>
                    <p className="text-sm font-bold mb-0.5">{item.title}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Self-Service Branding</p>
            <p className="text-xs text-slate-500 mb-4">
              Want to update your logo, cover images, or company norms immediately?
            </p>
            <Link to="/company/settings">
              <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-bold gap-2 border-slate-200">
                Go to Branding Settings
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileManagement;
