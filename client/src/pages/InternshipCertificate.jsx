import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Printer } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

const API = import.meta.env.VITE_API_BASE_URL;
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

// /certificate/:code - printable internship completion certificate (use Print, then Save as PDF).
// The same page is the public check: it opens only for a real code and shows only what the company's completion
// record holds. It says nothing about skills, marks or performance.
const InternshipCertificate = () => {
  const { code } = useParams();
  const [state, setState] = useState({ loading: true, cert: null });

  useEffect(() => {
    setState({ loading: true, cert: null });
    axios.get(`${API}/certificates/verify/${encodeURIComponent(code)}`)
      .then((r) => setState({ loading: false, cert: r.data?.valid ? r.data.certificate : null }))
      .catch(() => setState({ loading: false, cert: null }));
  }, [code]);

  const { loading, cert } = state;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <SEOHead title="Internship certificate | Velaivaaipu" description="Internship completion certificate on Velaivaaipu." path={`/certificate/${code}`} robots="noindex, nofollow" />
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; } .cert-sheet { box-shadow: none !important; border-width: 4px !important; } }`}</style>
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : !cert ? (
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-slate-200 p-8">
          <h1 className="text-xl font-bold text-slate-900 m-0">Certificate not found</h1>
          <p className="text-sm text-slate-500 mt-2">We could not find a certificate with this code. Check the code and try again.</p>
          <Link to="/" className="inline-block mt-4 text-sm font-bold text-emerald-700 hover:underline">Go to Velaivaaipu</Link>
        </div>
      ) : (
        <>
          <div className="no-print max-w-3xl mx-auto mb-4 flex justify-end">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold border-none cursor-pointer">
              <Printer size={15} /> Print / Save as PDF
            </button>
          </div>
          <div className="cert-sheet max-w-3xl mx-auto bg-white border-8 border-double border-emerald-700/70 rounded-md shadow-lg px-8 py-12 md:px-16 text-center">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-emerald-700 m-0">Velaivaaipu</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#10213D] mt-3 mb-8">Internship Completion Certificate</h1>
            <p className="text-slate-600 m-0">This is to record that</p>
            <p className="text-3xl font-bold text-slate-900 my-3">{cert.name || 'The intern'}</p>
            <p className="text-slate-600 m-0 leading-relaxed">
              was marked as having completed the internship{cert.role ? <> <strong>{cert.role}</strong></> : null}
              {cert.company ? <> at <strong>{cert.company}</strong></> : null}
              {cert.completedOn ? <> on <strong>{fmt(cert.completedOn)}</strong></> : null}.
            </p>
            <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-sm max-w-md mx-auto">
              {cert.appliedOn && <div><dt className="text-slate-500">Applied on</dt><dd className="font-bold text-slate-800 m-0">{fmt(cert.appliedOn)}</dd></div>}
              {cert.completedOn && <div><dt className="text-slate-500">Marked completed on</dt><dd className="font-bold text-slate-800 m-0">{fmt(cert.completedOn)}</dd></div>}
            </dl>
            <div className="mt-10 pt-5 border-t border-slate-200 text-xs text-slate-500">
              <p className="m-0">The completion was recorded by the company on Velaivaaipu. This certificate does not describe skills, marks or performance.</p>
              <p className="mt-2 mb-0">Verification code: <span className="font-mono font-bold text-slate-800">{cert.code}</span></p>
              <p className="mt-1 mb-0">Check it at {typeof window !== 'undefined' ? `${window.location.origin}/certificate/${cert.code}` : `/certificate/${cert.code}`}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InternshipCertificate;
