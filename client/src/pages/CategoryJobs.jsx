import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ChevronRight, Target } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';
import { JOB_CATEGORIES } from '../data/jobCategories';
import { CATEGORY_SKILL_TESTS } from '../data/jobCategorySkillTests';
import { jobPath } from '../utils/jobUrl';
import { walkInActive, walkInLabel } from '../utils/walkIn';

const API = import.meta.env.VITE_API_BASE_URL;

// /jobs/category/:slug - the live jobs of one field of work, with its heading and (when one exists) its free skill test.
const CategoryJobs = () => {
  const { slug } = useParams();
  const category = JOB_CATEGORIES.find((c) => c.key === slug);
  const [jobs, setJobs] = useState(null);
  const [test, setTest] = useState(null);

  useEffect(() => {
    if (!category) return;
    setJobs(null);
    axios.get(`${API}/jobs`)
      .then((r) => setJobs((Array.isArray(r.data) ? r.data : r.data.jobs || []).filter((j) => j.category === slug)))
      .catch(() => setJobs([]));
    const wanted = CATEGORY_SKILL_TESTS[slug] || [];
    setTest(null);
    if (wanted.length) {
      axios.get(`${API}/assessments/skills`)
        .then((r) => {
          const ready = Array.isArray(r.data) ? r.data : [];
          setTest(ready.find((s) => wanted.includes(s.key)) || null);
        })
        .catch(() => setTest(null));
    }
  }, [slug, category]);

  if (!category) return <Navigate to="/jobs" replace />;

  const count = jobs?.length ?? 0;
  const title = `${category.label} Jobs in Tamil Nadu | Velaivaaipu`;
  const description = `Find ${category.label.toLowerCase()} jobs in Tamil Nadu. ${category.desc} Apply online free on Velaivaaipu.`;

  return (
    <div className="min-h-screen bg-white">
      <SEOHead title={title} description={description} path={`/jobs/category/${category.key}`} robots={jobs !== null && count === 0 ? 'noindex, follow' : 'index, follow'} />
      <header className="bg-[#f4faf7] border-b border-emerald-100 px-6 pt-10 pb-10">
        <div className="max-w-4xl mx-auto">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mb-5">
            <Link to="/" className="hover:text-[#34B678]">Home</Link>
            <ChevronRight size={12} className="text-zinc-400" />
            <Link to="/jobs" className="hover:text-[#34B678]">Jobs</Link>
            <ChevronRight size={12} className="text-zinc-400" />
            <span className="text-zinc-700">{category.label}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-[#10213D] m-0">{category.label} jobs</h1>
          <p className="text-zinc-600 mt-2 mb-0">{category.desc}</p>
          {test && (
            <Link to="/free-assessment" className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-xl bg-white ring-1 ring-emerald-200 text-sm font-bold text-emerald-700 hover:ring-emerald-400">
              <Target size={15} /> Take the free {test.label} test
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-3">
        {jobs === null ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>
        ) : count === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-slate-100">
            <p className="font-bold text-slate-700 m-0">No {category.label.toLowerCase()} jobs are open right now.</p>
            <Link to="/jobs" className="inline-block mt-3 text-sm font-bold text-emerald-700 hover:underline">See all jobs</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500 m-0">{count} {count === 1 ? 'job' : 'jobs'} open</p>
            {jobs.map((j) => (
              <Link key={j._id} to={jobPath(j)} className="block rounded-2xl border border-slate-100 p-4 hover:border-emerald-300">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900">{j.title}</span>
                  {walkInActive(j) && <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full uppercase">{walkInLabel(j)}</span>}
                </div>
                <p className="text-sm text-slate-500 mt-0.5 mb-0">{[j.company?.name, j.location, j.jobType].filter(Boolean).join(' · ')}</p>
              </Link>
            ))}
            <p className="pt-2 text-sm"><Link to={`/jobs?category=${category.key}`} className="font-bold text-emerald-700 hover:underline">Filter by pay, experience and more</Link></p>
          </>
        )}
      </main>
    </div>
  );
};

export default CategoryJobs;
