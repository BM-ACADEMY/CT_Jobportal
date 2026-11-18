import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, MessageCircle, ArrowRight, UserRound, Users, Building2, GraduationCap } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';
import WaveLines from '@/components/common/WaveLines';
import Footer from '@/components/home/Footer';
import PricingCard from '../components/subscription/PricingCard';
import { useAuth } from '../context/AuthContext';
import { PLAN_AUDIENCES, buildPlanFeatures, sortPlans } from '../data/planFeatures';

const API = import.meta.env.VITE_API_BASE_URL;
const EASE = [0.22, 1, 0.36, 1];
const AUDIENCE_META = {
  jobseeker: { icon: UserRound, hint: 'Find a job and get hired' },
  recruiter: { icon: Users, hint: 'Hire for your clients' },
  company: { icon: Building2, hint: 'Hire for your own team' },
  college: { icon: GraduationCap, hint: 'Run campus placements' },
};

const REASSURANCE = [
  { icon: ShieldCheck, title: 'Free to start', desc: 'Searching and applying for jobs, posting within the free limit and running a campus drive cost nothing.' },
  { icon: Zap, title: 'Upgrade when you need it', desc: 'Buy a plan or a single add-on from your dashboard. You can cancel from the same page.' },
  { icon: MessageCircle, title: 'Not sure which plan?', desc: 'Tell us what you need and we will point you to the right one.' },
];

