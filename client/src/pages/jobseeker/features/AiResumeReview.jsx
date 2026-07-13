import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Send, CheckCircle2, Loader2, FileText, Lock, RefreshCw, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 5;

/* ─── Request Modal ─────────────────────────────────────────────────────────── */
const RequestModal = ({ onClose, onSuccess }) => {
  const [notes, setNotes] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${API}/requests/ai-resume-review`,
        { notes, jobRole },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setDone(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Request AI Review</h3>
            <p className="text-xs text-slate-500 mt-0.5">Our AI will review your profile resume.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={22} className="text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 mb-1">Review Requested!</p>
            <p className="text-xs text-slate-500 mb-5">Your AI Resume Review request has been submitted. Our AI system will analyse your resume shortly.</p>
            <Button onClick={onClose} variant="outline" className="rounded-xl h-9 px-5 text-xs font-bold">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="jobRole" className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                Target Role
              </Label>
              <input
                id="jobRole"
                placeholder="e.g. Senior Software Engineer"
                value={jobRole}
                onChange={e => setJobRole(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none text-sm"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                Focus Areas <span className="font-normal normal-case text-slate-400">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g. I'm targeting senior product manager roles at fintech companies. Please focus on my work experience section."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-violet-400 text-sm resize-none min-h-[100px]"
                rows={4}
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <AlertCircle size={13} className="shrink-0" /> {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm gap-2 shadow-md shadow-violet-500/20"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Submitting…</>
              ) : (
                <><Send size={15} /> Request AI Review</>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ─── Upgrade Modal ──────────────────────────────────────────────────────────── */
const UpgradeModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in slide-in-from-bottom-4">
      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Lock size={24} className="text-amber-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">Limit Reached</h3>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        You have no AI resume reviews left. Please upgrade your subscription or purchase an add-on to get more reviews.
      </p>
      <div className="flex gap-3">
        <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold">
          Close
        </Button>
        <Link to="/jobseeker/subscription" className="flex-1">
          <Button className="w-full rounded-xl h-10 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20">
            Upgrade Now
          </Button>
        </Link>
      </div>
    </div>
  </div>
);

/* ─── Requests Table ─────────────────────────────────────────────────────────── */
const RequestsTable = ({ requests, loading }) => {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = requests.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Set the newest request to open by default if it's the first page
  useEffect(() => {
    if (page === 1 && pageItems.length > 0 && !expandedId) {
      setExpandedId(pageItems[0]._id);
    }
  }, [pageItems, page, expandedId]);

  return (
    <div>
      <div className="divide-y divide-slate-100 min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
            <Loader2 size={24} className="animate-spin mb-3" />
            <p className="text-xs font-medium">Loading history...</p>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
              <FileText size={20} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-700">No AI Reviews yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Request a review to see your AI analysis here.
            </p>
          </div>
        ) : (
          pageItems.map(req => {
            let data = null;
            try { data = JSON.parse(req.adminNotes); } catch(e) {}
            const isExpanded = expandedId === req._id;
            
            return (
              <div key={req._id} className="border-b border-slate-100 last:border-0 bg-white">
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : req._id)}
                  className="w-full text-left p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between group"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                      {req.jobRole || 'General Profile Review'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(req.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {data && data.score && (
                      <span className="px-3 py-1 bg-violet-100 text-violet-700 font-bold text-xs rounded-full border border-violet-200">
                        Score: {data.score}/100
                      </span>
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="p-6 pt-2 bg-slate-50/50">
                    {!data ? (
                      <p className="text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-100">Review request received. Details not available.</p>
                    ) : (
                      <div className="space-y-5">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{data.summary}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
                        <h4 className="text-xs font-bold text-emerald-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 size={14} /> Strengths
                        </h4>
                        <ul className="space-y-2">
                          {(data.strengths || []).map((item, i) => (
                            <li key={i} className="text-sm text-emerald-700 leading-relaxed pl-3 border-l-2 border-emerald-200">{item}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-5">
                        <h4 className="text-xs font-bold text-rose-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle size={14} /> Areas to Improve
                        </h4>
                        <ul className="space-y-2">
                          {(data.weaknesses || []).map((item, i) => (
                            <li key={i} className="text-sm text-rose-700 leading-relaxed pl-3 border-l-2 border-rose-200">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                      <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-widest">Missing Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {(data.missingKeywords || []).map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm">{kw}</span>
                        ))}
                        {(!data.missingKeywords || data.missingKeywords.length === 0) && (
                          <span className="text-sm text-slate-500">None detected.</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-widest">Actionable Steps</h4>
                      <ul className="space-y-3">
                        {(data.actionableSteps || []).map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-600">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs">{i + 1}</span>
                            <span className="mt-0.5 leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="text-slate-900 font-bold">{(safePage - 1) * PAGE_SIZE + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(safePage * PAGE_SIZE, requests.length)}</span> of <span className="text-slate-900 font-bold">{requests.length}</span>
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const AiResumeReview = () => {
  const { user, refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);

  // Dynamic limit calculation
  const getRemainingCount = () => {
    if (!user) return 0;
    const plan = user.subscription;
    
    let planRemaining = 0;
    if (plan && plan.hasAiResumeReview) {
      if (plan.aiResumeReviewCount === 0) return 'Unlimited';
      planRemaining = Math.max(0, plan.aiResumeReviewCount - (user.aiResumeReviewUsed || 0));
    } else if (plan && Array.isArray(plan.features)) {
      const dynamic = plan.features.find(f => f.isActive && (f.name?.toLowerCase() === 'ai resume review' || f.name?.toLowerCase() === 'ai resume'));
      if (dynamic) {
        const limit = parseInt(dynamic.value) || 0;
        if (limit === 0) return 'Unlimited';
        planRemaining = Math.max(0, limit - (user.aiResumeReviewUsed || 0));
      }
    }

    let ppRemaining = 0;
    if (Array.isArray(user.purchasedFeatures)) {
      user.purchasedFeatures.forEach(f => {
        if (f.isActive && f.featureKey === 'hasAiResumeReview' && f.usageLeft > 0 && (!f.expiresAt || new Date(f.expiresAt) > new Date())) {
          ppRemaining += f.usageLeft;
        }
      });
    }

    if (planRemaining === 'Unlimited') return 'Unlimited';
    return planRemaining + ppRemaining;
  };

  const remainingCount = getRemainingCount();

  const fetchRequests = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await axios.get(`${API}/requests/my-ai-resume-reviews`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRequests(res.data || []);
    } catch {
      // silently fail
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleRequestClick = () => {
    if (remainingCount === 0 || remainingCount === '0') {
      setShowUpgradeModal(true);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="space-y-8 pb-12 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-violet-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">AI Resume Review</h1>
            </div>
            <p className="text-sm text-slate-500">Get expert AI feedback on your resume</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 bg-violet-50 text-violet-700 px-3 h-10 rounded-xl text-xs font-bold border border-violet-100">
              {remainingCount} Left
            </div>
            <Button
              onClick={handleRequestClick}
              className="h-10 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm gap-2 shrink-0 shadow-md shadow-violet-500/20"
            >
              <Send size={15} /> Request Review
            </Button>
          </div>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { step: '1', icon: FileText, title: 'Submit Request', desc: 'Tell us what you need reviewed' },
            { step: '2', icon: Sparkles, title: 'AI Analysis', desc: 'Our AI reviews your resume' },
            { step: '3', icon: CheckCircle2, title: 'Get Feedback', desc: 'Detailed report via email' },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
              <div className="w-7 h-7 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold">{step}</div>
              <Icon size={14} className="text-slate-400 mx-auto mb-1.5" />
              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{title}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* Requests Table */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">My Requests</h3>
            <button
              onClick={fetchRequests}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <RequestsTable requests={requests} loading={tableLoading} />
        </div>
      </div>

      {showModal && (
        <RequestModal
          onClose={() => setShowModal(false)}
          onSuccess={async () => {
            if (refreshUser) await refreshUser();
            fetchRequests();
          }}
        />
      )}
      
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </>
  );
};

export default AiResumeReview;
