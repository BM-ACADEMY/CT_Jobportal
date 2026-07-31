import React, { useState, useEffect } from 'react';
import { ClipboardList, Play, CheckCircle2, Clock, Star, ChevronRight, Trophy, BarChart2, Lock, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { hasFeature } from '@/components/subscription/FeatureGate';
import PageSOPBanner from '@/components/common/PageSOPBanner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

const API = import.meta.env.VITE_API_BASE_URL;

const ResultDetailsModal = ({ result, onClose }) => {
// ... keep modal logic ...
  if (!result || !result.questions) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 capitalize">{result.skill} Assessment</h2>
            <p className="text-sm font-bold text-slate-500">Score: {result.percentage}% ({result.score}/{result.total})</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 hover:bg-slate-300">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {result.questions.map((q, i) => {
            const userAnswer = result.answers ? result.answers[i] : null;
            const isCorrect = userAnswer === q.correct_option;
            
            return (
              <div key={i} className="space-y-3 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {isCorrect ? <CheckCircle2 size={14} /> : <X size={14} />}
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-relaxed pt-0.5">{i + 1}. {q.question}</p>
                </div>
                
                <div className="pl-9 space-y-2">
                  {Object.entries(q.options).map(([key, val]) => {
                    const isSelected = userAnswer === key;
                    const isActualCorrect = q.correct_option === key;
                    
                    let bg = 'bg-slate-50 border-slate-100 text-slate-600';
                    if (isActualCorrect) bg = 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold';
                    else if (isSelected && !isActualCorrect) bg = 'bg-rose-50 border-rose-200 text-rose-800 font-bold';

                    return (
                      <div key={key} className={`p-3 rounded-xl border text-sm transition-all ${bg}`}>
                        <span className="font-bold mr-2 opacity-50">{key.toUpperCase()}.</span> {val}
                        {isSelected && !isActualCorrect && <span className="ml-2 text-[10px] uppercase font-black text-rose-500">(Your Answer)</span>}
                        {isActualCorrect && <span className="ml-2 text-[10px] uppercase font-black text-emerald-600">(Correct Answer)</span>}
                      </div>
                    );
                  })}
                </div>
                
                {q.explanation && (
                  <div className="ml-9 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Explanation</p>
                    <p className="text-xs font-medium text-slate-700">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SkillTests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeResult, setActiveResult] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(`${API}/skill-tests/my-results`);
        setResults(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const bestScore = results.length > 0 ? Math.max(...results.map(r => r.percentage)) : '--';
  const avgScore = results.length > 0 ? Math.round(results.reduce((a, b) => a + b.percentage, 0) / results.length) : '--';
  const passedTests = results.filter(r => r.passed).length;
  
  const hasPremium = hasFeature(user, 'hasMockInterviews');
  const canTakeTest = hasPremium || results.length < 5;

  return (
    <>
      <PageSOPBanner pageKey="skillTests" />
      
      {activeResult && <ResultDetailsModal result={activeResult} onClose={() => setActiveResult(null)} />}

      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <ClipboardList size={16} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Skill Assessments</h1>
            </div>
            <p className="text-sm text-slate-500">Take an assessment to earn verified badges and stand out to recruiters.</p>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Button 
              onClick={() => {
                if (canTakeTest) navigate('/free-assessment');
                else navigate('/jobseeker/subscription');
              }}
              className={`h-12 px-8 rounded-xl font-bold shadow-lg ${canTakeTest ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white gap-2'}`}
            >
              {!canTakeTest && <Lock size={16} />}
              {canTakeTest ? 'Take Assessment' : 'Upgrade to Take More Tests'}
            </Button>
            {!hasPremium && (
              <span className="text-[10px] font-bold text-slate-400">
                {results.length} / 5 free tests used
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Tests Taken', value: results.length, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Best Score', value: bestScore !== '--' ? `${bestScore}%` : '--', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Avg Score', value: avgScore !== '--' ? `${avgScore}%` : '--', icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
              <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <s.icon size={15} className={s.color} />
              </div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Already scored */}
        {passedTests > 0 && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-xs font-bold text-emerald-800 mb-3 uppercase tracking-widest">Your Badges</p>
            <div className="flex flex-wrap gap-3">
              {results.filter(r => r.passed).map((r) => (
                <div key={r._id} className="flex items-center gap-2 bg-white border border-emerald-100 px-3 py-2 rounded-xl">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-800 capitalize">{r.skill}</span>
                  <span className="text-xs font-bold text-emerald-600">{r.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Results */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Your Assessment Results</p>
          
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <ClipboardList size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No assessments taken</h3>
              <p className="text-sm text-slate-500 max-w-sm mb-6">Take your first skill assessment to prove your expertise to top recruiters.</p>
              <Button onClick={() => navigate('/free-assessment')} className="rounded-xl bg-slate-900 text-white font-bold h-11 px-8">
                Start First Assessment
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {results.map(r => (
                <div
                  key={r._id}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm transition-all group"
                >
                  <div className={`flex-none px-3 py-2 rounded-xl border text-xs font-bold ${r.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                    {r.skill.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 capitalize">{r.skill}</p>
                      <Badge className={`text-[8px] font-bold border-none px-1.5 py-0 ${r.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {r.percentage}% {r.passed ? 'Passed' : 'Try Again'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400">{r.score} out of {r.total} correct</span>
                      {r.createdAt && (
                        <>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveResult(r)}
                    className="h-8 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shrink-0"
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tip */}
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
          <p className="text-xs font-bold text-slate-700 mb-2">How badges work</p>
          <div className="space-y-1.5">
            {[
              'Score ≥ 60% to earn a verified badge on your profile',
              'Badges are displayed to recruiters when they view your profile',
              'Retake any test to improve your score — only the best is shown',
            ].map(t => (
              <div key={t} className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SkillTests;
