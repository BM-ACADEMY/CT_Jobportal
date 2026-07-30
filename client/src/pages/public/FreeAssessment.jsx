import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, ArrowRight, ArrowLeft, Loader2, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_BASE_URL;

const FreeAssessment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState('entry'); // entry, test, lead, results
  const [skill, setSkill] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  
  // Test state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  
  // Lead Capture state
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');

  const startAssessment = async (e) => {
    e.preventDefault();
    if (!skill.trim()) return toast.error('Please enter a skill');
    
    setLoading(true);
    try {
      const res = await axios.get(`${API}/assessments/public`, {
        params: { skill, difficulty }
      });
      setQuestions(res.data.questions);
      setStep('test');
    } catch (err) {
      toast.error('Failed to generate assessment. Try a different skill.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (opt) => {
    setAnswers(prev => ({ ...prev, [currentQIndex]: opt }));
  };

  const nextQuestion = async () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      // Calculate score before moving to lead step
      let calculatedScore = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correct_option) {
          calculatedScore++;
        }
      });
      setScore(calculatedScore);
      
      if (user?.role === 'jobseeker') {
        try {
          await axios.post(`${API}/skill-tests/save`, {
            skill,
            difficulty,
            score: calculatedScore,
            total: questions.length,
            percentage: Math.round((calculatedScore / questions.length) * 100),
            passed: (calculatedScore / questions.length) >= 0.6,
            questions,
            answers
          }); // Removed withCredentials: true as we use Bearer tokens
          navigate('/jobseeker/skill-tests');
        } catch (err) {
          toast.error("Failed to save score, but redirecting.");
          navigate('/jobseeker/skill-tests');
        }
      } else {
        setStep('lead');
      }
    }
  };

  const prevQuestion = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    }
  };

  const showResults = (e) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return toast.error('Please enter your details to view results.');
    setStep('results');
  };

  if (step === 'entry') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center space-y-6 relative">
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Free Skill Assessment</h1>
            <p className="text-sm text-slate-500 mt-2">Test your knowledge with our AI-powered assessment engine and stand out to top recruiters.</p>
          </div>
          
          <form onSubmit={startAssessment} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skill to Test</label>
              <Input 
                value={skill} 
                onChange={e => setSkill(e.target.value)} 
                placeholder="e.g. React Hooks, Python, AWS" 
                className="mt-1.5 h-12 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map(level => (
                  <div 
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`cursor-pointer text-center py-2.5 rounded-lg text-sm font-bold border transition-colors ${difficulty === level ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 mt-4 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Generate Assessment'}
              {!loading && <ArrowRight size={18} />}
            </Button>
            
            {loading && (
              <p className="text-center text-xs text-slate-500 font-semibold animate-pulse mt-3">
                Our AI is actively generating tailored questions for you. This usually takes 5-10 seconds...
              </p>
            )}
          </form>
        </div>
      </div>
    );
  }

  if (step === 'test') {
    const q = questions[currentQIndex];
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 min-h-[80vh]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-black text-slate-900 capitalize">{skill} Assessment</h2>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{difficulty} Level</p>
          </div>
          <div className="text-sm font-bold text-slate-500">
            Question {currentQIndex + 1} of {questions.length}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <pre className="text-lg md:text-xl font-bold text-slate-800 mb-6 whitespace-pre-wrap font-sans leading-relaxed">
            {q.question}
          </pre>
          <div className="space-y-3">
            {Object.entries(q.options).map(([key, val]) => {
              const isSelected = answers[currentQIndex] === key;
              return (
                <div 
                  key={key}
                  onClick={() => handleOptionSelect(key)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full shrink-0 border-2 flex items-center justify-center ${isSelected ? 'border-emerald-500 text-emerald-600' : 'border-slate-300'}`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                    </div>
                    <pre className={`text-sm font-medium pt-0.5 whitespace-pre-wrap font-sans ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>{val}</pre>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 flex justify-between items-center">
            <Button 
              onClick={prevQuestion}
              disabled={currentQIndex === 0}
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-600 font-bold h-11 px-6 disabled:opacity-30"
            >
              Previous
            </Button>
            <Button 
              onClick={nextQuestion}
              disabled={!answers[currentQIndex]}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 gap-2"
            >
              {currentQIndex === questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'lead') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Target size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assessment Complete!</h1>
            <p className="text-sm text-slate-500 mt-2">You have successfully answered all {questions.length} questions. Enter your details below to instantly unlock your score and detailed explanations.</p>
          </div>
          
          <div className="space-y-4 text-left">
            <Button 
              onClick={() => {
                localStorage.setItem('pendingAssessment', JSON.stringify({
                  skill, difficulty, score, total: questions.length, 
                  percentage: Math.round((score / questions.length) * 100),
                  passed: (score / questions.length) >= 0.6,
                  questions, answers
                }));
                navigate(`/register?fromAssessment=true`);
              }}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 mt-4 transition-transform hover:scale-105"
            >
              Create Free Account to Unlock Results <ArrowRight size={18} />
            </Button>
            <p className="text-xs text-center text-slate-400 font-semibold mt-2">
              Takes less than 30 seconds. No credit card required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 60;
    
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {passed ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
          </div>
          
          <div>
            <h1 className="text-3xl font-black text-slate-900">{percentage}% Score</h1>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Hey {leadName}, you scored {score} out of {questions.length} on the {skill} assessment.
            </p>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 font-medium">
            Register now to save your verified skill badge to your profile and let recruiters find you!
          </div>
          
          <div className="space-y-3 pt-2">
            <Button 
              onClick={() => navigate('/register')}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Create Free Account
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setStep('entry');
                setSkill('');
                setAnswers({});
                setScore(0);
                setCurrentQIndex(0);
              }}
              className="w-full h-12 rounded-xl border-slate-200 text-slate-600 font-bold"
            >
              Take Another Test
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FreeAssessment;
