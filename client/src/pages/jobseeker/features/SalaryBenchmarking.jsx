import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TrendingUp, Send, CheckCircle2, Clock, Loader2, History as HistoryIcon, ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import PageSOPBanner from '@/components/common/PageSOPBanner';

const API = import.meta.env.VITE_API_BASE_URL;

const SalaryBenchmarkingContent = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ 
    jobRole: location.state?.jobRole || '', 
    companyName: location.state?.companyName || '' 
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [benchmarkData, setBenchmarkData] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 5;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API}/requests/salary-benchmark`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setHistory(res.data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [submitted]);

  const getRemainingCount = () => {
    let limit = 0;
    let used = user?.salaryBenchmarkingUsed || 0;
    let hasPlanFeature = false;
    
    const plan = user?.subscription;
    if (plan && plan.hasSalaryBenchmarking) {
      hasPlanFeature = true;
      limit = 0;
    } else if (plan && Array.isArray(plan.features)) {
      const dynamicFeature = plan.features.find(f => f.isActive && (f.name?.toLowerCase() === 'salary benchmarking' || f.name?.toLowerCase() === 'salary benchmark'));
      if (dynamicFeature) {
        hasPlanFeature = true;
        limit = parseInt(dynamicFeature.value) || 0;
      }
    }
    
    let planRemaining = 0;
    if (hasPlanFeature) {
      planRemaining = limit > 0 ? Math.max(0, limit - used) : 'Unlimited';
    }

    let ppRemaining = 0;
    if (Array.isArray(user?.purchasedFeatures)) {
      user.purchasedFeatures.forEach(f => {
        if (f.isActive && f.featureKey === 'hasSalaryBenchmarking' && f.usageLeft > 0 && (!f.expiresAt || new Date(f.expiresAt) > new Date())) {
          ppRemaining += f.usageLeft;
        }
      });
    }

    if (planRemaining === 'Unlimited') return 'Unlimited';
    return planRemaining + ppRemaining;
  };

  const remainingCount = getRemainingCount();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jobRole.trim() || !form.companyName.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/requests/salary-benchmark`,
        { jobRole: form.jobRole, companyName: form.companyName },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setBenchmarkData(res.data.benchmarkData);
      setSubmitted(true);
      if (refreshUser) await refreshUser();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted && benchmarkData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
        <div className="w-full max-w-2xl text-center relative">
          <Button 
            variant="ghost" 
            onClick={() => { setSubmitted(false); setForm({ jobRole: '', companyName: '' }); setBenchmarkData(null); }} 
            className="absolute left-0 top-0 text-slate-500 hover:text-slate-900 gap-1.5 hidden md:flex"
          >
            <ArrowLeft size={16} /> Back
          </Button>

          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Salary Report is Ready</h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            We've also sent a copy of this report to your email.
          </p>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-left mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">
              {benchmarkData.jobRole} <span className="text-slate-400 font-medium">at</span> {benchmarkData.companyName}
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Average Salary</p>
                <p className="text-xl font-bold text-emerald-900">{benchmarkData.avgSalary}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Salary Range</p>
                <p className="text-xl font-bold text-slate-900">{benchmarkData.minSalary} - {benchmarkData.maxSalary}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Market Demand</p>
                <p className="text-xl font-bold text-slate-900">{benchmarkData.marketDemand}</p>
              </div>
            </div>

            <h4 className="text-sm font-bold text-slate-900 mb-4">Experience Based Breakdown</h4>
            <div className="space-y-3 mb-8">
              {benchmarkData.experienceBased.map((exp, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-medium text-slate-700">{exp.exp}</span>
                  <span className="font-bold text-slate-900">{exp.avg}</span>
                </div>
              ))}
            </div>

            {benchmarkData.keyInsights && benchmarkData.keyInsights.length > 0 && (
              <>
                <h4 className="text-sm font-bold text-slate-900 mb-4">Key Market Insights</h4>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8">
                  <ul className="space-y-3">
                    {benchmarkData.keyInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-sm text-slate-700 leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {benchmarkData.skillsThatBoostSalary && benchmarkData.skillsThatBoostSalary.length > 0 && (
              <>
                <h4 className="text-sm font-bold text-slate-900 mb-4">Skills That Boost Salary</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {benchmarkData.skillsThatBoostSalary.map((skill, idx) => (
                    <div key={idx} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold">
                      {skill}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => { setSubmitted(false); setForm({ jobRole: '', companyName: '' }); setBenchmarkData(null); }}
            className="rounded-xl px-8 h-12 font-bold"
          >
            Check Another Role
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageSOPBanner pageKey="salaryBenchmarking" />
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
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-900">Request Your Report</h3>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold border border-emerald-100">
            <TrendingUp size={12} />
            {remainingCount} Reports Left
          </div>
        </div>
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

      {/* History Section */}
      {!submitted && (
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4 px-1">
            <HistoryIcon size={16} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Past Reports</h3>
          </div>
          
          {loadingHistory ? (
            <div className="flex items-center justify-center p-8 bg-slate-50 border border-slate-100 rounded-2xl">
              <Loader2 size={24} className="text-slate-300 animate-spin" />
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {history.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage).map((req) => (
                  <div 
                    key={req._id} 
                    className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-emerald-200 hover:shadow-sm cursor-pointer transition-all group"
                    onClick={() => {
                      if (req.adminNotes) {
                        try {
                          const parsedData = JSON.parse(req.adminNotes);
                          setBenchmarkData(parsedData);
                          setSubmitted(true);
                        } catch(e) {
                          console.error('Could not parse history data');
                        }
                      }
                    }}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {req.jobRole} <span className="text-slate-400 font-medium text-xs ml-1">at {req.companyName}</span>
                      </h4>
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-slate-500">
                        <Clock size={12} />
                        {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                ))}
              </div>

              {history.length > historyPerPage && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className="text-xs h-8 gap-1 rounded-lg"
                  >
                    <ChevronLeft size={14} /> Previous
                  </Button>
                  <span className="text-xs font-medium text-slate-500">
                    Page {historyPage} of {Math.ceil(history.length / historyPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage(p => Math.min(Math.ceil(history.length / historyPerPage), p + 1))}
                    disabled={historyPage === Math.ceil(history.length / historyPerPage)}
                    className="text-xs h-8 gap-1 rounded-lg"
                  >
                    Next <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 border-dashed rounded-2xl p-8 text-center">
              <p className="text-sm font-medium text-slate-500">No past reports generated yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SalaryBenchmarking = () => (
  <FeatureGate
    featureKey="hasSalaryBenchmarking"
    description="Get personalised salary reports comparing your role against real market data and company-specific benchmarks."
    subscriptionPath="/candidate/subscription"
  >
    <SalaryBenchmarkingContent />
  </FeatureGate>
);

export default SalaryBenchmarking;
