import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Phone, MapPin, Clock, Send, CheckCircle2, ArrowUpRight, Plus,
  GraduationCap, Building2, UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Footer from '@/components/home/Footer';
import WaveLines from '@/components/common/WaveLines';
import { ADDRESS, PHONE, EMAIL, MAP_EMBED, MAP_LINK, SOCIALS } from '@/components/common/brandContact';

const EASE = [0.22, 1, 0.36, 1];

const SEGMENTS = [
  { value: 'jobseeker', label: 'Job seeker', icon: UserRound },
  { value: 'company', label: 'Company', icon: Building2 },
  { value: 'college', label: 'College', icon: GraduationCap },
];

const HOURS = [
  { day: 'Monday – Friday', time: '10:00 AM – 7:00 PM' },
  { day: 'Sunday', time: 'Closed' },
];

const FAQS = [
  { q: 'How do I post a job on Velaivaaipu?', a: 'Register or log in as a company or recruiter, then go to your dashboard and click "Post a Job". Our team checks new companies, and jobs from a company show publicly once it is verified. Until then you can see them in your dashboard.' },
  { q: 'Is it free to create a job seeker account?', a: 'Yes. Creating a job seeker account is completely free. Premium plans add features for faster job discovery.' },
  { q: 'How do subscription plans work?', a: 'The Plans page lists what each plan includes and what it costs, with GST shown before you pay. Start free, and upgrade only if you need more.' },
  { q: 'How can I contact a recruiter directly?', a: 'Open the job or company page and use the apply or message option shown there. Which contact options you see depends on your plan. The Plans page has the details.' },
  { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page. We\'ll send a reset link to your registered email within a few minutes.' },
];

// company_website is a hidden spam trap: real people never fill it, so the server drops any message that has it.
const EMPTY_FORM = { name: '', email: '', subject: '', message: '', segment: '', company_website: '' };

const inputCls = 'w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm font-medium outline-none transition placeholder:text-zinc-400 focus:border-[#34B678] focus:ring-4 focus:ring-[#34B678]/15';

const Field = ({ label, required, htmlFor, children }) => (
  <div>
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-zinc-700 mb-2">
      {label} {required && <span className="text-[#34B678]">*</span>}
    </label>
    {children}
  </div>
);

