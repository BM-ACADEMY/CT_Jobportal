import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, ShieldCheck, TrendingUp, Users, CheckCircle2, Award, Briefcase, Clock, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const API = import.meta.env.VITE_API_BASE_URL;
const sessionKey = (passkey) => `principal_access_${passkey}`;

const PrincipalExecutiveSummary = () => {
  const { passkey } = useParams();
  const [data, setData] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem(sessionKey(passkey));
    if (stored) {
      attemptVerify(stored, { silent: true });
    } else {
      setLoadingInitial(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passkey]);

  const attemptVerify = async (codeToTry, { silent = false } = {}) => {
    if (!silent) setVerifying(true);
    setAuthError('');
    try {
      const res = await axios.post(`${API}/college/public/principal-report/${passkey}`, { code: codeToTry });
      setData(res.data);
      sessionStorage.setItem(sessionKey(passkey), codeToTry);
    } catch (err) {
      if (err.response?.status === 404) {
        setLinkInvalid(true);
      } else if (silent) {
        // A remembered code from a previous visit is now stale (TPO rotated it) — clear it
        // quietly and just show the empty entry gate instead of flashing an error on load.
        sessionStorage.removeItem(sessionKey(passkey));
      } else {
        setAuthError(err.response?.data?.msg || 'Unauthorized: incorrect access code.');
      }
    } finally {
      setVerifying(false);
      setLoadingInitial(false);
    }
  };

  const handleSubmitCode = () => {
    if (code.length !== 4) {
      setAuthError('Enter the 4-digit code shared by your TPO.');
      return;
    }
    attemptVerify(code);
  };

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (linkInvalid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-center p-6 text-white">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
          <GraduationCap size={32} />
        </div>
        <h1 className="text-xl font-black mb-2">Executive Report Unavailable</h1>
        <p className="text-sm text-slate-400 max-w-md">Invalid executive link. Ask your TPO for the correct link.</p>
      </div>
    );
  }

  if (!data) {
    // Link is valid, but the 4-digit access code hasn't been entered/verified yet — link alone doesn't grant access.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-center p-6 text-white">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-xl font-black mb-2">Enter Access Code</h1>
        <p className="text-sm text-slate-400 max-w-md mb-8">
          Enter the 4-digit code shared with you by your college TPO to view the executive placement dashboard.
        </p>

        <InputOTP maxLength={4} value={code} onChange={setCode} onComplete={handleSubmitCode}>
          <InputOTPGroup className="gap-3">
            {[0, 1, 2, 3].map(i => (
              <InputOTPSlot key={i} index={i} className="h-14 w-12 rounded-xl border-slate-700 bg-slate-900 text-white font-black text-xl" />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {authError && <p className="text-sm text-red-400 font-bold mt-4">{authError}</p>}

        <Button
          disabled={verifying || code.length !== 4}
          onClick={handleSubmitCode}
          className="mt-6 h-12 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm"
        >
          {verifying ? 'Verifying...' : 'Unlock Dashboard'}
        </Button>
      </div>
    );
  }

  const { college, stats, totalStudents, highestLPA, averageLPA, deptCounts } = data;
  const successRate = totalStudents > 0 ? Math.round((stats.placed / totalStudents) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16 animate-in fade-in duration-700">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 pt-10 pb-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {college.logo ? (
              <img src={college.logo.startsWith('http') ? college.logo : `${import.meta.env.VITE_API_DOMAIN}${college.logo}`} alt="" className="w-16 h-16 rounded-2xl object-cover bg-white p-1 border-2 border-emerald-500 shadow-xl" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 font-black text-2xl">
                {college.code?.[0] || 'C'}
              </div>
            )}
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 mb-1">
                Executive Live Summary
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{college.name}</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {college.principalName ? `Principal Executive Portal • ${college.principalName}` : 'Principal & Management Executive Portal'} • Real-time Data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Overall Success Rate</p>
              <p className="text-3xl font-black text-emerald-400 tracking-tight">{successRate}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Students</p>
            <p className="text-3xl font-black text-white">{totalStudents}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1"><Users size={12} /> Registered in Campus</p>
          </div>
          <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Placed Offers</p>
            <p className="text-3xl font-black text-emerald-400">{stats.placed}</p>
            <p className="text-xs text-emerald-500/80 mt-1 font-medium flex items-center gap-1"><CheckCircle2 size={12} /> Successfully Placed</p>
          </div>
          <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Highest Package</p>
            <p className="text-3xl font-black text-blue-400">{highestLPA > 0 ? `₹${highestLPA} LPA` : '—'}</p>
            <p className="text-xs text-blue-500/80 mt-1 font-medium flex items-center gap-1"><Award size={12} /> Top Salary Offer</p>
          </div>
          <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Average Package</p>
            <p className="text-3xl font-black text-purple-400">{averageLPA > 0 ? `₹${averageLPA} LPA` : '—'}</p>
            <p className="text-xs text-purple-500/80 mt-1 font-medium flex items-center gap-1"><Briefcase size={12} /> Across Placed Pool</p>
          </div>
        </div>

        {/* Pipeline & Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800/80 shadow-md space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Clock size={16} className="text-blue-400" /> Current Placement Pipeline
            </h3>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Active / Applied for Drives</span>
                <span className="text-sm font-black text-white bg-slate-800 px-3 py-1 rounded-lg">{stats.applied + stats.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Shortlisted / Interviewing</span>
                <span className="text-sm font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">{stats.interviewing + stats.shortlisted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Confirmed Offers (Placed)</span>
                <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{stats.placed}</span>
              </div>
              <div className="flex items-center justify-between opacity-60">
                <span className="text-sm font-semibold text-slate-400">Unplaced / Seeking Opportunity</span>
                <span className="text-sm font-bold text-slate-400">{totalStudents - stats.placed - (stats.opted_out || 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800/80 shadow-md space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <BarChart2 size={16} className="text-emerald-400" /> Department Breakdown
            </h3>
            {deptCounts?.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-4">No department records yet.</p>
            ) : (
              <div className="space-y-3 pt-1 max-h-60 overflow-y-auto pr-2">
                {deptCounts.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">{item._id.dept || 'General'} <span className="text-[10px] text-slate-500 uppercase">({item._id.status})</span></span>
                    <span className="font-black text-emerald-400 bg-slate-800/80 px-2.5 py-1 rounded-md">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalExecutiveSummary;
