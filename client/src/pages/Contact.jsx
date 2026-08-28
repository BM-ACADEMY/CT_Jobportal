import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail, Phone, MapPin, Clock, Send, MessageSquare,
  Briefcase, HeadphonesIcon, CheckCircle2, ArrowRight,
  X, Link2, Camera, HelpCircle, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { motion as Motion } from 'framer-motion';

const CONTACT_CARDS = [
  {
    icon: Mail,
    title: 'Email Us',
    desc: 'We typically reply within 24 hours.',
    value: 'support@velaivaaipu.in',
    color: 'text-[#00D492]',
    bg: 'bg-[#00D492]/10',
  },
  {
    icon: Phone,
    title: 'Call Us',
    desc: 'Mon–Fri, 9 AM to 6 PM IST.',
    value: '+91 99445 09441',
    color: 'text-[#00D492]',
    bg: 'bg-[#00D492]/10',
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    desc: 'Come say hello at our office.',
    value: 'Chennai, Tamil Nadu, India',
    color: 'text-[#00D492]',
    bg: 'bg-[#00D492]/10',
  },
];

const FAQS = [
  { 
    q: 'How do I post a job on Velaivaaipu?', 
    a: 'Register or log in as a company or recruiter, then go to your dashboard and click "Post a Job". Fill in the details and your listing goes live instantly.',
    icon: Briefcase
  },
  { 
    q: 'Is it free to create a job seeker account?', 
    a: 'Yes! Creating a job seeker account is completely free. We also offer premium subscription plans with advanced features for faster job discovery.',
    icon: HelpCircle
  },
  { 
    q: 'How do subscription plans work?', 
    a: 'Subscription plans unlock premium features like resume builder, profile boost, direct messaging with recruiters, and career counselling. Plans are billed monthly, quarterly, or yearly.',
    icon: Clock
  },
  { 
    q: 'How can I contact a recruiter directly?', 
    a: 'With a premium subscription, you can message recruiters directly from their job listings or company profiles. Upgrade your plan to unlock this feature.',
    icon: MessageSquare
  },
  { 
    q: 'How do I reset my password?', 
    a: 'Click "Forgot Password" on the login page. We\'ll send a reset link to your registered email within a few minutes.',
    icon: HeadphonesIcon
  },
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
    <div className="min-h-screen bg-zinc-100/60">

      {/* Hero section with clean light office background image and soft black overlay */}
      <div className="bg-zinc-950 py-24 px-6 relative overflow-hidden border-b border-zinc-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.4]"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1740560051533-3acef26ace95?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y29udGFjdCUyMHVzfGVufDB8fDB8fHww")' }}
        />
        {/* Light black overlay */}
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <MessageSquare size={13} className="text-[#00D492]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">Get in Touch</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
              How Can We <span className="text-[#00D492]">Help You?</span>
            </h1>
            <p className="text-zinc-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed font-normal">
              Our team is ready to assist you with any questions about jobs, subscriptions, or your account.
            </p>
          </Motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {CONTACT_CARDS.map((card, i) => (
            <Motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-zinc-50 border border-zinc-300 shadow-md shadow-zinc-200/50 p-6 flex items-start gap-5 hover:shadow-lg transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon size={22} className={card.color} />
              </div>
              <div>
                <p className="font-bold text-zinc-800 mb-0.5">{card.title}</p>
                <p className="text-zinc-400 text-xs font-semibold mb-2">{card.desc}</p>
                <p className="text-sm font-bold text-zinc-950">{card.value}</p>
              </div>
            </Motion.div>
          ))}
        </div>

        {/* Main: Form + Info */}
        <div className="grid lg:grid-cols-5 gap-10 mb-20">

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-zinc-50 border border-zinc-300 shadow-md shadow-zinc-200/50 rounded-2xl p-8">
              {submitted ? (
                <Motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-10"
                >
                  <div className="w-20 h-20 bg-[#00D492]/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={36} className="text-[#00D492]" />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-3">Message Sent!</h3>
                  <p className="text-zinc-500 font-medium mb-8 max-w-xs leading-relaxed">
                    Thank you for reaching out. Our team will reply to your email within 24 hours.
                  </p>
                  <Button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="h-11 px-8 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold cursor-pointer"
                  >
                    Send Another Message
                  </Button>
                </Motion.div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">Send a Message</h2>
                    <p className="text-zinc-500 text-sm font-semibold">Fill the form below and we'll get back to you shortly.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Rahul Sharma"
                          className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-850 font-medium text-sm outline-none focus:border-[#00D492] focus:ring-4 focus:ring-[#00D492]/10 transition-all placeholder:text-zinc-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="rahul@example.com"
                          className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-850 font-medium text-sm outline-none focus:border-[#00D492] focus:ring-4 focus:ring-[#00D492]/10 transition-all placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        placeholder="How can we help?"
                        className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-850 font-medium text-sm outline-none focus:border-[#00D492] focus:ring-4 focus:ring-[#00D492]/10 transition-all placeholder:text-zinc-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                        Message <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Tell us more about your query..."
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-850 font-medium text-sm outline-none focus:border-[#00D492] focus:ring-4 focus:ring-[#00D492]/10 transition-all placeholder:text-zinc-400 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="h-12 w-full rounded-xl bg-[#00D492] hover:bg-[#00b87d] text-white font-bold text-sm shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</span>
                      ) : (
                        <span className="flex items-center gap-2 justify-center"><Send size={16} /> Send Message</span>
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
            <div className="bg-zinc-50 rounded-2xl border border-zinc-300 shadow-md shadow-zinc-200/50 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-zinc-800 text-sm">Office Hours</p>
                  <p className="text-zinc-400 text-xs font-semibold">When we're available</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { day: 'Monday – Friday', time: '9:00 AM – 6:00 PM' },
                  { day: 'Saturday', time: '10:00 AM – 2:00 PM' },
                  { day: 'Sunday', time: 'Closed' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-zinc-50 last:border-0">
                    <span className="text-zinc-650 text-sm font-medium">{row.day}</span>
                    <span className={`text-sm font-bold ${row.time === 'Closed' ? 'text-red-400' : 'text-zinc-800'}`}>{row.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Types */}
            <div className="bg-zinc-50 rounded-2xl border border-zinc-300 shadow-md shadow-zinc-200/50 p-6">
              <p className="font-bold text-zinc-800 text-sm mb-5">What We Can Help With</p>
              <div className="space-y-4">
                {[
                  { icon: Briefcase, label: 'Job Search Assistance', color: 'text-[#00D492]', bg: 'bg-[#00D492]/10' },
                  { icon: HeadphonesIcon, label: 'Account & Technical Support', color: 'text-[#00D492]', bg: 'bg-[#00D492]/10' },
                  { icon: MessageSquare, label: 'Subscription & Billing', color: 'text-[#00D492]', bg: 'bg-[#00D492]/10' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                      <item.icon size={16} className={item.color} />
                    </div>
                    <span className="text-zinc-700 text-sm font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-zinc-50 border border-zinc-300 shadow-md shadow-zinc-200/50 rounded-2xl p-6">
              <p className="font-bold text-zinc-800 text-sm mb-2">Follow Us</p>
              <p className="text-zinc-400 text-xs font-semibold mb-5">Stay updated with job alerts and career tips.</p>
              <div className="flex gap-3">
                {[
                  { icon: X, label: 'Twitter / X' },
                  { icon: Link2, label: 'LinkedIn' },
                  { icon: Camera, label: 'Instagram' },
                ].map((s, i) => (
                  <button key={i} className="w-10 h-10 rounded-xl bg-zinc-200/60 hover:bg-[#00D492] hover:text-white flex items-center justify-center text-zinc-650 transition-all cursor-pointer" aria-label={s.label}>
                    <s.icon size={17} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section: Untitled UI Style */}
        <div className="bg-zinc-50 rounded-2xl border border-zinc-300 shadow-md shadow-zinc-200/50 p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-3">Frequently Asked Questions</h2>
            <p className="text-zinc-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              These are the most commonly asked questions about Velaivaaipu. Can't find what you're looking for? Contact our support team above.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto divide-y divide-zinc-200">
            {FAQS.map((faq, i) => (
              <div key={i} className="py-5">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center gap-4 text-left hover:text-[#00D492] transition-colors cursor-pointer group"
                >
                  {/* Left Icon Badge */}
                  <div className="w-10 h-10 rounded-xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-500 shrink-0 shadow-sm group-hover:border-[#00D492] group-hover:text-[#00D492] transition-all">
                    <faq.icon size={18} className="stroke-[1.5]" />
                  </div>
                  
                  <span className="font-semibold text-zinc-850 text-sm md:text-base flex-1 pr-4">{faq.q}</span>
                  
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-[#00D492] transition-colors">
                    <ChevronDown size={18} className={`transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-[#00D492]' : ''}`} />
                  </div>
                </button>
                {openFaq === i && (
                  <Motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pl-14 pr-8 mt-3"
                  >
                    <p className="text-zinc-500 text-sm md:text-[14.5px] leading-relaxed pt-1">{faq.a}</p>
                  </Motion.div>
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
