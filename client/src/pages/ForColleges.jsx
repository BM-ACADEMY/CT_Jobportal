import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  GraduationCap, QrCode, FileSpreadsheet, CalendarCheck, FileBarChart, ShieldCheck,
  MessageCircle, ArrowRight, CheckCircle2, Building2, Award,
} from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';
import { trackEvent } from '../utils/analytics';

const API = import.meta.env.VITE_API_BASE_URL;

const steps = [
  { icon: GraduationCap, title: 'Register your college', desc: 'Sign up as a TPO. Our team verifies your institution, usually within a working day.' },
  { icon: QrCode, title: 'Get your students in', desc: 'Upload a CSV once, or put a QR code on the notice board — students join with just a name and WhatsApp number.' },
  { icon: CalendarCheck, title: 'Run your drives', desc: 'Create a drive, invite companies, move students through every round and see the status live.' },
];

const benefits = [
  { icon: QrCode, title: 'QR sign-up in 20 seconds', desc: 'No long forms and no password to remember. Students scan, enter a name and WhatsApp number, and take a skill test straight away.' },
  { icon: Award, title: 'Certificates with your name on them', desc: 'Students who pass a skill test get an instant certificate. Paid plans add your college branding.' },
  { icon: FileSpreadsheet, title: 'Bring your existing student list', desc: 'Bulk-upload a CSV by department and batch. Accounts are created for you.' },
  { icon: FileBarChart, title: 'Reports for your principal', desc: 'Placement numbers by drive and department, plus a one-link executive summary you can share with management.' },
  { icon: Building2, title: 'Company drives in one place', desc: 'Invite companies to a drive, track who accepted, and keep every round and result together.' },
  { icon: MessageCircle, title: 'WhatsApp updates', desc: 'Students hear about new rounds and interview schedules on the app they already use.' },
];

const faqs = [
  { q: 'Will my students have to learn another portal?', a: 'No. At a drive they scan a QR code, enter a name and WhatsApp number, and they are done. Their results and certificate come to WhatsApp.' },
  { q: 'We do not have time for data entry.', a: 'You do not need to type students in. Upload the list you already have as a CSV, or let students register themselves through your QR code.' },
  { q: 'What does it cost?', a: 'You can start on the free plan with no card. Paid plans add things like co-branded certificates, company drive invites, WhatsApp interview invites and scheduled reports. Current prices are listed below.' },
  { q: 'Will companies actually come to our drives?', a: 'Paid plans let you invite companies to each drive and track their replies. We cannot promise which companies will accept — your own placement relationships still matter — but everything runs from one dashboard.' },
  { q: 'I need reports for my principal and accreditation files.', a: 'The platform gives you placement reports by drive and department, and a shareable executive summary link for your principal.' },
  { q: 'What happens to our students’ data?', a: 'It is used to run your placement drives and the services students sign up for. Please read our Terms before you start, and contact us if you want details on how your students’ data is handled.' },
];

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const capacityOf = (plan) => (plan.features || []).find((f) => f.name === 'Student Capacity' && f.isActive)?.value;

const ForColleges = () => {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    axios.get(`${API}/subscriptions`)
      .then((res) => {
        const college = (res.data || []).filter((p) => p.role === 'college' && p.isActive);
        setPlans(college.sort((a, b) => (a.price || 0) - (b.price || 0)));
      })
      .catch(() => {});
  }, []);

  const startFree = () => trackEvent('generate_lead', { placement: 'for_colleges_cta' });

  return (
    <div className="bg-white">
      <SEOHead
        title="Campus Placement Software for Colleges in TN | Velaivaaipu"
        description="Run campus drives, track students and share placement reports with your principal. Students join by QR code with just a WhatsApp number. Start free."
        path="/for-colleges"
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-36 pb-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100/70 rounded-full px-4 py-1.5">
            <GraduationCap size={14} /> For colleges &amp; placement officers
          </p>
          <h1 className="mt-6 text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Run campus placements<br className="hidden md:block" /> without the paperwork
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            Bring students in with a QR code, run drives with companies, and give your principal a clear report — all from one dashboard.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register?role=college" onClick={startFree} className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm">
              Start free <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50">
              Talk to our team
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">No card needed to start.</p>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight">Up and running in three steps</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-emerald-600 text-white text-sm font-black flex items-center justify-center">{i + 1}</span>
                <s.icon className="text-emerald-600" size={22} />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight">Built so your students and staff say yes</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-2xl bg-white border border-slate-100 p-6">
                <b.icon className="text-emerald-600" size={24} />
                <h3 className="mt-4 font-bold text-slate-900">{b.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans (live from the platform) */}
      {plans.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight">Simple plans for colleges</h2>
          <p className="text-center text-slate-500 mt-2 text-sm">Start free and upgrade only when you need more.</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((p) => {
              const capacity = capacityOf(p);
              const included = (p.features || []).filter((f) => f.isActive && f.name !== 'Student Capacity' && f.value !== false).slice(0, 5);
              return (
                <div key={p._id} className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col">
                  <h3 className="font-black text-slate-900">{p.name}</h3>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {p.price > 0 ? rupees(p.price) : 'Free'}
                    {p.price > 0 && <span className="text-xs font-semibold text-slate-400"> / {String(p.duration || 'year').toLowerCase().replace('ly', '')}</span>}
                  </p>
                  {capacity !== undefined && (
                    <p className="mt-1 text-xs font-bold text-emerald-700">
                      {typeof capacity === 'number' ? `Up to ${capacity.toLocaleString('en-IN')} students` : `${capacity} students`}
                    </p>
                  )}
                  <ul className="mt-4 space-y-2 text-sm text-slate-600 flex-1">
                    {included.map((f) => (
                      <li key={f.name} className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />{f.name}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">Prices shown are what you will see at checkout. GST may apply.</p>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight">Questions placement officers ask</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-xl bg-white border border-slate-100 px-5 py-4">
                <summary className="cursor-pointer font-bold text-slate-900 text-sm flex items-center justify-between gap-4">
                  {f.q}
                  <span className="text-emerald-600 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <ShieldCheck className="mx-auto text-emerald-600" size={32} />
          <h2 className="mt-4 text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Try it with one drive</h2>
          <p className="mt-3 text-slate-600">Create your college account, set up a drive and share the QR code. If it is not right for you, you have lost nothing.</p>
          <Link to="/register?role=college" onClick={startFree} className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm">
            Start free <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ForColleges;