// Public plans page. Every price, limit and feature comes from the plans the admin created
// (GET /subscriptions); nothing here is hard-coded, so the page can never show a plan that
// is not for sale. Empty audiences say so instead of showing placeholder prices.
const Plans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [globalFeatures, setGlobalFeatures] = useState([]);
  const [gstPercentage, setGstPercentage] = useState(0);
  // Server switch PAYMENTS_ENABLED: until Razorpay approves the live account, paid plans show "Opening soon".
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const requested = searchParams.get('for');
  const userAudience = PLAN_AUDIENCES.find((a) => a.roles.includes(user?.role))?.key;
  const [audience, setAudience] = useState(
    PLAN_AUDIENCES.some((a) => a.key === requested) ? requested : (userAudience || 'jobseeker')
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      axios.get(`${API}/subscriptions`),
      axios.get(`${API}/subscriptions/features`).catch(() => ({ data: [] })),
      axios.get(`${API}/settings`).catch(() => ({ data: {} })),
    ]).then(([plansRes, featuresRes, settingsRes]) => {
      if (cancelled) return;
      setPlans((plansRes.data || []).filter((p) => p.isActive));
      setGlobalFeatures(featuresRes.data || []);
      setGstPercentage(Number(settingsRes.data?.gstPercentage) || 0);
      setPaymentsEnabled(settingsRes.data?.paymentsEnabled === true);
      setStatus('ready');
    }).catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  const current = PLAN_AUDIENCES.find((a) => a.key === audience) || PLAN_AUDIENCES[0];
  const visible = useMemo(() => sortPlans(plans.filter((p) => p.role === current.key)), [plans, current.key]);
  const hasPaid = visible.some((p) => p.price > 0 && !p.isCustomPrice);

  const pick = (key) => {
    setAudience(key);
    setSearchParams(key === 'jobseeker' ? {} : { for: key }, { replace: true });
  };

  // Signed in as this audience: go to the real checkout page. Otherwise register for that role.
  const choose = () => {
    if (user && current.roles.includes(user.role)) {
      navigate(current.subscriptionPath);
      return;
    }
    navigate(`/register?role=${current.registerRole}`);
  };

  const signedInElsewhere = user && !current.roles.includes(user.role);

  return (
    <div className="bg-white">
      <SEOHead
        title="Plans and Pricing for Job Seekers, Companies and Colleges | Velaivaaipu"
        description="Start free. See what each Velaivaaipu plan includes for students and job seekers, recruiters, companies and colleges in Tamil Nadu and Puducherry. Prices in rupees, GST shown before you pay."
        path="/plans"
      />

      {/* Header */}
      <section className="relative overflow-hidden bg-[#f4faf7] border-b border-emerald-100 px-6 pt-20 md:pt-24 pb-28 md:pb-32">
        <WaveLines id="plans-hero-waves" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#34B678] mb-4">
            <span className="w-8 h-px bg-[#34B678]/50" /> Plans &amp; pricing <span className="w-8 h-px bg-[#34B678]/50" />
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-[#10213D]">
            Start free. <span className="text-[#34B678]">Pay only</span> for what you use.
          </h1>
          <p className="mt-5 text-zinc-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Every audience has a free plan. The paid plans below are the ones on sale right now, at the same prices you will see at checkout.
          </p>
        </motion.div>
      </section>

      {/* Audience switch */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 -mt-12">
        <p className="sr-only" id="plans-audience-label">Who the plans are for</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="tablist" aria-labelledby="plans-audience-label">
            {PLAN_AUDIENCES.map((a) => {
              const active = audience === a.key;
              const { icon: Icon, hint } = AUDIENCE_META[a.key] || AUDIENCE_META.jobseeker;
              return (
                <button
                  key={a.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => pick(a.key)}
                  className={`group relative text-left rounded-2xl p-4 sm:p-5 bg-white border-2 border-solid cursor-pointer transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#34B678]/30 ${
                    active
                      ? 'border-[#34B678] shadow-[0_24px_50px_-24px_rgba(52,182,120,0.55)]'
                      : 'border-zinc-200 hover:border-[#34B678]/50 shadow-[0_12px_30px_-24px_rgba(16,33,61,0.4)]'
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${active ? 'bg-[#34B678] text-white' : 'bg-[#34B678]/10 text-[#34B678]'}`}>
                      <Icon size={19} />
                    </span>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${active ? 'border-[#34B678]' : 'border-zinc-300 group-hover:border-zinc-400'}`}>
                      {active && <span className="w-2.5 h-2.5 rounded-full bg-[#34B678]" />}
                    </span>
                  </span>
                  <span className="mt-4 block text-sm sm:text-base font-bold text-[#10213D] leading-snug">{a.label}</span>
                  <span className="mt-0.5 block text-xs sm:text-sm text-zinc-500">{hint}</span>
                </button>
              );
            })}
          </div>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-10">
        {status === 'loading' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-label="Loading plans">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[460px] rounded-[1.75rem] bg-zinc-100 animate-pulse" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-16 rounded-[1.75rem] border border-dashed border-zinc-300">
            <p className="text-zinc-700 font-semibold m-0">We could not load the plans right now. Please try again in a moment.</p>
          </div>
        )}

        {status === 'ready' && visible.length === 0 && (
          <div className="text-center py-16 rounded-[1.75rem] bg-[#f4faf7] ring-1 ring-emerald-100">
            <span className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white text-[#34B678] flex items-center justify-center shadow-sm"><Zap size={22} /></span>
            <p className="text-[#10213D] text-lg font-bold m-0">Plans for {current.label.toLowerCase()} are being set up.</p>
            <p className="text-zinc-600 text-sm mt-2 m-0">
              You can still <Link to={`/register?role=${current.registerRole}`} className="text-[#34B678] font-bold hover:underline">create a free account</Link> today.
            </p>
          </div>
        )}

        {status === 'ready' && visible.length > 0 && (
          <>
            {signedInElsewhere && (
              <p className="text-center text-sm text-zinc-500 mb-8 m-0">
                You are signed in as a {user.role.replace('_', ' ')}. These plans are for {current.label.toLowerCase()}; your own plans are under{' '}
                <button onClick={() => pick(userAudience || 'jobseeker')} className="text-[#34B678] font-bold bg-transparent border-none p-0 cursor-pointer hover:underline">your tab</button>.
              </p>
            )}
            <motion.div
              key={current.key}
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
              className={`grid gap-6 lg:gap-8 items-stretch ${visible.length === 1 ? 'max-w-sm mx-auto' : visible.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}
            >
              {visible.map((plan) => (
                <motion.div key={plan._id} className="h-full" variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}>
                  <PricingCard
                    plan={plan}
                    features={buildPlanFeatures(plan, current.key, globalFeatures)}
                    gstPercentage={gstPercentage}
                    paymentsEnabled={paymentsEnabled}
                    onAction={choose}
                    actionLabel={user && current.roles.includes(user.role) ? 'Go to my plans' : 'Choose plan'}
                  />
                </motion.div>
              ))}
            </motion.div>
            {hasPaid && !paymentsEnabled && (
              <p className="mx-auto max-w-2xl text-center text-sm text-[#10213D] bg-[#f4faf7] ring-1 ring-emerald-100 rounded-xl px-4 py-3 mt-10 m-0">
                Paid plans open soon, once online payments are switched on. Free plans are available today.
              </p>
            )}
            {hasPaid && paymentsEnabled && (
              <p className="text-center text-xs text-zinc-500 mt-10 m-0">
                {gstPercentage > 0 ? `Prices are before ${gstPercentage}% GST; the exact total is shown before you pay. ` : ''}
                Payments go through Razorpay. Refunds follow our <Link to="/refund-policy" className="text-[#34B678] font-bold hover:underline">Refund Policy</Link>.
              </p>
            )}
          </>
        )}
      </section>

      {/* Reassurance */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          {REASSURANCE.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-[1.5rem] bg-white ring-1 ring-zinc-200 p-6">
              <span className="w-11 h-11 rounded-xl bg-[#34B678]/10 text-[#34B678] flex items-center justify-center mb-4"><Icon size={20} /></span>
              <h3 className="text-base font-bold text-[#10213D] m-0 mb-1.5">{title}</h3>
              <p className="text-sm text-zinc-600 leading-relaxed m-0">{desc}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#3CC283] via-[#34B678] to-[#249a62] px-8 py-10 md:px-12 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <WaveLines id="plans-cta-waves" color="#fff" />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white m-0">Need a plan for your team or college?</h2>
            <p className="mt-2 text-white/90 m-0">Tell us how many people will use it and we will suggest the right fit.</p>
          </div>
          <Link
            to="/contact"
            className="relative shrink-0 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-[#10213D] hover:bg-[#0b1830] text-white text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            Talk to us <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Plans;
