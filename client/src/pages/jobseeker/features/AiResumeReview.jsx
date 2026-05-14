import React, { useState } from 'react';
import { Sparkles, Upload, Send, CheckCircle2, Clock, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import FeatureGate from '@/components/subscription/FeatureGate';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;

const AiResumeReviewContent = () => {
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${API}/requests/interview-prep`,
        { skills: 'AI Resume Review', careerGoal: notes || 'General resume review requested' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Review Requested!</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Your AI Resume Review request has been submitted. Our AI system will analyse your resume and provide detailed feedback shortly.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 text-left mb-6">
            <Clock size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">Reviews are typically ready within 24 hours. You'll be notified via email once your feedback is ready.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => { setSubmitted(false); setNotes(''); }}
            className="rounded-xl"
          >
            Submit Another Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Resume Review</h1>
            <p className="text-xs text-slate-500 font-medium">Get expert AI feedback on your resume</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed mt-2">
          Our AI analyses your resume for ATS compatibility, content quality, and impact. Receive section-by-section feedback with actionable improvement suggestions.
        </p>
      </div>

      {/* What you get */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">What you'll receive</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            'ATS compatibility score',
            'Section-by-section analysis',
            'Content quality feedback',
            'Improvement suggestions',
            'Keyword optimisation tips',
            'Formatting recommendations',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 size={12} className="text-violet-500 shrink-0" />
              <span className="text-xs text-slate-600 font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { step: '1', icon: FileText, title: 'Submit Request', desc: 'Tell us what you need reviewed' },
          { step: '2', icon: Sparkles, title: 'AI Analysis', desc: 'Our AI reviews your resume' },
          { step: '3', icon: CheckCircle2, title: 'Get Feedback', desc: 'Detailed report via email' },
        ].map(({ step, icon: Icon, title, desc }) => (
          <div key={step} className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
            <div className="w-7 h-7 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">{step}</div>
            <Icon size={14} className="text-slate-400 mx-auto mb-1.5" />
            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{title}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Request Your Review</h3>
        <p className="text-xs text-slate-500 mb-5">Our team will use your profile resume. Optionally, add any specific areas you'd like reviewed.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              Focus Areas <span className="font-normal normal-case text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="e.g. I'm targeting senior product manager roles at fintech companies. Please focus on my work experience section and quantifiable achievements."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="rounded-xl border-slate-200 focus:border-violet-400 text-sm resize-none min-h-[100px]"
              rows={4}
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm gap-2 shadow-md shadow-violet-500/20 mt-2"
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Submitting…</>
            ) : (
              <><Send size={15} /> Request AI Review</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

const AiResumeReview = () => (
  <FeatureGate
    featureKey="hasAiResumeReview"
    description="Get AI-powered feedback on your resume with ATS compatibility scores, section analysis, and actionable improvement suggestions."
    subscriptionPath="/jobseeker/subscription"
  >
    <AiResumeReviewContent />
  </FeatureGate>
);

export default AiResumeReview;
