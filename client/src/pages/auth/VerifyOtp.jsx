import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MailOpen, ShieldCheck, ArrowRight } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

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

  const handleVerify = async () => {
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="bg-background w-full max-w-md rounded-[32px] shadow-2xl p-8 md:p-10 border border-border overflow-hidden relative">
        
        {/* Top Decorative gradient abstract strip */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        {/* Header Icon */}
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
          <MailOpen size={28} className="text-primary" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-3 tracking-tight">Verify your email</h1>
          <p className="text-sm text-muted-foreground font-bold leading-relaxed">
            Please enter your registered email address and the 6-digit code we sent you.
          </p>
        </div>

        {/* System Messages */}
        <div className="space-y-4 mb-8">
          {msg && (
            <Alert variant="default" className="rounded-2xl border-primary/20 bg-primary/5 py-4">
              <AlertDescription className="text-xs font-bold text-primary">{msg}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert variant="default" className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 py-4">
              <AlertDescription className="text-xs font-bold text-emerald-600">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5 py-4">
              <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Form Inputs */}
        <div className="space-y-8 mb-10">
          <div>
            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Email Address</label>
            <Input 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-14 rounded-2xl border-border bg-muted/20 focus:bg-background transition-all font-bold text-sm"
              disabled={!!state?.email}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">6-digit Security Code</label>
            <InputOTP 
              maxLength={6} 
              value={otp} 
              onChange={setOtp} 
              onComplete={handleVerify}
              className="gap-3"
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot 
                    key={index} 
                    index={index} 
                    className="h-14 w-12 rounded-xl border-border bg-muted/20 font-black text-xl"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        {/* Validate Button */}
        <Button 
          disabled={loading}
          onClick={handleVerify} 
          className="h-14 w-full rounded-2xl text-base font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {loading ? 'Verifying...' : 'Verify Email Address'}
        </Button>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground font-bold">
            Didn't receive the code?{' '}
            <button 
              onClick={handleResend}
              disabled={timer > 0 || resending}
              className={`font-black hover:underline transition ${
                timer > 0 || resending ? 'text-muted-foreground/40 cursor-not-allowed' : 'text-primary'
              }`}
            >
              {resending ? 'Sending...' : timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default VerifyOtpPage;
