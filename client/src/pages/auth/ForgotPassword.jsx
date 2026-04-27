import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, KeyRound, ArrowLeft, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

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

  const handleSendEmail = async () => {
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

  const handleResetPassword = async () => {
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="bg-background w-full max-w-[440px] rounded-[32px] shadow-xl border border-border p-8 md:p-10 relative overflow-hidden">
        
        {/* Top Decorative gradient abstract strip */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-violet-500" />

        {/* Back Button */}
        {step === 'email' && (
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-black text-muted-foreground hover:text-foreground transition-colors mb-8 uppercase tracking-widest">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6 rounded-2xl border-destructive/20 bg-destructive/5 py-3">
            <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
          </Alert>
        )}

        {/* ── STEP 1: REQUEST EMAIL ── */}
        {step === 'email' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <KeyRound size={24} className="text-primary" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2 tracking-tight">Forgot Password?</h1>
            <p className="text-muted-foreground text-sm font-bold leading-relaxed mb-8">
              No worries, we'll send you reset instructions. Enter the email associated with your account.
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <Input 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-14 pl-12 rounded-2xl border-border bg-muted/20 focus:bg-background transition-all font-bold text-sm"
                  />
                </div>
              </div>
              <Button 
                disabled={loading}
                onClick={handleSendEmail}
                className="h-14 w-full rounded-2xl text-base font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {loading ? 'Sending...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: VERIFY AND SET NEW PASSWORD ── */}
        {step === 'otp' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} className="text-violet-500" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2 tracking-tight">Set New Password</h1>
            <p className="text-muted-foreground text-sm font-bold leading-relaxed mb-8">
              We sent a 6-digit code to <span className="font-black text-foreground">{email}</span>.
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">6-Digit Code</label>
                <InputOTP 
                  maxLength={6} 
                  value={otp} 
                  onChange={setOtp} 
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

              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">New Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="h-14 pr-12 rounded-2xl border-border bg-muted/20 focus:bg-background transition-all font-bold text-sm"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button 
                disabled={loading}
                onClick={handleResetPassword}
                className="h-14 w-full rounded-2xl text-base font-black bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
              
              <div className="text-center">
                <button 
                  onClick={() => setStep('email')} 
                  className="text-xs font-black text-muted-foreground hover:text-foreground transition uppercase tracking-widest"
                >
                  Change Email Address
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: SUCCESS ── */}
        {step === 'success' && (
          <div className="animate-in zoom-in duration-500 text-center py-6">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={36} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-3 tracking-tight">All done!</h1>
            <p className="text-muted-foreground text-sm font-bold leading-relaxed mb-8 max-w-[260px] mx-auto">
              Your password has been successfully reset. You can now use your new password to log in to your account.
            </p>
            <Button 
              onClick={() => navigate('/login')}
              className="h-14 w-full rounded-2xl text-base font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Continue to Login <ArrowRight size={18} />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
