import React, { useState } from 'react';
import { ClipboardList, Play, CheckCircle2, Clock, Star, ChevronRight, Trophy, BarChart2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';

const CATEGORIES = [
  { label: 'JavaScript', questions: 30, duration: '30 min', level: 'Intermediate', color: 'bg-yellow-50 text-yellow-700 border-yellow-100', attempts: 1240 },
  { label: 'Python',     questions: 25, duration: '25 min', level: 'Beginner',     color: 'bg-blue-50 text-blue-700 border-blue-100',     attempts: 980 },
  { label: 'React',      questions: 20, duration: '20 min', level: 'Intermediate', color: 'bg-cyan-50 text-cyan-700 border-cyan-100',       attempts: 870 },
  { label: 'SQL',        questions: 20, duration: '20 min', level: 'Beginner',     color: 'bg-orange-50 text-orange-700 border-orange-100', attempts: 760 },
  { label: 'System Design', questions: 15, duration: '45 min', level: 'Advanced', color: 'bg-violet-50 text-violet-700 border-violet-100', attempts: 540 },
  { label: 'Data Structures', questions: 25, duration: '35 min', level: 'Advanced', color: 'bg-rose-50 text-rose-700 border-rose-100',    attempts: 620 },
  { label: 'Communication', questions: 15, duration: '15 min', level: 'Beginner',  color: 'bg-emerald-50 text-emerald-700 border-emerald-100', attempts: 430 },
  { label: 'Aptitude',   questions: 30, duration: '30 min', level: 'Intermediate', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', attempts: 1100 },
];

const LEVEL_COLOR = {
  Beginner:     'bg-emerald-50 text-emerald-700',
  Intermediate: 'bg-amber-50 text-amber-700',
  Advanced:     'bg-rose-50 text-rose-700',
};

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    q: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
    answer: 1,
    category: 'Data Structures',
  },
  {
    id: 2,
    q: 'Which hook in React is used for side effects?',
    options: ['useState', 'useContext', 'useEffect', 'useReducer'],
    answer: 2,
    category: 'React',
  },
  {
    id: 3,
    q: 'In SQL, which clause is used to filter groups?',
    options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
    answer: 1,
    category: 'SQL',
  },
];

const QuizModal = ({ test, onClose }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const q = SAMPLE_QUESTIONS[current];
  const total = SAMPLE_QUESTIONS.length;
  const score = SAMPLE_QUESTIONS.filter(qs => selected[qs.id] === qs.answer).length;

  if (submitted) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
            <Trophy size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Test Complete!</h2>
          <p className="text-4xl font-bold text-emerald-600">{pct}%</p>
          <p className="text-sm text-slate-500">You answered <strong>{score}/{total}</strong> questions correctly</p>
          {pct >= 70 ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-none text-xs font-bold px-3 py-1">
              <CheckCircle2 size={12} className="inline mr-1" /> Passed
            </Badge>
          ) : (
            <Badge className="bg-amber-50 text-amber-700 border-none text-xs font-bold px-3 py-1">
              Keep Practicing
            </Badge>
          )}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose} className="rounded-xl border-slate-200 font-bold text-xs">
              Close
            </Button>
            <Button onClick={() => { setSelected({}); setCurrent(0); setSubmitted(false); }}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
              Retake
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{test} Test</p>
          <span className="text-xs font-bold text-slate-400">{current + 1} / {total}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${((current + 1) / total) * 100}%` }} />
        </div>

        {/* Question */}
        <div>
          <p className="text-sm font-bold text-slate-900 leading-relaxed mb-5">{q.q}</p>
          <div className="space-y-2">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelected(prev => ({ ...prev, [q.id]: idx }))}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  selected[q.id] === idx
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="font-bold mr-2 text-slate-400">{String.fromCharCode(65 + idx)}.</span> {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-slate-200 font-bold text-xs">
            Exit Test
          </Button>
          <div className="flex gap-2">
            {current > 0 && (
              <Button variant="outline" onClick={() => setCurrent(p => p - 1)} className="rounded-xl border-slate-200 font-bold text-xs">
                Previous
              </Button>
            )}
            {current < total - 1 ? (
              <Button
                onClick={() => setCurrent(p => p + 1)}
                disabled={selected[q.id] === undefined}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Next <ChevronRight size={13} />
              </Button>
            ) : (
              <Button
                onClick={() => setSubmitted(true)}
                disabled={selected[q.id] === undefined}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Submit Test
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SkillTests = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [scores] = useState({ JavaScript: 82, Python: 76 });

  return (
    <FeatureGate
      featureKey="hasInterviewPrep"
      featureName="Skill Tests"
      description="Prove your skills with verified assessments that boost your profile visibility and build recruiter confidence."
      subscriptionPath="/jobseeker/subscription"
    >
      {activeTest && <QuizModal test={activeTest} onClose={() => setActiveTest(null)} />}

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
            <p className="text-sm text-slate-500">Earn verified badges and stand out to recruiters.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
            <Trophy size={14} className="text-indigo-600" />
            <p className="text-xs font-bold text-indigo-700">{Object.keys(scores).length} Tests Passed</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Tests Taken', value: Object.keys(scores).length, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Best Score', value: Object.values(scores).length ? `${Math.max(...Object.values(scores))}%` : '--', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Avg Score', value: Object.values(scores).length ? `${Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length)}%` : '--', icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
        {Object.keys(scores).length > 0 && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-xs font-bold text-emerald-800 mb-3 uppercase tracking-widest">Your Badges</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(scores).map(([skill, score]) => (
                <div key={skill} className="flex items-center gap-2 bg-white border border-emerald-100 px-3 py-2 rounded-xl">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">{skill}</span>
                  <span className="text-xs font-bold text-emerald-600">{score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Tests */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Available Assessments</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {CATEGORIES.map(cat => {
              const taken = scores[cat.label];
              return (
                <div
                  key={cat.label}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm transition-all group"
                >
                  <div className={`flex-none px-3 py-2 rounded-xl border text-xs font-bold ${cat.color}`}>
                    {cat.label.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{cat.label}</p>
                      <Badge className={`text-[8px] font-bold border-none px-1.5 py-0 ${LEVEL_COLOR[cat.level]}`}>
                        {cat.level}
                      </Badge>
                      {taken && (
                        <Badge className="text-[8px] font-bold border-none px-1.5 py-0 bg-emerald-50 text-emerald-700">
                          {taken}% ✓
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={9} /> {cat.duration}
                      </span>
                      <span className="text-[10px] text-slate-400">{cat.questions} questions</span>
                      <span className="text-[10px] text-slate-400">{cat.attempts.toLocaleString()} attempts</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveTest(cat.label)}
                    className="h-8 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs gap-1 shrink-0"
                  >
                    <Play size={11} /> {taken ? 'Retake' : 'Start'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tip */}
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
          <p className="text-xs font-bold text-slate-700 mb-2">How badges work</p>
          <div className="space-y-1.5">
            {[
              'Score ≥ 70% to earn a verified badge on your profile',
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
    </FeatureGate>
  );
};

export default SkillTests;
