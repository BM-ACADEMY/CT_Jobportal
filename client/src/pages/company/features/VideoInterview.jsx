import React from 'react';
import { Video, Calendar, Link2, Play, Clock, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';

const UPCOMING = [
  { name: 'Arjun Kumar', role: 'Frontend Developer', date: 'Today, 3:00 PM', panel: 2, status: 'confirmed' },
  { name: 'Priya Nair', role: 'React Engineer', date: 'Tomorrow, 11:00 AM', panel: 1, status: 'confirmed' },
  { name: 'Ravi Sharma', role: 'Full Stack Dev', date: 'Thu, 2:30 PM', panel: 3, status: 'pending' },
];

const VideoInterview = () => (
  <FeatureGate
    featureKey="hasVideoInterview"
    featureName="Video Interview"
    description="Conduct integrated HD video interviews with recording, transcripts, and panel support — no third-party tools needed."
    subscriptionPath="/company/subscription"
  >
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
              <Video size={16} className="text-rose-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Video Interview</h1>
          </div>
          <p className="text-sm text-slate-500">HD video rooms with recording, transcripts, and panel support.</p>
        </div>
        <Button className="h-10 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm gap-2 shrink-0">
          <Play size={15} /> Start Interview
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Interviews conducted', value: '0' },
          { label: 'Avg. duration', value: '--' },
          { label: 'Scheduled today', value: '1' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Start */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 p-6">
        <p className="text-sm font-bold text-rose-900 mb-4">Quick Interview Links</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {['Instant interview room', 'Scheduled panel interview'].map(t => (
            <button key={t} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-rose-100 hover:shadow-sm transition-all text-left">
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
                <Link2 size={14} className="text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{t}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Copy invite link</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Upcoming Interviews</p>
        <div className="space-y-3">
          {UPCOMING.map((u, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-rose-100 hover:shadow-sm transition-all">
              <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                <Video size={15} className="text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{u.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-slate-500">{u.role}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={9} /> {u.date}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1"><Users size={9} /> {u.panel} panelists</span>
                </div>
              </div>
              <Badge className={`text-[10px] font-bold border-none shrink-0 ${u.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {u.status}
              </Badge>
              <Button size="sm" variant="outline" className="h-8 px-3 text-xs font-bold border-slate-200 shrink-0">Join</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="grid sm:grid-cols-2 gap-3">
        {['HD video + screen sharing', 'Auto-record & transcript', 'Whiteboard for technical rounds', 'Panel interview with multiple interviewers', 'Candidate self-scheduling link', 'Recording shared with team'].map(f => (
          <div key={f} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> {f}
          </div>
        ))}
      </div>
    </div>
  </FeatureGate>
);

export default VideoInterview;
