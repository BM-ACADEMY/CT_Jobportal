import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronRight, ChevronLeft, Send, AlertCircle,
  CheckCircle2, AlertTriangle, Info, Upload, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API = import.meta.env.VITE_API_BASE_URL;

const ROLE_PLANS = {
  jobseeker: ['Plus', 'Premium'],
  recruiter: ['Pro', 'Elite'],
  company: ['Starter', 'Business', 'Enterprise'],
  college: ['Lite', 'Pro', 'Elite'],
};

const CATEGORIES = [
  { value: 'subscription_gating', label: 'Subscription & Plan Gating' },
  { value: 'payment_checkout', label: 'Payment Processing & Checkout' },
  { value: 'refunds_invoicing', label: 'Refunds & Invoicing' },
  { value: 'platform_errors', label: 'Core Features & Platform Errors' },
  { value: 'others', label: 'Others (Custom Input)' },
];

const SEVERITIES = [
  { value: 'critical', label: 'Critical (P1)', desc: 'Revenue stopping, payment failed, or site completely broken', color: 'red' },
  { value: 'major', label: 'Major (P2)', desc: 'Core features like ATS or AI matching experiencing errors', color: 'amber' },
  { value: 'minor', label: 'Minor (P3)', desc: 'Text typos, cosmetic UI issues, or missing branding assets', color: 'blue' },
];

const STEP_LABELS = ['Context', 'Diagnostics', 'Submit'];

