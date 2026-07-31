import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserCircle, Briefcase, GraduationCap, Building2,
  Search, FileText, MessageSquare, CheckCircle2,
  Send, Users, BarChart2, ShieldCheck,
  QrCode, Award, ArrowRight
} from 'lucide-react';

const ROLE_TABS = [
  { key: 'jobseeker', label: 'Job Seeker', icon: UserCircle },
  { key: 'recruiter', label: 'Recruiter / Company', icon: Briefcase },
  { key: 'college', label: 'College / TPO', icon: GraduationCap },
];

const STEPS = {
  jobseeker: [
    { icon: UserCircle, title: 'Create your profile', desc: 'Sign up free, complete your profile with skills, experience, and resume. A fully completed profile gets matched more accurately and is more visible to recruiters.' },
    { icon: Search, title: 'Discover matching jobs', desc: 'Browse jobs or let our AI matching engine surface roles aligned to your profile. Premium plans unlock deeper, higher-relevance matching (see Terms for details).' },
    { icon: Send, title: 'Apply in one click', desc: 'Apply directly from the platform, track application status in real time, and get notified by email and WhatsApp as recruiters review your application.' },
    { icon: MessageSquare, title: 'Connect with recruiters', desc: 'Premium plans let you message recruiters directly, get interview invites, and access career tools like resume building, interview prep, and salary benchmarking.' },
    { icon: CheckCircle2, title: 'Get hired', desc: 'Receive interview schedules, offer letters, and status updates directly on your dashboard, by email, and via WhatsApp.' },
  ],
  recruiter: [
    { icon: Building2, title: 'Set up your company', desc: 'Create a company profile and choose a subscription or pay-per-feature plan suited to your hiring volume.' },
    { icon: Briefcase, title: 'Post jobs & search candidates', desc: 'Post unlimited or plan-limited job openings and search our candidate database using skills, experience, and location filters.' },
    { icon: Users, title: 'Manage your pipeline', desc: 'Use the ATS pipeline to move candidates through stages, schedule interviews, and message shortlisted candidates in bulk.' },
    { icon: BarChart2, title: 'Track hiring performance', desc: 'Analytics dashboards show funnel conversion, time-to-hire, and channel performance so you can refine your hiring strategy.' },
    { icon: ShieldCheck, title: 'Build your team', desc: 'Invite Employees or Recruiters to your organization, with page-level access controls for delegated Recruiter accounts and full activity visibility for admins.' },
  ],
  college: [
    { icon: GraduationCap, title: 'Register your institution', desc: 'Set up your college profile and get verified by our platform admin team before your placement drives go live to students and companies.' },
    { icon: QrCode, title: 'Launch campus drives', desc: 'Create placement drives, generate registration QR codes/links, and manage student registrations and eligibility criteria.' },
    { icon: Building2, title: 'Invite companies', desc: 'Invite registered companies to participate in your drives via email and WhatsApp, and message them directly to coordinate logistics.' },
    { icon: Users, title: 'Track student progress', desc: 'Verify student IDs, move students through interview rounds, and record placement outcomes for accurate reporting.' },
    { icon: Award, title: 'Report to stakeholders', desc: 'Generate placement reports and share an executive summary with your Principal/Management via a secure passkey link.' },
  ],
};

const HowItWorks = () => {
  const [role, setRole] = useState('jobseeker');
  const activeSteps = STEPS[role];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative bg-slate-950 pt-20 pb-24 px-6 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 mb-6">
            How Velaivaaipu Works
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            One platform, three journeys
          </h1>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Whether you're job hunting, hiring, or managing campus placements, here's exactly how Velaivaaipu takes you from sign-up to outcome.
          </p>
        </div>
      </div>

      {/* Role tabs */}
      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-10 mb-16">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 p-2 flex flex-col sm:flex-row gap-2">
          {ROLE_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setRole(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                role === t.key ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto px-6 pb-24">
        <div className="space-y-6">
          {activeSteps.map((step, i) => (
            <div key={step.title} className="flex gap-5 items-start">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <step.icon size={20} />
                </div>
                {i < activeSteps.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-2" style={{ minHeight: '2rem' }} />}
              </div>
              <div className="pb-8">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Step {i + 1}</p>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            Full details on plans, payments, and platform policies are in our{' '}
            <Link to="/terms" className="font-bold text-emerald-700 hover:underline">Terms & Conditions</Link>.
          </p>
          <Button asChild className="bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold shrink-0">
            <Link to="/register">Get Started <ArrowRight size={16} className="ml-2" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
