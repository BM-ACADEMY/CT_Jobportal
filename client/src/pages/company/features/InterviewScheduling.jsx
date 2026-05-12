import React, { useState } from 'react';
import { Calendar, Clock, Link2, CheckCircle2, Bell, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const SLOTS = [
  { day: 'Mon', time: '10:00 AM', candidate: 'Arjun Kumar', role: 'Frontend Dev', status: 'confirmed' },
  { day: 'Tue', time: '2:00 PM', candidate: 'Priya Menon', role: 'React Engineer', status: 'pending' },
  { day: 'Thu', time: '11:30 AM', candidate: 'Ravi Das', role: 'Backend Dev', status: 'confirmed' },
  { day: 'Fri', time: '4:00 PM', candidate: 'Sneha Roy', role: 'Full Stack', status: 'confirmed' },
];

const INTEGRATIONS = ['Google Calendar', 'Outlook / Office 365', 'Apple Calendar', 'Zoom (auto-link)'];

const InterviewScheduling = () => {
  const [activeDay, setActiveDay] = useState('Mon');

  return (
    <FeatureGate
      featureKey="hasInterviewScheduling"
      featureName="Interview Scheduling"
      description="Sync with calendars, auto-send reminders, and let candidates self-schedule — eliminate back-and-forth emails."
      subscriptionPath="/company/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <Calendar size={16} className="text-teal-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Interview Scheduling</h1>
            </div>
            <p className="text-sm text-slate-500">Automated calendar sync and candidate self-scheduling.</p>
          </div>
          <Button className="h-10 px-5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm gap-2 shrink-0">
            <Link2 size={15} /> Get Booking Link
          </Button>
        </div>

        {/* Week view */}
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
          <div className="flex border-b border-slate-100">
            {DAYS.map(d => (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`flex-1 py-3 text-xs font-bold transition-colors ${activeDay === d ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {d}
                {SLOTS.some(s => s.day === d) && (
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mx-auto mt-1" />
                )}
              </button>
            ))}
          </div>
          <div className="p-4 space-y-3 min-h-[120px]">
            {SLOTS.filter(s => s.day === activeDay).length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">No interviews scheduled</div>
            ) : (
              SLOTS.filter(s => s.day === activeDay).map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-center shrink-0">
                    <p className="text-xs font-bold text-teal-700">{s.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900">{s.candidate}</p>
                    <p className="text-[10px] text-slate-500">{s.role}</p>
                  </div>
                  <Badge className={`text-[9px] font-bold border-none ${s.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {s.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-sm font-bold text-slate-900 mb-4">Smart Features</p>
            <div className="space-y-2.5">
              {[
                { icon: RefreshCw, label: 'Calendar sync (Google, Outlook)' },
                { icon: Bell, label: 'Auto-reminders (24h + 1h before)' },
                { icon: Link2, label: 'Self-schedule link for candidates' },
                { icon: Clock, label: 'Timezone auto-detection' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                    <f.icon size={12} className="text-teal-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-700">{f.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-sm font-bold text-slate-900 mb-4">Connect Calendar</p>
            <div className="space-y-2">
              {INTEGRATIONS.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-700">{c}</p>
                  <Button size="sm" variant="outline" className="h-7 px-3 text-[10px] font-bold border-slate-200">Connect</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};

export default InterviewScheduling;
