import React, { useState } from 'react';
import { Briefcase, Play, BookOpen, Mic, BarChart2, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';

const CATEGORIES = [
  { label: 'Frontend', count: 42, color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { label: 'Backend', count: 38, color: 'bg-violet-50 text-violet-700 border-violet-100' },
  { label: 'System Design', count: 24, color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { label: 'HR & Behavioural', count: 31, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { label: 'DSA', count: 56, color: 'bg-rose-50 text-rose-700 border-rose-100' },
  { label: 'Product', count: 18, color: 'bg-teal-50 text-teal-700 border-teal-100' },
];

const QUESTIONS = [
  { q: 'Explain the difference between REST and GraphQL', difficulty: 'Medium', time: '5 min' },
  { q: 'How does React\'s virtual DOM work?', difficulty: 'Easy', time: '3 min' },
  { q: 'Design a URL shortener like bit.ly', difficulty: 'Hard', time: '15 min' },
];

const diffColor = { Easy: 'bg-emerald-50 text-emerald-700', Medium: 'bg-amber-50 text-amber-700', Hard: 'bg-red-50 text-red-700' };

const InterviewPrep = () => {
  const [selected, setSelected] = useState(null);

  return (
    <FeatureGate
      featureKey="hasInterviewPrep"
      featureName="Interview Prep"
      description="Practice with AI-powered mock interviews, role-specific question banks, and instant feedback to ace your next interview."
      subscriptionPath="/jobseeker/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <Briefcase size={16} className="text-teal-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Interview Prep</h1>
            </div>
            <p className="text-sm text-slate-500">AI-powered mock interviews and question banks.</p>
          </div>
          <Button className="h-10 px-5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm gap-2 shrink-0">
            <Mic size={15} /> Start Mock Interview
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Questions practiced', value: '0', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Mock interviews', value: '0', icon: Play, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Avg. score', value: '--', icon: BarChart2, color: 'text-amber-600', bg: 'bg-amber-50' },
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

        {/* Categories */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Question Categories</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map(c => (
              <button
                key={c.label}
                onClick={() => setSelected(c.label === selected ? null : c.label)}
                className={`flex items-center justify-between p-4 rounded-xl border font-medium text-sm transition-all hover:shadow-sm ${
                  selected === c.label ? 'ring-2 ring-teal-400 ' + c.color : c.color
                }`}
              >
                <span>{c.label}</span>
                <span className="text-xs opacity-60">{c.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Practice Questions</p>
          <div className="space-y-3">
            {QUESTIONS.map((q, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-teal-100 hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">{q.q}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge className={`text-[9px] px-1.5 py-0 border-none ${diffColor[q.difficulty]}`}>{q.difficulty}</Badge>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={9} /> {q.time}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-2xl bg-teal-50 border border-teal-100 p-5">
          <p className="text-xs font-bold text-teal-800 mb-3">Pro Tips</p>
          <div className="space-y-2">
            {['Use the STAR method for behavioural questions', 'Record yourself to identify filler words', 'Review system design basics for senior roles'].map(t => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-teal-500 shrink-0" />
                <p className="text-xs text-teal-700 font-medium">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};

export default InterviewPrep;
