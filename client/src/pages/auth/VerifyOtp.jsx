import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  AuthShell, AuthPanel, PanelPoints, AuthHeading, AuthAlert, SubmitButton, TextLink,
  inputCls, labelCls, otpSlotCls,
} from '@/components/auth/AuthShell';

const TIPS = [
  'Look in your inbox for an email from Velaivaaipu',
  'Not there? Check the Spam or Promotions folder',
  'Asked for a new code? Use the latest one',
];

// Resend countdown, shared with the register page's OTP step.
export const ResendLine = ({ timer, resending, onResend }) => (
  <p className="mt-6 text-center text-sm text-zinc-500 m-0">
    Didn&apos;t get the code?{' '}
    <button
      type="button"
      onClick={onResend}
      disabled={timer > 0 || resending}
      className={`font-bold bg-transparent border-none p-0 transition ${timer > 0 || resending ? 'text-zinc-400 cursor-not-allowed' : 'text-[#1f8a57] hover:underline cursor-pointer'}`}
    >
      {resending ? 'Sending…' : timer > 0 ? `Resend in ${timer}s` : 'Resend code'}
    </button>
  </p>
);

export const OtpBoxes = ({ value, onChange, onComplete }) => (
  <InputOTP maxLength={6} value={value} onChange={onChange} onComplete={onComplete} pattern={REGEXP_ONLY_DIGITS}>
    <InputOTPGroup className="gap-2">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <InputOTPSlot key={index} index={index} className={otpSlotCls} />
      ))}
    </InputOTPGroup>
  </InputOTP>
);

export const VerifyPanel = () => (
  <AuthPanel eyebrow="One last step" title="Check your email for the code." text="We sent a 6-digit code to confirm the email is yours.">
    <PanelPoints points={TIPS} />
    <div className="relative flex-1 min-h-0 flex items-end justify-center pb-10">
      <svg viewBox="0 0 220 160" className="w-[min(260px,70%)] h-auto max-h-full" fill="none" aria-hidden="true">
        <rect x="10" y="30" width="200" height="120" rx="16" fill="#fff" fillOpacity="0.95" />
        <path d="M14 40 L110 100 L206 40" stroke="#34B678" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={38 + i * 25} y="118" width="18" height="18" rx="5" fill="#34B678" fillOpacity={0.25 + i * 0.12} />
        ))}
        <circle cx="186" cy="34" r="20" fill="#10213D" />
        <path d="M177 34 L184 41 L196 27" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </AuthPanel>
);

const VerifyOtpPage = () => {
  const { state } = useLocation();
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(state?.email || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(60);

  // Countdown Timer
  React.useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (timer > 0) return;

    setResending(true);
    setError('');
    setSuccess('');

    const result = await resendOtp(email);
    setResending(false);

    if (result.success) {
      setSuccess('A new OTP has been sent to your email.');
      setTimer(60);
    } else {
      setError(result.msg);
    }
  };

  // No msg if standard generic route accessed
  const msg = state?.msg;

  const handleVerify = async (e) => {
    e?.preventDefault?.();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await verifyOtp(email, otp);
    setLoading(false);

    if (result.success) {
      navigate(result.redirect);
    } else {
      setError(result.msg);
    }
  };

  return (
    <AuthShell id="verify" panel={<VerifyPanel />}>
      <AuthHeading title="Verify your email">
        {state?.email
          ? <>Enter the 6-digit code we sent to <span className="font-semibold text-[#10213D] break-all">{email}</span>.</>
          : 'Enter your email and the 6-digit code we sent you.'}
      </AuthHeading>

      {msg && !success && !error && <AuthAlert type="success">{msg}</AuthAlert>}
      <AuthAlert type="success">{success}</AuthAlert>
      <AuthAlert>{error}</AuthAlert>

      <form onSubmit={handleVerify} className="mt-6 space-y-5" noValidate>
        {!state?.email && (
          <div className="space-y-2">
            <label htmlFor="otp-email" className={labelCls}>Email address</label>
            <div className="relative">
              <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                id="otp-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                className={`${inputCls} pr-4`}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className={labelCls}>6-digit code</span>
          <OtpBoxes value={otp} onChange={setOtp} onComplete={handleVerify} />
        </div>

        <SubmitButton loading={loading} loadingText="Verifying…">Verify email</SubmitButton>
      </form>

      <ResendLine timer={timer} resending={resending} onResend={handleResend} />
      <p className="mt-2 text-center text-sm text-zinc-500 m-0">
        Wrong account? <TextLink to="/login">Back to sign in</TextLink>
      </p>
    </AuthShell>
  );
};

export default VerifyOtpPage;
