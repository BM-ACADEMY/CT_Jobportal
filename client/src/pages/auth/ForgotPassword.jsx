import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, KeyRound, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  AuthShell, AuthPanel, PanelSteps, AuthHeading, AuthAlert, SubmitButton, EyeToggle, TextLink,
  inputCls, labelCls, otpSlotCls,
} from '@/components/auth/AuthShell';

const STEPS = [
  { Icon: Mail, title: 'Enter your email', text: 'The one you use to sign in.' },
  { Icon: KeyRound, title: 'Enter the code', text: 'We email you a 6-digit code.' },
  { Icon: ShieldCheck, title: 'Set a new password', text: 'Then sign in with it.' },
];

const STEP_INDEX = { email: 0, otp: 1, success: 3 };

const ForgotPasswordPage = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  // state: 'email' | 'otp' | 'success'
  const [step, setStep] = useState('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendEmail = async (e) => {
    e?.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      setStep('otp');
    } else {
      setError(result.msg);
    }
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6 || !newPassword) {
      setError('Please provide a valid 6-digit OTP and a new password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await resetPassword(email, otp, newPassword);
    setLoading(false);

    if (result.success) {
      setStep('success');
    } else {
      setError(result.msg);
    }
  };

  return (
    <AuthShell
      id="forgot"
      panel={
        <AuthPanel
          eyebrow="Account help"
          title="Locked out? Get back in under a minute."
          text="Reset your password in three short steps."
        >
          <PanelSteps steps={STEPS} active={STEP_INDEX[step]} />
        </AuthPanel>
      }
    >
      {/* ── STEP 1: REQUEST EMAIL ── */}
      {step === 'email' && (
        <>
          <AuthHeading title="Forgot password?">
            Enter the email linked to your account and we&apos;ll send you a 6-digit code.
          </AuthHeading>
          <AuthAlert>{error}</AuthAlert>

          <form onSubmit={handleSendEmail} className="mt-6 space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="fp-email" className={labelCls}>Email address</label>
              <div className="relative">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  className={`${inputCls} pr-4`}
                />
              </div>
            </div>
            <SubmitButton loading={loading} loadingText="Sending code…">Send code</SubmitButton>
          </form>

          <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-[#10213D] transition">
            <ArrowLeft size={15} /> Back to sign in
          </Link>
        </>
      )}

      {/* ── STEP 2: VERIFY AND SET NEW PASSWORD ── */}
      {step === 'otp' && (
        <>
          <AuthHeading title="Set a new password">
            We sent a 6-digit code to <span className="font-semibold text-[#10213D] break-all">{email}</span>.
          </AuthHeading>
          <AuthAlert>{error}</AuthAlert>

          <form onSubmit={handleResetPassword} className="mt-6 space-y-5" noValidate>
            <div className="space-y-2">
              <span className={labelCls}>6-digit code</span>
              <InputOTP maxLength={6} value={otp} onChange={setOtp} pattern={REGEXP_ONLY_DIGITS}>
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot key={index} index={index} className={otpSlotCls} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="space-y-2">
              <label htmlFor="fp-password" className={labelCls}>New password</label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  id="fp-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter a new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputCls} pr-12`}
                />
                <EyeToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              </div>
            </div>

            <SubmitButton loading={loading} loadingText="Updating…">Update password</SubmitButton>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 m-0">
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              className="font-bold text-[#1f8a57] hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              Change it
            </button>
          </p>
        </>
      )}

      {/* ── STEP 3: SUCCESS ── */}
      {step === 'success' && (
        <div className="text-center">
          <div className="mt-8 w-16 h-16 mx-auto rounded-2xl bg-[#eaf7f0] text-[#1f8a57] flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="mt-5 text-[1.75rem] font-bold tracking-tight text-[#10213D] m-0">Password updated</h1>
          <p className="mt-1.5 text-zinc-500 text-sm leading-relaxed m-0">
            You can now sign in with your new password.
          </p>
          <SubmitButton type="button" onClick={() => navigate('/login')} className="mt-7">Continue to sign in</SubmitButton>
        </div>
      )}

      {step === 'email' && (
        <p className="mt-3 text-center text-sm text-zinc-500 m-0">
          New here? <TextLink to="/register">Create an account</TextLink>
        </p>
      )}
    </AuthShell>
  );
};

export default ForgotPasswordPage;
