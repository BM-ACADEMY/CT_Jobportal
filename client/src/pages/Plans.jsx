import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';
import PricingCard from '../components/subscription/PricingCard';
import { useAuth } from '../context/AuthContext';
import { PLAN_AUDIENCES, buildPlanFeatures, sortPlans } from '../data/planFeatures';

const API = import.meta.env.VITE_API_BASE_URL;

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
      <section className="relative bg-slate-950 pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-4">Plans</p>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Start free. Pay only for what you use.</h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Every audience has a free plan. The paid plans below are the ones on sale right now, with the same prices you will see at checkout.
          </p>
        </div>
      </section>

      {/* Audience tabs */}
      <section className="max-w-6xl mx-auto px-6 -mt-7 relative z-10">
        <div className="flex flex-wrap justify-center gap-2 bg-white border border-slate-200 shadow-sm p-2" role="tablist" aria-label="Who the plans are for">
          {PLAN_AUDIENCES.map((a) => (
            <button
              key={a.key}
              role="tab"
              aria-selected={audience === a.key}
              onClick={() => pick(a.key)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors border-none cursor-pointer ${
                audience === a.key ? 'bg-slate-900 text-white' : 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        {status === 'loading' && (
          <div className="flex flex-col items-center py-20" role="status">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-semibold m-0">Loading plans…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-20 border border-dashed border-slate-200">
            <p className="text-slate-600 font-semibold m-0">We could not load the plans right now. Please try again in a moment.</p>
          </div>
        )}

        {status === 'ready' && visible.length === 0 && (
          <div className="text-center py-20 border border-dashed border-slate-200">
            <Zap size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-bold m-0">Plans for {current.label.toLowerCase()} are being set up.</p>
            <p className="text-slate-500 text-sm mt-2 m-0">
              You can still <Link to={`/register?role=${current.registerRole}`} className="text-emerald-700 font-bold">create a free account</Link> today.
            </p>
          </div>
        )}

        {status === 'ready' && visible.length > 0 && (
          <>
            {signedInElsewhere && (
              <p className="text-center text-sm text-slate-500 mb-8 m-0">
                You are signed in as a {user.role.replace('_', ' ')}. These plans are for {current.label.toLowerCase()}; your own plans are under{' '}
                <button onClick={() => pick(userAudience || 'jobseeker')} className="text-emerald-700 font-bold bg-transparent border-none p-0 cursor-pointer">your tab</button>.
              </p>
            )}
            <div className={`grid gap-8 ${visible.length === 1 ? 'max-w-sm mx-auto' : visible.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
              {visible.map((plan) => (
                <PricingCard
                  key={plan._id}
                  plan={plan}
                  features={buildPlanFeatures(plan, current.key, globalFeatures)}
                  gstPercentage={gstPercentage}
                  onAction={choose}
                  actionLabel={user && current.roles.includes(user.role) ? 'Go to my plans' : 'Choose plan'}
                />
              ))}
            </div>
            {hasPaid && (
              <p className="text-center text-xs text-slate-500 mt-10 m-0">
                {gstPercentage > 0 ? `Prices are before ${gstPercentage}% GST; the exact total is shown before you pay. ` : ''}
                Payments go through Razorpay. Refunds follow our <Link to="/refund-policy" className="text-emerald-700 font-bold">Refund Policy</Link>.
              </p>
            )}
          </>
        )}
      </section>

      {/* Reassurance */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, title: 'Free to start', desc: 'Searching and applying for jobs, posting within the free limit and running a campus drive cost nothing.' },
            { icon: Zap, title: 'Upgrade when you need it', desc: 'Buy a plan or a single add-on from your dashboard. Your plan can be cancelled from the same page.' },
            { icon: ArrowRight, title: 'Not sure which plan?', desc: 'Write to us from the Contact page and we will point you to the right one.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="border border-slate-200 p-6">
              <Icon size={20} className="text-emerald-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-900 m-0 mb-1">{title}</h3>
              <p className="text-sm text-slate-500 m-0">{desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/contact" className="text-sm font-bold text-emerald-700 hover:underline">Talk to us about plans</Link>
        </div>
      </section>
    </div>
  );
};

export default Plans;
