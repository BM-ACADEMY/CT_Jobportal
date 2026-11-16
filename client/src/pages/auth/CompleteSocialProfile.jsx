import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Briefcase, UserSearch, Building2, GraduationCap, Lock } from 'lucide-react';
import {
  AuthShell, AuthPanel, PanelPoints, PanelImage, AuthHeading, AuthAlert, SubmitButton, EyeToggle,
  inputCls, labelCls,
} from '@/components/auth/AuthShell';

const ROLES = [
  { key: 'jobseeker', label: 'Job seeker', Icon: Briefcase },
  { key: 'recruiter', label: 'Recruiter', Icon: UserSearch },
  { key: 'company', label: 'Company', Icon: Building2 },
  { key: 'college', label: 'College', Icon: GraduationCap },
];

const CompleteSocialProfile = () => {
  const { completeSocialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const token = location.state?.token || localStorage.getItem('token');

  const [role, setRole] = useState('jobseeker');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // The signed-in token identifies the account; no user id is sent from the client.
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/complete-social-profile`, {
        role,
        password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { user, token: newToken } = res.data;
      const result = await completeSocialLogin(newToken, user);
      if (result.success) {
        navigate(result.redirect);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      id="complete-profile"
      panel={
        <AuthPanel eyebrow="Almost there" title="Two quick details and you're in.">
          <PanelPoints points={['Tell us who you are', 'Set a password for email sign-in']} />
          <PanelImage src="/images/gir-large.png" />
        </AuthPanel>
      }
    >
      <AuthHeading title="Finish your account">Choose your account type and set a password.</AuthHeading>
      <AuthAlert>{error}</AuthAlert>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <span className={labelCls}>I am a</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-xl bg-zinc-100 p-1" role="radiogroup" aria-label="Account type">
            {ROLES.map(({ key, label, Icon }) => {
              const active = role === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setRole(key)}
                  className={`h-10 rounded-lg text-[13px] flex items-center justify-center gap-1.5 border-none cursor-pointer transition ${active ? 'bg-white text-[#10213D] font-bold shadow-sm' : 'bg-transparent text-zinc-500 hover:text-[#10213D] font-semibold'}`}
                >
                  <Icon size={14} className={active ? 'text-[#1f8a57]' : ''} /> {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="csp-password" className={labelCls}>Create password</label>
          <div className="relative">
            <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              id="csp-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className={`${inputCls} pr-12`}
            />
            <EyeToggle shown={showPassword} onToggle={() => setShowPassword(v => !v)} />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="csp-confirm" className={labelCls}>Confirm password</label>
          <div className="relative">
            <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              id="csp-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className={`${inputCls} pr-12`}
            />
            <EyeToggle shown={showConfirmPassword} onToggle={() => setShowConfirmPassword(v => !v)} />
          </div>
        </div>

        <SubmitButton loading={loading} loadingText="Saving…" className="!mt-6">Complete registration</SubmitButton>
      </form>
    </AuthShell>
  );
};

export default CompleteSocialProfile;
