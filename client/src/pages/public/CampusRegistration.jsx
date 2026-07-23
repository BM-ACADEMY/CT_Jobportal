import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { GraduationCap, ArrowRight, Loader2, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API = import.meta.env.VITE_API_BASE_URL;

const CampusRegistration = () => {
  const { driveCode } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState('loading'); // loading, register, assessment, results
  const [drive, setDrive] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', department: '', rollNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState(null);

  // Assessment state
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [assessLoading, setAssessLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchDrive();
  }, [driveCode]);

  const fetchDrive = async () => {
    try {
      const res = await axios.get(`${API}/college/public/drive/${driveCode}`);
      setDrive(res.data);
      setStep('register');
    } catch {
      setStep('error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email are required');
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/college/public/drive/${driveCode}/register`, { ...form, source: 'qr' });
      setStudentId(res.data.studentId);
      toast.success(res.data.msg);
      // Load assessment
      loadAssessment();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Registration failed');
    } finally { setSubmitting(false); }
  };

  const loadAssessment = async () => {
    setAssessLoading(true);
    try {
      // Use a general skill based on drive info or default
      const skill = drive?.departments?.[0]?.toLowerCase() || 'aptitude';
      const res = await axios.get(`${API}/assessments/public`, { params: { skill, difficulty: 'medium' } });
      setQuestions(res.data.questions || []);
      setStep('assessment');
    } catch {
      // If assessment fails, still show success
      setStep('results');
      setResult({ score: 0, total: 0, passed: false, noAssessment: true });
    } finally { setAssessLoading(false); }
  };

  const selectOption = (opt) => setAnswers(prev => ({ ...prev, [currentQ]: opt }));

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      submitAssessment();
    }
  };

  const submitAssessment = async () => {
    let score = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct_option) score++; });

    try {
      const res = await axios.post(`${API}/college/public/submit-assessment`, {
        studentId,
        skill: drive?.departments?.[0] || 'aptitude',
        score,
        total: questions.length,
        category: 'general'
      });
      setResult({ score, total: questions.length, passed: res.data.passed, certificateCode: res.data.certificateCode });
    } catch {
      setResult({ score, total: questions.length, passed: score >= questions.length * 0.6 });
    }
    setStep('results');
  };

  if (step === 'loading' || assessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-black text-slate-900">Drive Not Found</h1>
          <p className="text-sm text-slate-500 mt-2">This campus drive link is invalid or has been closed.</p>
          <Button onClick={() => navigate('/')} className="mt-6 rounded-xl bg-slate-900 text-white">Go Home</Button>
        </div>
      </div>
    );
  }

  if (step === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
          <div className="text-center">
            {drive?.college?.logo ? (
              <img src={drive.college.logo.startsWith('http') ? drive.college.logo : `${import.meta.env.VITE_API_DOMAIN}${drive.college.logo}`} alt="" className="w-16 h-16 rounded-2xl mx-auto object-cover border-2 border-white shadow mb-3" />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-lg">
                <GraduationCap size={32} />
              </div>
            )}
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{drive?.college?.name}</h1>
            <p className="text-sm font-bold text-emerald-600 mt-1">{drive?.title}</p>
            <p className="text-xs text-slate-500 mt-1">Batch {drive?.batchYear} • Quick Registration</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name *</label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" className="mt-1 h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email *</label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@email.com" className="mt-1 h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">WhatsApp Number</label>
              <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="9876543210" className="mt-1 h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</label>
                <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="mt-1 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white">
                  <option value="">Select</option>
                  {(drive?.college?.departments || drive?.departments || []).map(d => (
                    <option key={typeof d === 'string' ? d : d.name} value={typeof d === 'string' ? d : d.code}>{typeof d === 'string' ? d : d.name}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Roll Number</label>
                <Input value={form.rollNumber} onChange={e => setForm(p => ({ ...p, rollNumber: e.target.value }))} placeholder="CS001" className="mt-1 h-11 rounded-xl" />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-sm">
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <>Register & Take Assessment <ArrowRight size={16} /></>}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'assessment' && questions.length > 0) {
    const q = questions[currentQ];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">Skill Assessment</h2>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{drive?.college?.name}</p>
            </div>
            <div className="text-sm font-bold text-slate-500">Q {currentQ + 1}/{questions.length}</div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <pre className="text-base font-bold text-slate-800 mb-6 whitespace-pre-wrap font-sans leading-relaxed">{q.question}</pre>
            <div className="space-y-3">
              {Object.entries(q.options).map(([key, val]) => {
                const selected = answers[currentQ] === key;
                return (
                  <div key={key} onClick={() => selectOption(key)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full shrink-0 border-2 flex items-center justify-center ${selected ? 'border-emerald-500' : 'border-slate-300'}`}>
                        {selected && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                      </div>
                      <span className={`text-sm font-medium ${selected ? 'text-emerald-900' : 'text-slate-700'}`}>{val}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={nextQuestion} disabled={answers[currentQ] === undefined} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 gap-2">
                {currentQ === questions.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    const percentage = result?.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${result?.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {result?.passed ? <CheckCircle2 size={40} /> : <Sparkles size={40} />}
          </div>

          <div>
            <h1 className="text-3xl font-black text-slate-900">{result?.noAssessment ? 'Registered!' : `${percentage}%`}</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              {result?.noAssessment
                ? 'You have been successfully registered for this campus drive.'
                : `You scored ${result?.score} out of ${result?.total}`
              }
            </p>
          </div>

          {result?.certificateCode && (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Certificate Code</p>
              <p className="text-lg font-mono font-black text-emerald-800">{result.certificateCode}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button onClick={() => navigate('/register')} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Create Full Account
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full h-12 rounded-xl border-slate-200 text-slate-600 font-bold">
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CampusRegistration;