const RaiseTicket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [logFile, setLogFile] = useState(null);

  const [form, setForm] = useState({
    userRole: user?.role || 'jobseeker',
    accountIdentity: user?.email || '',
    category: '',
    diagnostics: {},
    severity: '',
    diagnosticsConsent: false,
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setDiag = (field, value) => setForm(f => ({ ...f, diagnostics: { ...f.diagnostics, [field]: value } }));

  const canProceedStep0 = form.userRole && form.accountIdentity && form.category;
  const canProceedStep1 = true; // diagnostics are optional extras
  const canSubmit = form.severity && form.diagnosticsConsent;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('userRole', form.userRole);
      fd.append('accountIdentity', form.accountIdentity);
      fd.append('category', form.category);
      fd.append('diagnostics', JSON.stringify(form.diagnostics));
      fd.append('severity', form.severity);
      fd.append('diagnosticsConsent', form.diagnosticsConsent);
      if (logFile) fd.append('errorLogFile', logFile);

      await axios.post(`${API}/tickets`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Ticket raised successfully! We will respond within 24 hours.');
      navigate('/tickets/my');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to raise ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Raise a Support Ticket</h1>
        <p className="text-sm text-slate-500 mt-1">Our team will review your request and respond within 24 hours.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {STEP_LABELS.map((label, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-emerald-600 text-white' :
                i === step ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${i === step ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-2 ${i < step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0 – Context */}
      {step === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <h2 className="font-bold text-slate-800">Step 1: Establish Context</h2>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Role</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['jobseeker', 'recruiter', 'company', 'college'].map(role => (
                <button
                  key={role}
                  onClick={() => set('userRole', role)}
                  className={`p-3 rounded-xl border-2 text-xs font-bold capitalize transition-all ${
                    form.userRole === role
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {role === 'jobseeker' ? 'Job Seeker' : role === 'company' ? 'Organization' : role === 'college' ? 'College / TPO' : 'Recruiter'}
                </button>
              ))}
            </div>
          </div>

          {/* Account Identity */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">User ID / Registered Email</Label>
            <Input
              value={form.accountIdentity}
              onChange={e => set('accountIdentity', e.target.value)}
              placeholder="e.g. JS26-00123 or you@example.com"
              className="rounded-xl"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Issue Category</Label>
            <div className="space-y-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => set('category', cat.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.category === cat.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(1)}
              disabled={!canProceedStep0}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6"
            >
              Continue <ChevronRight size={15} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 1 – Diagnostics */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-100 rounded-lg">
              {CATEGORIES.find(c => c.value === form.category)?.label}
            </span>
          </div>
          <h2 className="font-bold text-slate-800">Step 2: Provide Diagnostics</h2>

          {/* Category A – Subscription */}
          {form.category === 'subscription_gating' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Impacted Plan</Label>
                <select
                  value={form.diagnostics.impactedPlan || ''}
                  onChange={e => setDiag('impactedPlan', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Select plan…</option>
                  {(ROLE_PLANS[form.userRole] || []).map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gated Feature Encountered</Label>
                <select
                  value={form.diagnostics.gatedFeature || ''}
                  onChange={e => setDiag('gatedFeature', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Select feature…</option>
                  {['AI Resume Review', 'Candidate DB Export', 'Branded Careers Page', 'Video Interview Integration', 'Auto-Generated Reports'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Error Type</Label>
                <div className="flex gap-3">
                  {['Plan Limit Reached Prematurely', 'Feature Blocked Incorrectly'].map(opt => (
                    <button key={opt} onClick={() => setDiag('errorType', opt)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${form.diagnostics.errorType === opt ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category B – Payment */}
          {form.category === 'payment_checkout' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment Gateway</Label>
                <button onClick={() => setDiag('paymentGateway', 'Razorpay')}
                  className={`px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.diagnostics.paymentGateway === 'Razorpay' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
                  Razorpay
                </button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment Mode</Label>
                <select
                  value={form.diagnostics.paymentMode || ''}
                  onChange={e => setDiag('paymentMode', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Select mode…</option>
                  {['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Transaction State</Label>
                <div className="flex flex-col gap-2">
                  {['Failed at Gateway', 'Deducted but Order Not Created', 'Pending / Timeout'].map(s => (
                    <button key={s} onClick={() => setDiag('transactionState', s)}
                      className={`text-left py-2.5 px-4 rounded-xl border-2 text-xs font-semibold transition-all ${form.diagnostics.transactionState === s ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category C – Refunds */}
          {form.category === 'refunds_invoicing' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Transaction ID / Payment Reference</Label>
                <Input value={form.diagnostics.transactionId || ''} onChange={e => setDiag('transactionId', e.target.value)} placeholder="e.g. pay_PkHFxyz123" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Billing Invoice Number</Label>
                <Input value={form.diagnostics.invoiceNumber || ''} onChange={e => setDiag('invoiceNumber', e.target.value)} placeholder="e.g. INV/2026/A1B2C3" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Requested Action</Label>
                <select value={form.diagnostics.requestedAction || ''} onChange={e => setDiag('requestedAction', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                  <option value="">Select action…</option>
                  {['Full Refund Request', 'Missing PDF Invoice', 'Invoice Correction', 'Duplicate Charge Dispute'].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Category D – Platform Errors */}
          {form.category === 'platform_errors' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Impacted Sub-System</Label>
                <select value={form.diagnostics.impactedSubsystem || ''} onChange={e => setDiag('impactedSubsystem', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                  <option value="">Select sub-system…</option>
                  {['ATS Pipeline Dashboard', 'AI Candidate Matching', 'Video Interview Sync', 'Campus Drive QR Registration', 'Job Search & Filters', 'Resume Builder', 'Messaging System'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Environment</Label>
                <button onClick={() => setDiag('environmentContext', 'Production')}
                  className="px-4 py-2 rounded-lg border-2 text-xs font-bold border-emerald-500 bg-emerald-50 text-emerald-700">
                  Production (app.)
                </button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Attach Console / Error Log (optional)</Label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${logFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  {logFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-sm font-medium text-emerald-700">{logFile.name}</span>
                      <button onClick={() => setLogFile(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload size={20} className="mx-auto mb-2 text-slate-400" />
                      <p className="text-sm text-slate-500">Drop .txt, .log, or .json file here or <span className="text-emerald-600 font-semibold">browse</span></p>
                      <p className="text-xs text-slate-400 mt-1">Max 5 MB</p>
                      <input type="file" accept=".txt,.log,.json" className="hidden" onChange={e => setLogFile(e.target.files[0])} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Category E – Others */}
          {form.category === 'others' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Area of Concern</Label>
                <Input value={form.diagnostics.areaOfConcern || ''} onChange={e => setDiag('areaOfConcern', e.target.value)} placeholder="e.g. Feature Request, Data Compliance Query" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detailed Description</Label>
                <textarea
                  value={form.diagnostics.detailedDescription || ''}
                  onChange={e => setDiag('detailedDescription', e.target.value)}
                  rows={5}
                  placeholder="Please provide a step-by-step description of what you were doing when the issue occurred, including any visible error codes or unusual platform behaviors."
                  className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Action Impacted</Label>
                <select value={form.diagnostics.systemActionImpacted || ''} onChange={e => setDiag('systemActionImpacted', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                  <option value="">Select impact level…</option>
                  {['Blocks Workflow Entirely', 'Annoying but Manageable Workaround Available', 'General Question'].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)} className="rounded-xl border-slate-200">
              <ChevronLeft size={15} className="mr-1" /> Back
            </Button>
            <Button onClick={() => setStep(2)} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6">
              Continue <ChevronRight size={15} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 – Submit */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <h2 className="font-bold text-slate-800">Step 3: Finalize & Submit</h2>

          {/* Severity */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Impact Severity</Label>
            <div className="space-y-3">
              {SEVERITIES.map(sev => {
                const colorMap = { red: 'border-red-400 bg-red-50 text-red-700', amber: 'border-amber-400 bg-amber-50 text-amber-700', blue: 'border-blue-400 bg-blue-50 text-blue-700' };
                const defaultCls = 'border-slate-200 text-slate-600 hover:border-slate-300';
                const active = form.severity === sev.value;
                return (
                  <button key={sev.value} onClick={() => set('severity', sev.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${active ? colorMap[sev.color] : defaultCls}`}>
                    <div className="flex items-center gap-3">
                      {sev.color === 'red' && <span className="text-lg">🔴</span>}
                      {sev.color === 'amber' && <span className="text-lg">🟡</span>}
                      {sev.color === 'blue' && <span className="text-lg">🔵</span>}
                      <div>
                        <p className="text-sm font-bold">{sev.label}</p>
                        <p className="text-xs opacity-75 mt-0.5">{sev.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-xs">
            <p className="font-bold text-slate-700 mb-2">Ticket Summary</p>
            <p><span className="text-slate-400">Role:</span> <span className="font-semibold text-slate-700 capitalize">{form.userRole}</span></p>
            <p><span className="text-slate-400">Category:</span> <span className="font-semibold text-slate-700">{CATEGORIES.find(c => c.value === form.category)?.label}</span></p>
            <p><span className="text-slate-400">Account:</span> <span className="font-semibold text-slate-700">{form.accountIdentity}</span></p>
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.diagnosticsConsent}
              onChange={e => set('diagnosticsConsent', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-emerald-600"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              I authorize support personnel to securely review the metadata payload associated with my user ID (<code className="font-mono bg-slate-100 px-1 rounded">users.id</code>) for resolution purposes.
            </span>
          </label>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl border-slate-200">
              <ChevronLeft size={15} className="mr-1" /> Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-bold"
            >
              {submitting ? 'Submitting…' : (<><Send size={14} className="mr-2" /> Submit Ticket</>)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RaiseTicket;
