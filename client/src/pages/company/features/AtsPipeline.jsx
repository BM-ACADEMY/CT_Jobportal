import React, { useState } from 'react';
import { Layers, Users, CheckCircle2, Circle, ArrowRight, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FeatureGate from '@/components/subscription/FeatureGate';

const STAGES = [
  { label: 'Applied', color: 'bg-slate-100 text-slate-700', candidates: [
    { name: 'Arjun K.', role: 'Frontend Dev', time: '2h ago' },
    { name: 'Priya M.', role: 'React Engineer', time: '4h ago' },
  ]},
  { label: 'Screening', color: 'bg-blue-50 text-blue-700', candidates: [
    { name: 'Ravi S.', role: 'Full Stack', time: '1d ago' },
  ]},
  { label: 'Interview', color: 'bg-violet-50 text-violet-700', candidates: [
    { name: 'Divya T.', role: 'Senior Dev', time: '2d ago' },
    { name: 'Kiran P.', role: 'Tech Lead', time: '3d ago' },
  ]},
  { label: 'Offer', color: 'bg-emerald-50 text-emerald-700', candidates: [
    { name: 'Ananya R.', role: 'Lead Engineer', time: '5d ago' },
  ]},
];

const AtsPipeline = () => (
  <FeatureGate
    featureKey="hasATSPipeline"
    featureName="ATS Pipeline"
    description="Manage your entire hiring pipeline visually — move candidates through stages, automate triggers, and collaborate with your team."
    subscriptionPath="/company/subscription"
  >
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
              <Layers size={16} className="text-violet-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">ATS Pipeline</h1>
          </div>
          <p className="text-sm text-slate-500">Visual hiring pipeline with automated stage management.</p>
        </div>
        <Button className="h-10 px-5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm gap-2 shrink-0">
          <Plus size={15} /> Add Job Pipeline
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total candidates', value: '6' },
          { label: 'In progress', value: '4' },
          { label: 'Interviews this week', value: '2' },
          { label: 'Offers sent', value: '1' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {STAGES.map(stage => (
            <div key={stage.label} className="w-56 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <Badge className={`text-[10px] font-bold px-2.5 py-0.5 border border-current/10 ${stage.color}`}>
                  {stage.label}
                </Badge>
                <span className="text-[10px] text-slate-400 font-bold">{stage.candidates.length}</span>
              </div>
              <div className="space-y-2">
                {stage.candidates.map((c, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 hover:shadow-sm hover:border-violet-100 transition-all cursor-pointer group">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-lg flex items-center justify-center text-white text-[9px] font-bold">
                        {c.name[0]}
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                    </div>
                    <p className="text-[10px] text-slate-500">{c.role}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{c.time}</p>
                  </div>
                ))}
                <button className="w-full h-8 rounded-xl border border-dashed border-slate-200 flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:border-violet-300 hover:text-violet-500 transition-colors">
                  <Plus size={10} /> Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </FeatureGate>
);

export default AtsPipeline;
