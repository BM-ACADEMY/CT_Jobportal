import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, GraduationCap, Users } from 'lucide-react';

// "Who are you?" band right under the hero: one clear first step for each type of visitor.
const CARDS = [
  { icon: Search, title: 'Looking for a job', text: 'Search real jobs. Apply free.', to: '/jobs', cta: 'Find jobs' },
  { icon: Building2, title: 'Hiring for my company', text: 'Post a job in about 5 minutes.', to: '/for-companies', cta: 'Hire people' },
  { icon: Users, title: 'Recruiter or agency', text: 'Search, track and place candidates.', to: '/for-recruiters', cta: 'For recruiters' },
  { icon: GraduationCap, title: 'College or institute', text: 'Campus drives and student reports.', to: '/for-colleges', cta: 'For colleges' },
];
const WhoAreYou = () => (
  <section className="max-w-6xl mx-auto px-4 py-8">
    <h2 className="text-xl font-black text-slate-900 mb-4">Who are you?</h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARDS.map(({ icon: Icon, title, text, to, cta }) => (
        <Link key={to} to={to} className="block bg-white rounded-2xl border border-slate-200 p-4 hover:border-emerald-400 hover:shadow-md transition">
          <Icon size={22} className="text-emerald-600" />
          <p className="font-black text-slate-900 mt-2 leading-tight">{title}</p>
          <p className="text-xs text-slate-500 mt-1">{text}</p>
          <p className="text-sm font-bold text-emerald-700 mt-2">{cta} →</p>
        </Link>
      ))}
    </div>
  </section>
);
export default WhoAreYou;
