import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, CircleCheck, Briefcase, Building2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Enter a valid email address" }).toLowerCase(),
  password: z.string().min(6, { message: "Minimum 6 characters" }).regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|~`\-]).{6,}$/, {
    message: "1 uppercase, 1 number, and 1 symbol required"
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const RegisterPage = () => {
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('jobseeker');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 'form' | 'otp'
  const [step, setStep] = useState('form');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState('');

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

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
    const result = await resendOtp(registeredEmail);
    setResending(false);
    if (result.success) {
      setSuccessMsg(result.msg);
      setTimer(60);
    } else {
      setError(result.msg);
    }
  };

  const isRecruiter = selectedRole === 'recruiter' || selectedRole === 'company';

  const onSubmit = async (values) => {
    setLoading(true);
    setError('');
    const result = await register({
      name: values.name,
      email: values.email,
      password: values.password,
      role: selectedRole,
    });
    setLoading(false);
    
    if (result.success) {
      if (result.requireOtp) {
        setRegisteredEmail(result.email);
        setSuccessMsg(result.msg || 'OTP sent to your email.');
        setStep('otp');
      } else {
        navigate(result.redirect);
      }
    } else {
      setError(result.msg);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setLoading(true);
    setError('');
    
    const result = await verifyOtp(registeredEmail, otp);
    setLoading(false);

    if (result.success) {
      navigate(result.redirect);
    } else {
      setError(result.msg);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">

      {/* ─── Left Panel ─── */}
      <div
        className={`hidden lg:flex w-[42%] flex-shrink-0 relative overflow-hidden flex-col justify-between p-12 transition-all duration-500
          ${isRecruiter 
            ? 'bg-gradient-to-br from-emerald-900 via-emerald-700 to-green-600' 
            : 'bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-600'}`}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-white/5" />

        <Link to="/" className="flex items-center gap-3 no-underline relative z-10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
            <span className={`font-black text-lg ${isRecruiter ? 'text-emerald-600' : 'text-emerald-500'}`}>N</span>
          </div>
          <span className="text-white font-black text-2xl tracking-tighter">naukri</span>
        </Link>

        <div className="relative z-10">
          <p className={`font-black text-[10px] uppercase tracking-[0.2em] mb-4 
            ${isRecruiter ? 'text-emerald-200' : 'text-teal-200'}`}>
            {isRecruiter ? 'FOR EMPLOYERS' : 'FOR JOB SEEKERS'}
          </p>
          <h2 className="text-white font-black text-4xl leading-tight mb-6">
            {isRecruiter ? (
              <>Find your<br />next great<br /><span className="text-emerald-200">hire today.</span></>
            ) : (
              <>Start your<br />journey<br /><span className="text-teal-200">with us.</span></>
            )}
          </h2>
          <p className="text-white/80 text-sm font-medium leading-relaxed mb-10 max-w-xs">
            {isRecruiter
              ? 'Post jobs for free and connect with 50L+ active job seekers across India.'
              : 'Whether you\'re looking for your next role or next hire — we\'ve got you.'}
          </p>

          <div className="flex flex-col gap-3">
            {(isRecruiter ? [
              'Post unlimited jobs for free',
              'Access 50L+ candidate profiles',
              'AI-powered candidate matching',
              'Real-time application tracking',
            ] : [
              'Free account, always',
              'AI-powered resume builder',
              'One-click apply to 2L+ jobs',
              'Real-time application tracking',
            ]).map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <CircleCheck size={16} className={isRecruiter ? 'text-emerald-300' : 'text-teal-300'} />
                <span className="text-white/90 text-[13px] font-bold">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 shadow-xl relative z-10">
          <div className="flex gap-0.5 mb-2">
            {[1,2,3,4,5].map(i => <StarIcon key={i} />)}
          </div>
          <p className="text-white font-bold text-sm leading-relaxed mb-1">
            {isRecruiter
              ? '"Hired 3 engineers in under 2 weeks!"'
              : '"Found my dream job in 3 days!"'}
          </p>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-wider">
            {isRecruiter
              ? '— Tech Lead, Razorpay'
              : '— Priya S., UX Designer at Swiggy'}
          </p>
        </div>
      </div>

      {/* ─── Right: Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background overflow-y-auto">
        <div className="w-full max-w-[420px]">

          {step === 'form' ? (
            <div className="animate-in fade-in duration-500">
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">
                  Create your account
                </h1>
                <p className="text-muted-foreground text-sm font-bold">
                  Join millions of professionals on Naukri
                </p>
              </div>

              {/* Role Toggle */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { key: 'jobseeker', label: 'Job Seeker', desc: "I'm looking for a job", Icon: Briefcase, activeColor: 'emerald-600', borderColor: 'border-emerald-600', bgColor: 'bg-emerald-600/5', textColor: 'text-emerald-700' },
                  { key: 'recruiter', label: 'Recruiter', desc: "I'm hiring talent", Icon: Building2, activeColor: 'emerald-600', borderColor: 'border-emerald-600', bgColor: 'bg-emerald-600/5', textColor: 'text-emerald-700' },
                  // { key: 'company', label: 'Company', desc: "Direct organization", Icon: Building2, activeColor: 'emerald-600', borderColor: 'border-emerald-600', bgColor: 'bg-emerald-600/5', textColor: 'text-emerald-700' },
                ].map(role => {
                  const active = selectedRole === role.key;
                  return (
                    <button
                      key={role.key}
                      onClick={() => setSelectedRole(role.key)}
                      className={`relative flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-200
                        ${active ? `${role.borderColor} ${role.bgColor}` : 'border-border bg-muted/20 hover:bg-muted/40'}`}
                    >
                      {active && (
                        <CircleCheck size={15} className={`absolute top-2 right-2 ${role.textColor}`} />
                      )}
                      <role.Icon size={20} className={active ? role.textColor : 'text-muted-foreground/60'} />
                      <span className={`font-black text-[13px] ${active ? role.textColor : 'text-muted-foreground'}`}>{role.label}</span>
                      <span className={`font-bold text-[10px] opacity-70 ${active ? role.textColor : 'text-muted-foreground/60'}`}>{role.desc}</span>
                    </button>
                  );
                })}
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6 rounded-2xl border-destructive/20 bg-destructive/5 py-3">
                  <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                            <Input placeholder="Full name" {...field} className="h-12 pl-12 rounded-xl" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px] font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                            <Input placeholder="Email address" {...field} className="h-12 pl-12 rounded-xl" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px] font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Create a password" 
                              {...field} 
                              className="h-12 pl-12 pr-12 rounded-xl" 
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px] font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirm password" 
                              {...field} 
                              className="h-12 pl-12 pr-12 rounded-xl" 
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px] font-bold" />
                      </FormItem>
                    )}
                  />

                  <p className="text-[11px] text-muted-foreground font-bold leading-relaxed mb-4">
                    By creating an account, you agree to our{' '}
                    <Link to="#" className="text-emerald-600 hover:underline">Terms of Service</Link> and{' '}
                    <Link to="#" className="text-emerald-600 hover:underline">Privacy Policy</Link>.
                  </p>

                  <Button
                    type="submit"
                    disabled={loading}
                    className={`w-full h-14 rounded-2xl text-base font-black transition-all shadow-lg
                      ${isRecruiter 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]'}`}
                  >
                    {loading ? 'Processing...' : `Create ${selectedRole === 'company' ? 'Company' : isRecruiter ? 'Recruiter' : 'Job Seeker'} Account`}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-muted-foreground font-bold mt-8">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-600 font-black hover:underline">
                  Sign in
                </Link>
              </p>

              {/* Social Logins */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">OR SIGN UP WITH</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google?role=${selectedRole}`}
                  className="flex items-center justify-center h-12 rounded-xl border border-border bg-background hover:bg-muted transition-all"
                >
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5" />
                </button>
                <button 
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/github?role=${selectedRole}`}
                  className="flex items-center justify-center h-12 rounded-xl border border-border bg-slate-900 hover:opacity-90 transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </button>
                <button 
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/linkedin?role=${selectedRole}`}
                  className="flex items-center justify-center h-12 rounded-xl border border-border bg-[#0077b5] hover:opacity-90 transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col py-5">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center mb-8">
                <ShieldCheck size={32} className="text-emerald-600" />
              </div>

              <div className="mb-10">
                <h1 className="text-3xl font-black text-foreground mb-3 tracking-tight">
                  Verify email
                </h1>
                <p className="text-muted-foreground text-sm font-bold leading-relaxed">
                  We've sent a 6-digit code to <br className="hidden md:block"/>
                  <span className="font-black text-foreground">{registeredEmail}</span>
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mb-8 rounded-2xl border-destructive/20 bg-destructive/5">
                  <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                </Alert>
              )}

              <div className="mb-10">
                <label className="block text-sm font-black text-foreground/80 mb-4">
                  Enter 6-digit Security Code
                </label>
                <InputOTP 
                  maxLength={6} 
                  value={otp} 
                  onChange={setOtp} 
                  onComplete={handleVerifyOtp}
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

              <Button 
                onClick={handleVerifyOtp} 
                disabled={loading}
                className="h-14 w-full rounded-2xl text-base font-black bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] mb-6"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground font-bold">
                  Didn't receive the code?{' '}
                  <button 
                    onClick={handleResend}
                    disabled={timer > 0 || resending}
                    className={`font-black hover:underline ${timer > 0 || resending ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-emerald-600'}`}
                  >
                    {resending ? 'Sending...' : timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code'}
                  </button>
                </p>

                <p className="text-sm text-muted-foreground font-bold mt-4">
                  Wrong email?{' '}
                  <button 
                    onClick={() => setStep('form')} 
                    className="text-emerald-600 font-black hover:underline"
                  >
                    Go back
                  </button>
                </p>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

export default RegisterPage;
