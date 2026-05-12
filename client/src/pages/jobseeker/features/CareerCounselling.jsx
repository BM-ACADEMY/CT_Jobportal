import React from 'react';
import { Star, Calendar, Clock, Video, CheckCircle2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';

const COUNSELLORS = [
  { name: 'Dr. Ananya Sharma', speciality: 'Tech Careers & Salary Negotiation', exp: '12 yrs', rating: 4.9, sessions: 840, avatar: 'AS', next: 'Thu 3 PM' },
  { name: 'Vikram Iyer', speciality: 'Startup & Product Roles', exp: '8 yrs', rating: 4.8, sessions: 620, avatar: 'VI', next: 'Fri 11 AM' },
  { name: 'Meera Patel', speciality: 'Career Change & Upskilling', exp: '10 yrs', rating: 4.9, sessions: 970, avatar: 'MP', next: 'Wed 5 PM' },
];

const CareerCounselling = () => {
  const { user } = useAuth();
  const sessionsLeft = user?.subscription?.careerCounsellingCount ?? 0;
  const unlimited = sessionsLeft === 0;

  return (
    <FeatureGate
      featureKey="hasCareerCounselling"
      featureName="Career Counselling"
      description="Book 1-on-1 sessions with industry experts for career guidance, salary negotiation, and growth roadmapping."
      subscriptionPath="/jobseeker/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <Star size={16} className="text-rose-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Career Counselling</h1>
            </div>
            <p className="text-sm text-slate-500">Expert 1-on-1 sessions to accelerate your career.</p>
          </div>
          <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-center shrink-0">
            <p className="text-lg font-bold text-rose-700">{unlimited ? '∞' : sessionsLeft}</p>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Sessions Left</p>
          </div>
        </div>

        {/* Session perks */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Video, label: 'Video Sessions', desc: 'HD video + screen share' },
            { icon: Clock, label: '45 Min / Session', desc: 'Deep-dive career talks' },
            { icon: Calendar, label: 'Flexible Booking', desc: 'Pick your time slot' },
          ].map(p => (
            <div key={p.label} className="rounded-xl border border-slate-100 bg-white p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center shrink-0">
                <p.icon size={15} className="text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{p.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Counsellors */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Available Counsellors</p>
          <div className="space-y-4">
            {COUNSELLORS.map((c, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-slate-900">{c.name}</p>
                    <Badge className="text-[9px] bg-amber-50 text-amber-700 border-none font-bold px-1.5 py-0">
                      ★ {c.rating}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{c.speciality}</p>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><User size={9} /> {c.exp} exp</span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><CheckCircle2 size={9} className="text-emerald-500" /> {c.sessions} sessions</span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Clock size={9} /> Next: {c.next}</span>
                  </div>
                </div>
                <Button size="sm" className="h-9 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs gap-1.5 shrink-0">
                  <Calendar size={12} /> Book Session
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};

export default CareerCounselling;
