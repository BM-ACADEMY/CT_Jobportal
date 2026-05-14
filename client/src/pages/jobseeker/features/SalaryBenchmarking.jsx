import React, { useState } from 'react';
import { TrendingUp, Send, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FeatureGate from '@/components/subscription/FeatureGate';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;

const SalaryBenchmarkingContent = () => {
  const [form, setForm] = useState({ jobRole: '', companyName: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jobRole.trim() || !form.companyName.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${API}/requests/salary-benchmark`,
        { jobRole: form.jobRole, companyName: form.companyName },
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
          <h2 className="text-xl font-bold text-slate-900 mb-2">Request Submitted!</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Your salary benchmarking request has been received. Our team will analyse the data for <strong>{form.jobRole}</strong> at <strong>{form.companyName}</strong> and get back to you shortly.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 text-left mb-6">
            <Clock size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">Reports are typically ready within 24–48 hours. You'll be notified via email.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => { setSubmitted(false); setForm({ jobRole: '', companyName: '' }); }}
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
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Salary Benchmarking</h1>
            <p className="text-xs text-slate-500 font-medium">Compare your salary against market data</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed mt-2">
          Submit your job role and target company to receive a personalised salary benchmarking report. We'll compare compensation data across experience levels and industries.
        </p>
      </div>

      {/* What you get */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">What's included in your report</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Market salary range for your role',
            'Company-specific compensation data',
            'Experience-adjusted benchmarks',
            'Industry & location insights',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
              <span className="text-xs text-slate-600 font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-5">Request Your Report</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="jobRole" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Job Role</Label>
            <Input
              id="jobRole"
              placeholder="e.g. Senior Software Engineer"
              value={form.jobRole}
              onChange={e => setForm(f => ({ ...f, jobRole: e.target.value }))}
              className="rounded-xl border-slate-200 focus:border-emerald-400 text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyName" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Target Company</Label>
            <Input
              id="companyName"
              placeholder="e.g. Google, Infosys, TCS"
              value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              className="rounded-xl border-slate-200 focus:border-emerald-400 text-sm"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm gap-2 shadow-md shadow-emerald-500/20 mt-2"
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Submitting…</>
            ) : (
              <><Send size={15} /> Get Salary Report</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

const SalaryBenchmarking = () => (
  <FeatureGate
    featureKey="hasSalaryBenchmarking"
    description="Get personalised salary reports comparing your role against real market data and company-specific benchmarks."
    subscriptionPath="/jobseeker/subscription"
  >
    <SalaryBenchmarkingContent />
  </FeatureGate>
);

export default SalaryBenchmarking;
