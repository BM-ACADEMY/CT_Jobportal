import React from 'react';
import { Badge } from '@/components/ui/badge';
import SEOHead from '../seo/SEOHead';

// Shared layout for the legal pages (Privacy Policy, Refund Policy).
export const SUPPORT_EMAIL = 'support@velaivaaipu.in';
// Registered business (from the incorporation records). Confirm with your CA / legal adviser before launch.
export const LEGAL_ENTITY = 'Afra Ventures Private Limited';
export const LEGAL_ADDRESS = '78 Lenin St, Kosapalayam, Puducherry 605013, India';
export const LEGAL_CIN = 'U62011PY2026PTC009819';

export const Section = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-24 py-8 border-b border-slate-100 last:border-b-0">
    <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const LegalPage = ({ title, icon: Icon, effective, intro, sections, seoPath, seoDescription, children }) => (
  <div className="min-h-screen bg-white">
    <SEOHead title={`${title} | Velaivaaipu`} description={seoDescription} path={seoPath} />
    <div className="bg-slate-950 pt-28 pb-14 px-6">
      <div className="max-w-4xl mx-auto">
        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 mb-5">Legal</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3 flex items-center gap-3">
          {Icon && <Icon size={30} className="text-emerald-400" />} {title}
        </h1>
        <p className="text-slate-400 text-sm">Effective date: {effective}{intro ? ` · ${intro}` : ''}</p>
      </div>
    </div>
    <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12">
      <nav className="hidden lg:block sticky top-24 self-start">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">On this page</p>
        <ul className="space-y-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors leading-snug block">{s.title}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div>{children}</div>
    </div>
  </div>
);

export default LegalPage;