const Contact = () => {
  // A link such as /contact?segment=college&subject=Custom%20plan opens the form already filled in.
  const [form, setForm] = useState(() => {
    let segment = ''; let subject = '';
    try {
      const q = new URLSearchParams(window.location.search);
      segment = ['jobseeker', 'company', 'college'].includes(q.get('segment')) ? q.get('segment') : '';
      subject = String(q.get('subject') || '').slice(0, 100);
    } catch (e) { /* ignore */ }
    return { ...EMPTY_FORM, subject, segment };
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      await axios.post(`${apiUrl}/public/contact`, form);
      setSubmitted(true);
      toast.success('Message sent! We\'ll get back to you soon.');
    } catch (err) {
      console.error('Contact Form Error:', err);
      toast.error(err.response?.data?.msg || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* Intro */}
      <section className="relative overflow-hidden bg-[#f4faf7] border-b border-emerald-100">
        <WaveLines id="contact-hero-waves" color="#34B678" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-24 md:pb-20">
          <Motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#34B678] mb-4">
              <span className="w-8 h-px bg-[#34B678]/50" /> Contact us
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-[#10213D]">
              Talk to a real person at <span className="text-[#34B678]">Velaivaaipu.</span>
            </h1>
            <p className="mt-5 text-zinc-600 text-base md:text-lg leading-relaxed max-w-xl">
              Questions about jobs, hiring, campus drives or your account. Send a message and our Puducherry team replies within one working day.
            </p>
          </Motion.div>
        </div>
      </section>

      {/* Details + form */}
      <section className="relative max-w-6xl mx-auto px-6 -mt-8 md:-mt-10 pb-20">
        <Motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="grid lg:grid-cols-5 rounded-[2rem] bg-white shadow-[0_30px_80px_-30px_rgba(16,33,61,0.25)] ring-1 ring-zinc-100 overflow-hidden"
        >
          {/* Direct contact panel */}
          <aside className="relative lg:col-span-2 overflow-hidden bg-gradient-to-br from-[#3CC283] via-[#34B678] to-[#249a62] p-8 md:p-10 text-white">
            {/* Concentric rings from the bottom-right corner; fixed size, so they never stretch
                with the panel's height the way the wave lines did */}
            <svg className="absolute -right-40 -bottom-40 w-[520px] h-[520px] pointer-events-none" viewBox="0 0 520 520" fill="none" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <circle key={i} cx="260" cy="260" r={60 + i * 26} stroke="#fff" strokeOpacity={0.22 - i * 0.02} strokeWidth="1" />
              ))}
            </svg>
            <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl font-bold tracking-tight">Reach us directly</h2>
              <p className="mt-2 text-white/85 text-sm leading-relaxed">Prefer email or a call? Use whichever is easier for you.</p>

              <ul className="mt-8 space-y-3">
                {[
                  { icon: Mail, label: 'Email', value: EMAIL, href: `mailto:${EMAIL}` },
                  { icon: Phone, label: 'Phone', value: PHONE.label, href: PHONE.href },
                  { icon: MapPin, label: 'Office', value: ADDRESS, href: MAP_LINK, external: true },
                ].map(item => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="group flex items-start gap-4 rounded-2xl bg-white/10 hover:bg-white/15 p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <span className="w-10 h-10 shrink-0 rounded-xl bg-white text-[#249a62] flex items-center justify-center"><item.icon size={18} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-white/70">{item.label}</span>
                        <span className="block text-sm font-semibold leading-relaxed break-words">{item.value}</span>
                      </span>
                      <ArrowUpRight size={16} className="shrink-0 mt-1 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-2xl bg-[#10213D]/15 p-5">
                <p className="flex items-center gap-2 text-sm font-bold"><Clock size={16} /> Office hours</p>
                <dl className="mt-3 space-y-2 text-sm">
                  {HOURS.map(row => (
                    <div key={row.day} className="flex justify-between gap-4">
                      <dt className="text-white/80">{row.day}</dt>
                      <dd className="font-semibold">{row.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-8 flex items-center gap-3">
                {SOCIALS.map(({ label, href, icon: Icon, bg }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Velaivaaipu on ${label}`}
                    className={`w-10 h-10 rounded-xl ${bg} text-white flex items-center justify-center ring-2 ring-white/30 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-white`}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </aside>

          {/* Form */}
          <div className="lg:col-span-3 p-8 md:p-12">
            <AnimatePresence mode="wait">
              {submitted ? (
                <Motion.div
                  key="done"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-start justify-center py-10"
                >
                  <span className="w-16 h-16 rounded-2xl bg-[#34B678]/10 text-[#34B678] flex items-center justify-center mb-6"><CheckCircle2 size={32} /></span>
                  <h3 className="text-3xl font-bold tracking-tight text-[#10213D]">Message sent.</h3>
                  <p className="mt-3 text-zinc-600 leading-relaxed max-w-sm">
                    Thanks, {form.name.split(' ')[0] || 'there'}. We'll reply to <span className="font-semibold text-zinc-800">{form.email}</span> within one working day.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSubmitted(false); setForm(EMPTY_FORM); }}
                    className="mt-8 h-12 px-7 rounded-xl bg-[#10213D] hover:bg-[#0b1830] text-white text-sm font-bold transition-colors cursor-pointer"
                  >
                    Send another message
                  </button>
                </Motion.div>
              ) : (
                <Motion.form key="form" onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6" noValidate>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#10213D]">Send us a message</h2>
                    <p className="mt-1 text-sm text-zinc-500">Fields marked * are required.</p>
                  </div>

                  <fieldset>
                    <legend className="block text-sm font-semibold text-zinc-700 mb-2">I am a</legend>
                    <div className="grid grid-cols-3 gap-2">
                      {SEGMENTS.map(s => {
                        const active = form.segment === s.value;
                        return (
                          <label
                            key={s.value}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 h-auto sm:h-12 py-3 sm:py-0 rounded-xl border text-sm font-semibold cursor-pointer transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#34B678]/20 ${active ? 'border-[#34B678] bg-[#34B678]/10 text-[#1f8a57]' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}
                          >
                            <input
                              type="radio"
                              name="segment"
                              value={s.value}
                              checked={active}
                              onChange={handleChange}
                              onClick={() => active && setForm(prev => ({ ...prev, segment: '' }))}
                              className="sr-only"
                            />
                            <s.icon size={16} /> {s.label}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Full name" required htmlFor="c-name">
                      <input id="c-name" type="text" name="name" autoComplete="name" value={form.name} onChange={handleChange} placeholder="Rahul Sharma" className={inputCls} />
                    </Field>
                    <Field label="Email" required htmlFor="c-email">
                      <input id="c-email" type="email" name="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="rahul@example.com" className={inputCls} />
                    </Field>
                  </div>

                  <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}>
                    <input type="text" name="company_website" tabIndex={-1} autoComplete="off" value={form.company_website} onChange={handleChange} />
                  </div>

                  <Field label="Subject" htmlFor="c-subject">
                    <input id="c-subject" type="text" name="subject" value={form.subject} onChange={handleChange} placeholder="What is this about?" className={inputCls} />
                  </Field>

                  <Field label="Message" required htmlFor="c-message">
                    <textarea id="c-message" name="message" rows={5} value={form.message} onChange={handleChange} placeholder="Tell us a little more…" className={`${inputCls} h-auto py-3 resize-none`} />
                  </Field>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="home-shine relative overflow-hidden h-12 px-8 rounded-xl bg-[#34B678] hover:bg-[#2ca66b] text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-[#34B678]/25 transition disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#34B678]/30"
                    >
                      {submitting
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                        : <><Send size={16} /> Send message</>}
                    </button>
                    <p className="text-xs text-zinc-500">We never share your details. See our <Link to="/privacy-policy" className="underline hover:text-[#34B678]">privacy policy</Link>.</p>
                  </div>
                </Motion.form>
              )}
            </AnimatePresence>
          </div>
        </Motion.div>
      </section>

      {/* FAQ + map */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#34B678] mb-3">
            <span className="w-8 h-px bg-[#34B678]/50" /> Quick answers
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#10213D]">Before you write in</h2>
          <p className="mt-3 text-zinc-600 leading-relaxed">Most questions are answered here. Still stuck? The form above reaches us directly.</p>

          <div className="mt-8 rounded-[1.5rem] overflow-hidden ring-1 ring-zinc-200 bg-zinc-100 aspect-[4/3]">
            <iframe
              title="Velaivaaipu office on Google Maps"
              src={MAP_EMBED}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="lg:col-span-7 lg:pt-10">
          <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <li key={faq.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="w-full flex items-center gap-4 py-5 text-left cursor-pointer group focus-visible:outline-none"
                  >
                    <span className={`flex-1 text-base md:text-lg font-semibold transition-colors ${open ? 'text-[#10213D]' : 'text-zinc-700 group-hover:text-[#10213D]'}`}>{faq.q}</span>
                    <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition group-focus-visible:ring-4 group-focus-visible:ring-[#34B678]/25 ${open ? 'bg-[#34B678] text-white rotate-45' : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200'}`}>
                      <Plus size={18} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <Motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pr-12 text-zinc-600 leading-relaxed">{faq.a}</p>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
