import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import SEOHead from '../../components/seo/SEOHead';
import { JOB_TEMPLATES } from '../../data/jobTemplates';
import { trackEvent } from '../../utils/analytics';

const JobPostTemplates = () => {
  const [copied, setCopied] = useState('');

  const copy = async (t) => {
    try {
      await navigator.clipboard.writeText(t.text);
      setCopied(t.role);
      trackEvent('generate_lead', { source: 'job_template', role: t.role });
      toast.success('Copied. Paste it into a new job post.');
      setTimeout(() => setCopied(''), 2000);
    } catch {
      toast.error('Could not copy. Select the text and copy it.');
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <SEOHead
        title="Free Job Post Templates for 10 Common Roles | Velaivaaipu"
        description="Copy ready-made job descriptions for sales, accountant, telecaller, designer, developer and more. Change the details and post free on Velaivaaipu."
        path="/job-post-templates"
      />
      <section className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Job post templates, ready to copy</h1>
          <p className="text-slate-600 mt-3">Pick a role, copy the text, change the details in [brackets], and publish in two minutes.</p>
          <Link to="/register?role=company" className="inline-block mt-6 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700">Post a job free</Link>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        {JOB_TEMPLATES.map((t) => (
          <article key={t.role} className="rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between gap-4 mb-3">
              <h2 className="text-lg font-bold text-slate-900">{t.role}</h2>
              <button type="button" onClick={() => copy(t)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:border-emerald-400">
                {copied === t.role ? <><Check size={16} className="text-emerald-600" /> Copied</> : <><Copy size={16} /> Copy</>}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-slate-600 font-sans leading-relaxed">{t.text}</pre>
          </article>
        ))}
      </section>
    </div>
  );
};

export default JobPostTemplates;
