import React, { useState } from 'react';
import { Star, Calendar, Clock, Video, CheckCircle2, Send, Loader2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;

const BookingForm = ({ onSuccess, sessionsLeft, unlimited }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    bookingName: user?.name || '',
    bookingEmail: user?.email || '',
    bookingPhone: '',
    bookingDate: '',
    bookingTime: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { bookingName, bookingEmail, bookingPhone, bookingDate, bookingTime } = form;
    if (!bookingName || !bookingEmail || !bookingDate || !bookingTime) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/requests/counselling`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bName" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Full Name *</Label>
          <Input id="bName" value={form.bookingName} onChange={e => set('bookingName', e.target.value)}
            placeholder="Your name" className="rounded-xl border-slate-200 focus:border-rose-400 text-sm" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bEmail" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Email *</Label>
          <Input id="bEmail" type="email" value={form.bookingEmail} onChange={e => set('bookingEmail', e.target.value)}
            placeholder="your@email.com" className="rounded-xl border-slate-200 focus:border-rose-400 text-sm" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bPhone" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Phone</Label>
          <Input id="bPhone" value={form.bookingPhone} onChange={e => set('bookingPhone', e.target.value)}
            placeholder="+91 98765 43210" className="rounded-xl border-slate-200 focus:border-rose-400 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bDate" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Preferred Date *</Label>
          <Input id="bDate" type="date" value={form.bookingDate} onChange={e => set('bookingDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="rounded-xl border-slate-200 focus:border-rose-400 text-sm" required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="bTime" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Preferred Time *</Label>
          <Input id="bTime" type="time" value={form.bookingTime} onChange={e => set('bookingTime', e.target.value)}
            className="rounded-xl border-slate-200 focus:border-rose-400 text-sm" required />
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <AlertCircle size={13} className="shrink-0" /> {error}
        </p>
      )}

      <Button type="submit" disabled={loading}
        className="w-full h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm gap-2 shadow-md shadow-rose-500/20">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Booking…</> : <><Send size={15} /> Book Session</>}
      </Button>

      {!unlimited && (
        <p className="text-[11px] text-center text-slate-400 font-medium">
          {sessionsLeft} session{sessionsLeft !== 1 ? 's' : ''} remaining on your plan
        </p>
      )}
    </form>
  );
};

const LimitReached = () => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <AlertCircle size={24} className="text-amber-600" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">Session Limit Reached</h3>
    <p className="text-sm text-slate-500 mb-6 max-w-sm leading-relaxed">
      You've used all your career counselling sessions on this plan. Upgrade to book more sessions with our experts.
    </p>
    <Link to="/jobseeker/subscription">
      <Button className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm gap-2 shadow-md shadow-emerald-500/20">
        <Sparkles size={14} /> Upgrade Plan <ArrowRight size={13} />
      </Button>
    </Link>
  </div>
);

const SuccessView = ({ onBook }) => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <CheckCircle2 size={24} className="text-emerald-600" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">Session Booked!</h3>
    <p className="text-sm text-slate-500 mb-6 max-w-sm leading-relaxed">
      Your career counselling session request has been received. Our team will confirm via email shortly.
    </p>
    <Button variant="outline" onClick={onBook} className="rounded-xl h-10 px-6 text-sm font-bold">
      Book Another Session
    </Button>
  </div>
);

const CareerCounselling = () => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const limit = user?.subscription?.careerCounsellingCount ?? 0;
  const unlimited = limit === 0;
  const sessionsUsed = user?.counsellingSessionsUsed ?? 0;
  const sessionsLeft = unlimited ? Infinity : limit - sessionsUsed;
  const atLimit = !unlimited && sessionsUsed >= limit;

  return (
    <FeatureGate
      featureKey="hasCareerCounselling"
      featureName="Career Counselling"
      description="Book 1-on-1 sessions with industry experts for career guidance, salary negotiation, and growth roadmapping."
      subscriptionPath="/jobseeker/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <Star size={16} className="text-rose-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Career Counselling</h1>
            </div>
            <p className="text-sm text-slate-500">Expert 1-on-1 sessions to accelerate your career.</p>
          </div>
          <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-center shrink-0">
            <p className="text-lg font-bold text-rose-700">{unlimited ? '∞' : sessionsLeft > 0 ? sessionsLeft : 0}</p>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Sessions Left</p>
          </div>
        </div>

        {/* Perks */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Video, label: 'Video Sessions', desc: 'HD video + screen share' },
            { icon: Clock, label: '45 Min / Session', desc: 'Deep-dive career talks' },
            { icon: Calendar, label: 'Flexible Booking', desc: 'Pick your time slot' },
          ].map(p => (
            <div key={p.label} className="rounded-xl border border-slate-100 bg-white p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center shrink-0">
                <p.icon size={15} className="text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{p.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Booking form / limit / success */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          {submitted ? (
            <SuccessView onBook={() => setSubmitted(false)} />
          ) : atLimit ? (
            <LimitReached />
          ) : (
            <>
              <h3 className="text-sm font-bold text-slate-900 mb-5">Book a Session</h3>
              <BookingForm onSuccess={() => setSubmitted(true)} sessionsLeft={sessionsLeft} unlimited={unlimited} />
            </>
          )}
        </div>
      </div>
    </FeatureGate>
  );
};

export default CareerCounselling;
