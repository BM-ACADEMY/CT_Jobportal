import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

// One short landing page per type of visitor: what you get, how it works, one button. No made-up numbers.
const PAGES = {
  companies: {
    path: '/for-companies',
    seoTitle: 'Hire in Puducherry and Tamil Nadu | Velaivaaipu for Companies',
    seoDesc: 'Post a job free, get matched candidates and hire. Walk-in drives and free internships for verified companies.',
    title: 'Hire the right people in Puducherry and Tamil Nadu',
    sub: 'Post your first job in about 5 minutes. Candidates are matched to your job, and you only talk to people who fit.',
    cta: { label: 'Post your first job', to: '/register?role=company' },
    second: { label: 'See plans', to: '/plans' },
    steps: [['Post a job', 'Use a ready template or write your own. Posting is free to start.'], ['Get matched candidates', 'See who fits your job, with the reasons, and shortlist in one place.'], ['Hire', 'Call, interview and hire. Run a walk-in drive when you need many people fast.']],
    points: ['Verified badge: our team checks each company before the badge is given, so candidates can trust your jobs.', 'Walk-in drives: collect registrations, check people in with a pass, and see a report.', 'Internships: verified companies can post up to 3 live internships free.', 'Plans shown openly, with no hidden charges.'],
  },
  recruiters: {
    path: '/for-recruiters',
    seoTitle: 'For Recruiters and Agencies | Velaivaaipu',
    seoDesc: 'Search candidates, run a hiring pipeline and add your team. Built for recruiters hiring in Tamil Nadu.',
    title: 'One place to find, track and place candidates',
    sub: 'Search real candidates, move them through a pipeline, and work with your team on the same jobs.',
    cta: { label: 'Create a recruiter account', to: '/register?role=recruiter' },
    second: { label: 'See plans', to: '/plans' },
    steps: [['Create your account', 'Sign up with your work details. It takes a few minutes.'], ['Post and search', 'Post client jobs and search candidates by skill, city and experience.'], ['Track and place', 'Move people through the pipeline and keep your team in sync.']],
    points: ['Candidate search with skills and experience filters.', 'A pipeline to track every applicant.', 'Team seats so colleagues work together.', 'Candidates never pay to apply, which keeps your talent pool trusted.'],
  },
};

const AudienceLanding = ({ kind }) => {
  const p = PAGES[kind];
  return (
    <div className="bg-white">
      <SEOHead title={p.seoTitle} description={p.seoDesc} path={p.path} />
      <section className="max-w-4xl mx-auto px-4 pt-14 pb-10">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">{p.title}</h1>
        <p className="mt-4 text-base md:text-lg text-slate-600 max-w-2xl">{p.sub}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={p.cta.to} className="inline-flex items-center h-12 px-6 rounded-xl bg-emerald-600 text-white font-black">{p.cta.label}</Link>
          <Link to={p.second.to} className="inline-flex items-center h-12 px-6 rounded-xl border border-slate-300 font-bold text-slate-700">{p.second.label}</Link>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 pb-10 grid gap-4 md:grid-cols-3">
        {p.steps.map(([t, d], i) => (
          <div key={t} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-xs font-black text-emerald-700">Step {i + 1}</p>
            <h2 className="font-black text-slate-900 mt-1">{t}</h2>
            <p className="text-sm text-slate-600 mt-1">{d}</p>
          </div>
        ))}
      </section>
      <section className="max-w-4xl mx-auto px-4 pb-14">
        <ul className="space-y-3">
          {p.points.map((x) => <li key={x} className="flex gap-2 text-slate-700"><CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />{x}</li>)}
        </ul>
        <div className="mt-8"><Link to={p.cta.to} className="inline-flex items-center h-12 px-6 rounded-xl bg-emerald-600 text-white font-black">{p.cta.label}</Link></div>
        <p className="mt-4 text-xs text-slate-500">Need help? <Link to="/contact" className="underline">Talk to our team</Link>.</p>
      </section>
    </div>
  );
};
export default AudienceLanding;
