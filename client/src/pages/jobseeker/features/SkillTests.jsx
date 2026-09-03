import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, Star, BarChart2, Lock, X } from 'lucide-react';
import { Button, Card, Typography, Tag, Spin } from 'antd';
import { hasFeature } from '@/components/subscription/FeatureGate';
import PageSOPBanner from '@/components/common/PageSOPBanner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_BASE_URL;

const ResultDetailsModal = ({ result, onClose }) => {
  if (!result || !result.questions) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 capitalize m-0">{result.skill} Assessment</h2>
            <p className="text-sm font-medium text-slate-500 m-0 mt-1">Score: {result.percentage}% ({result.score}/{result.total})</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 hover:bg-slate-300 border-none cursor-pointer">
            <X size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {result.questions.map((q, i) => {
            const userAnswer = result.answers ? result.answers[i] : null;
            const isCorrect = userAnswer === q.correct_option;
            
            return (
              <div key={i} className="space-y-3 bg-white border border-slate-100 p-5 rounded-xl shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white mt-0.5 ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {isCorrect ? <CheckCircle2 size={12} /> : <X size={12} />}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed m-0">{i + 1}. {q.question}</p>
                </div>
                
                <div className="pl-8 space-y-2">
                  {Object.entries(q.options).map(([key, val]) => {
                    const isSelected = userAnswer === key;
                    const isActualCorrect = q.correct_option === key;
                    
                    let bg = 'bg-slate-50 border-slate-100 text-slate-600';
                    if (isActualCorrect) bg = 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium';
                    else if (isSelected && !isActualCorrect) bg = 'bg-rose-50 border-rose-200 text-rose-800 font-medium';

                    return (
                      <div key={key} className={`p-3 rounded-xl border text-sm transition-all ${bg}`}>
                        <span className="font-semibold mr-2 opacity-50">{key.toUpperCase()}.</span> {val}
                        {isSelected && !isActualCorrect && <span className="ml-2 text-[10px] uppercase font-bold text-rose-500">(Your Answer)</span>}
                        {isActualCorrect && <span className="ml-2 text-[10px] uppercase font-bold text-emerald-600">(Correct Answer)</span>}
                      </div>
                    );
                  })}
                </div>
                
                {q.explanation && (
                  <div className="ml-8 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0 mb-1">Explanation</p>
                    <p className="text-xs font-medium text-slate-700 m-0">{q.explanation}</p>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 flex items-center justify-center rounded-md border border-indigo-100">
              <ClipboardList size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl m-0 font-semibold tracking-tight text-slate-800">Skill Assessments</h1>
              <p className="text-slate-600 font-medium m-0 text-sm mt-0.5">Take an assessment to earn verified badges and stand out to recruiters.</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Button 
              type="primary"
              onClick={() => {
                if (canTakeTest) navigate('/free-assessment');
                else navigate('/candidate/subscription');
              }}
              icon={!canTakeTest ? <Lock size={14} /> : null}
              className={`h-10 px-6 rounded-md font-medium tracking-wide shadow-sm border-none ${canTakeTest ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
              {canTakeTest ? 'Take Assessment' : 'Upgrade to Take More Tests'}
            </Button>
            {!hasPremium && (
              <span className="text-[10px] font-bold text-slate-400 mt-1">
                {results.length} / 5 free tests used
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Tests Taken', value: results.length, icon: ClipboardList, color: 'text-indigo-500', bg: 'bg-indigo-50' },
            { label: 'Best Score', value: bestScore !== '--' ? `${bestScore}%` : '--', icon: Star, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Avg Score', value: avgScore !== '--' ? `${avgScore}%` : '--', icon: BarChart2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          ].map(s => (
            <Card key={s.label} bordered={false} className="rounded-xl shadow-sm text-center py-2 bg-white">
              <div className={`w-10 h-10 ${s.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <s.icon size={18} className={s.color} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 m-0">{s.value}</h2>
              <p className="text-[12px] text-slate-500 font-medium m-0 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Already scored */}
        {passedTests > 0 && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
            <p className="text-[11px] font-bold text-emerald-800 mb-3 uppercase tracking-widest m-0">Your Badges</p>
            <div className="flex flex-wrap gap-3 mt-3">
              {results.filter(r => r.passed).map((r) => (
                <div key={r._id} className="flex items-center gap-2 bg-white border border-emerald-100 px-3 py-2 rounded-lg">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-800 capitalize">{r.skill}</span>
                  <span className="text-xs font-bold text-emerald-600">{r.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Results */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 m-0">YOUR ASSESSMENT RESULTS</p>
          
          {loading ? (
            <div className="py-12 flex justify-center">
              <Spin size="large" />
            </div>
          ) : results.length === 0 ? (
            <Card bordered={false} className="py-12 rounded-xl text-center shadow-sm">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                <ClipboardList size={24} />
              </div>
              <Title level={5} className="m-0 font-semibold text-slate-700">No assessments taken</Title>
              <Text className="text-slate-500 block max-w-sm mx-auto mt-2 mb-6 text-sm">Take your first skill assessment to prove your expertise to top recruiters.</Text>
              <Button type="primary" onClick={() => navigate('/free-assessment')} className="rounded-md bg-indigo-600 hover:bg-indigo-700 shadow-sm font-medium tracking-wide">
                Start First Assessment
              </Button>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5 mt-4">
              {results.map(r => (
                <Card
                  key={r._id}
                  bordered={false}
                  className="rounded-xl shadow-sm hover:shadow-md transition-all group"
                  bodyStyle={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}
                >
                  <div className={`flex-none w-12 h-12 flex items-center justify-center rounded-xl font-bold text-sm ${r.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    {r.skill.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-slate-800 capitalize m-0 truncate max-w-[120px]">{r.skill}</h3>
                      <Tag color={r.passed ? 'success' : 'warning'} className="border-none font-bold px-2 py-0.5 text-[10px] rounded-md m-0">
                        {r.percentage}% {r.passed ? 'Passed' : 'Try Again'}
                      </Tag>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] font-medium text-slate-400">{r.score} out of {r.total} correct</span>
                      {r.createdAt && (
                        <>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    type="text"
                    onClick={() => setActiveResult(r)}
                    className="h-9 px-4 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[13px] shrink-0 border-none"
                  >
                    View Details
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Tip */}
        <div className="rounded-xl bg-slate-50/80 p-5 mt-6">
          <p className="text-sm font-semibold text-slate-800 mb-3 m-0">How badges work</p>
          <div className="space-y-2">
            {[
              'Score ≥ 60% to earn a verified badge on your profile',
              'Badges are displayed to recruiters when they view your profile',
              'Retake any test to improve your score — only the best is shown',
            ].map(t => (
              <div key={t} className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 m-0 leading-relaxed font-medium">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SkillTests;
