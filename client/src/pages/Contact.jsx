import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail, Phone, MapPin, Clock, Send, MessageSquare,
  Briefcase, HeadphonesIcon, CheckCircle2, ArrowRight,
  X, Link2, Camera
} from 'lucide-react';
import { toast } from 'sonner';

const CONTACT_CARDS = [
  {
    icon: Mail,
    title: 'Email Us',
    desc: 'We typically reply within 24 hours.',
    value: 'support@careerpoint.in',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Phone,
    title: 'Call Us',
    desc: 'Mon–Fri, 9 AM to 6 PM IST.',
    value: '+91 98765 43210',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    desc: 'Come say hello at our office.',
    value: 'Chennai, Tamil Nadu, India',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
];

const FAQS = [
  { q: 'How do I post a job on CareerPoint?', a: 'Register or log in as a company or recruiter, then go to your dashboard and click "Post a Job". Fill in the details and your listing goes live instantly.' },
  { q: 'Is it free to create a job seeker account?', a: 'Yes! Creating a job seeker account is completely free. We also offer premium subscription plans with advanced features for faster job discovery.' },
  { q: 'How do subscription plans work?', a: 'Subscription plans unlock premium features like resume builder, profile boost, direct messaging with recruiters, and career counselling. Plans are billed monthly, quarterly, or yearly.' },
  { q: 'How can I contact a recruiter directly?', a: 'With a premium subscription, you can message recruiters directly from their job listings or company profiles. Upgrade your plan to unlock this feature.' },
  { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page. We\'ll send a reset link to your registered email within a few minutes.' },
];

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
    toast.success('Message sent! We\'ll get back to you soon.');
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950 pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px] -ml-24 -mb-24 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-5 py-2 mb-6">
              <MessageSquare size={14} className="text-violet-400" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-violet-400">Get in Touch</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              How Can We{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">Help You?</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto">
              Our team is ready to assist you with any questions about jobs, subscriptions, or your account.
            </p>
          </motion.div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 60H1440V30C1200 60 960 0 720 30C480 60 240 0 0 30V60Z" fill="#f8fafc" />
          </svg>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-24">

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 -mt-2">
          {CONTACT_CARDS.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-start gap-5 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon size={22} className={card.color} />
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-0.5">{card.title}</p>
                <p className="text-slate-400 text-xs font-medium mb-2">{card.desc}</p>
                <p className={`text-sm font-bold ${card.color}`}>{card.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main: Form + Info */}
        <div className="grid lg:grid-cols-5 gap-10 mb-20">

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-10"
                >
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={36} className="text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Message Sent!</h3>
                  <p className="text-slate-500 font-medium mb-8 max-w-xs">
                    Thank you for reaching out. Our team will reply to your email within 24 hours.
                  </p>
                  <Button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    variant="outline"
                    className="h-11 px-8 rounded-xl border-slate-200 text-slate-700 font-bold hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    Send Another Message
                  </Button>
                </motion.div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Send a Message</h2>
                    <p className="text-slate-500 text-sm font-medium">Fill the form below and we'll get back to you shortly.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Rahul Sharma"
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="rahul@example.com"
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        placeholder="How can we help?"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                        Message <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Tell us more about your query..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-slate-400 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="h-13 w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-lg shadow-violet-500/20 transition-all disabled:opacity-60"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</span>
                      ) : (
                        <span className="flex items-center gap-2"><Send size={16} /> Send Message</span>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Office Hours */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Office Hours</p>
                  <p className="text-slate-400 text-xs font-medium">When we're available</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { day: 'Monday – Friday', time: '9:00 AM – 6:00 PM' },
                  { day: 'Saturday', time: '10:00 AM – 2:00 PM' },
                  { day: 'Sunday', time: 'Closed' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                    <span className="text-slate-600 text-sm font-medium">{row.day}</span>
                    <span className={`text-sm font-bold ${row.time === 'Closed' ? 'text-red-400' : 'text-slate-900'}`}>{row.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Types */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <p className="font-bold text-slate-900 text-sm mb-5">What We Can Help With</p>
              <div className="space-y-4">
                {[
                  { icon: Briefcase, label: 'Job Search Assistance', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { icon: HeadphonesIcon, label: 'Account & Technical Support', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { icon: MessageSquare, label: 'Subscription & Billing', color: 'text-violet-600', bg: 'bg-violet-50' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                      <item.icon size={16} className={item.color} />
                    </div>
                    <span className="text-slate-700 text-sm font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social */}
            <div className="bg-slate-900 rounded-2xl p-6">
              <p className="font-bold text-white text-sm mb-2">Follow Us</p>
              <p className="text-slate-500 text-xs font-medium mb-5">Stay updated with job alerts and career tips.</p>
              <div className="flex gap-3">
                {[
                  { icon: X, label: 'Twitter / X' },
                  { icon: Link2, label: 'LinkedIn' },
                  { icon: Camera, label: 'Instagram' },
                ].map((s, i) => (
                  <button key={i} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" aria-label={s.label}>
                    <s.icon size={17} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-sm font-medium">Quick answers to common questions.</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 text-sm pr-4">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${openFaq === i ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400'}`}>
                    <ArrowRight size={14} className={`transition-transform duration-300 ${openFaq === i ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-slate-500 text-sm font-medium leading-relaxed border-t border-slate-50 pt-4">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
