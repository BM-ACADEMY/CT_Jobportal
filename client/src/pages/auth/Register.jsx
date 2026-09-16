import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, CircleCheck, Briefcase, Building2, ShieldCheck, ArrowLeft, Phone } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import PhoneInputPkg from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
const PhoneInput = PhoneInputPkg.default || PhoneInputPkg;
import PhoneNumberInput from '@/components/shared/PhoneNumberInput';
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
import { REGEXP_ONLY_DIGITS } from "input-otp";

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).regex(/^[a-zA-Z\s]+$/, { message: "Name must contain only alphabets" }),
  email: z.string().email({ message: "Enter a valid email address" }).toLowerCase(),
  countryCode: z.string().min(1, { message: "Country code is required" }),
  mobileNumber: z.string().regex(/^\d+$/, { message: "Mobile number must contain only digits" }),
  password: z.string().min(6, { message: "Minimum 6 characters" }).regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|~`\-]).{6,}$/, {
    message: "1 uppercase, 1 number, and 1 symbol required"
  }),
  confirmPassword: z.string(),
  collegeName: z.string().optional(),
  collegeEmail: z.string().optional(),
  collegePhone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.countryCode === '+91') return data.mobileNumber.length === 10;
  if (data.countryCode === '+1') return data.mobileNumber.length === 10;
  if (data.countryCode === '+44') return data.mobileNumber.length === 10;
  if (data.countryCode === '+971') return data.mobileNumber.length === 9;
  if (data.countryCode === '+61') return data.mobileNumber.length === 9;
  if (data.countryCode === '+65') return data.mobileNumber.length === 8;
  return data.mobileNumber.length >= 7 && data.mobileNumber.length <= 10;
}, {
  message: "Enter a valid phone number",
  path: ["mobileNumber"],
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
      countryCode: "+91",
      mobileNumber: "",
      password: "",
      confirmPassword: "",
      collegeName: "",
      collegeEmail: "",
      collegePhone: "",
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
    if (selectedRole === 'college') {
      if (!values.collegeName?.trim() || !values.collegeEmail?.trim() || !values.collegePhone?.trim()) {
        setError('Please fill in College Name, College Email, and College Phone.');
        return;
      }
    }
    setLoading(true);
    setError('');
    const result = await register({
      name: values.name,
      email: values.email,
      phone: `${values.countryCode}${values.mobileNumber}`,
      password: values.password,
      role: selectedRole,
      ...(selectedRole === 'college' ? {
        collegeName: values.collegeName,
        collegeEmail: values.collegeEmail,
        collegePhone: values.collegePhone,
        tpoPhone: `${values.countryCode}${values.mobileNumber}`,
      } : {}),
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
    <div className="min-h-screen flex bg-slate-50">

      {/* ─── Left Panel ─── */}
      <div
        className="hidden lg:flex w-[44%] flex-shrink-0 relative overflow-hidden flex-col justify-between py-14 pl-20 pr-14 xl:py-16 xl:pl-28 xl:pr-16 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80")' }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-slate-900/75" />

        <div className="flex flex-col relative z-10">
          <Link to="/" className="inline-block no-underline mb-16" aria-label="Velaivaaipu home">
            <img src="/velaivaaipu-logo.png" alt="Velaivaaipu" loading="eager" decoding="async" className="h-11 w-auto object-contain" />
          </Link>

          <div>
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
        </div>

        <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-7 border border-white/10 space-y-4 relative z-10">
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
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-[520px] bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_40px_-8px_rgba(15,23,42,0.08)] p-8 sm:p-10 my-8 space-y-8">
          <Link to="/" className="lg:hidden inline-block no-underline mb-2" aria-label="Velaivaaipu home">
            <img src="/velaivaaipu-logo.png" alt="Velaivaaipu" className="h-9 w-auto object-contain" />
          </Link>

          {step === 'form' ? (
            <div className="animate-in fade-in duration-500 space-y-6">
              {/* Heading */}
              <div className="space-y-1.5"><h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Create your account
                </h1>
                <p className="text-slate-500 text-sm">
                  Join millions of professionals on Velaivaaipu
                </p>
              </div>

              {/* Role Toggle */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { key: 'jobseeker', label: 'Job Seeker', Icon: Briefcase },
                  { key: 'recruiter', label: 'Recruiter', Icon: Building2 },
                  { key: 'company', label: 'Company', Icon: Building2 },
                  { key: 'college', label: 'College', Icon: ShieldCheck },
                ].map(role => {
                  const active = selectedRole === role.key;
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => setSelectedRole(role.key)}
                      className={`flex items-center justify-center gap-2 h-11 rounded-lg border transition-all text-sm font-medium
                        ${active 
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      <role.Icon size={16} className={active ? 'text-emerald-600' : 'text-slate-400'} />
                      {role.label}
                    </button>
                  );
                })}
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-xl border-rose-100 bg-rose-50 py-3 mb-6">
                  <AlertDescription className="text-sm font-medium text-rose-600">{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-slate-700">{selectedRole === 'college' ? 'TPO Name' : 'Full Name'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input 
                              placeholder={selectedRole === 'college' ? 'TPO name' : 'Full name'} 
                              {...field} 
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                field.onChange(val);
                              }}
                              className="h-11 pl-10 rounded-lg border-slate-200 bg-white focus-visible:border-emerald-400 focus-visible:ring-emerald-100 transition-all text-sm" 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs font-medium text-rose-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-slate-700">{selectedRole === 'college' ? 'College Email' : 'Email Address'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input 
                              placeholder={selectedRole === 'college' ? 'TPO email address' : 'Email address'} 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                              className="h-11 pl-10 rounded-lg border-slate-200 bg-white focus-visible:border-emerald-400 focus-visible:ring-emerald-100 transition-all text-sm" 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs font-medium text-rose-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-slate-700">{selectedRole === 'college' ? 'TPO Number' : 'Mobile Number'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <PhoneInput
                              country={'in'}
                              disableCountryGuess
                              value={form.watch('countryCode').replace('+', '') + field.value}
                              onChange={(phone, country) => {
                                if (country && country.dialCode) {
                                  form.setValue('countryCode', '+' + country.dialCode, { shouldValidate: true });
                                  const rawNumber = phone.slice(country.dialCode.length);
                                  // Cap at the selected country's actual digit length (e.g. 10 for
                                  // India) as the user types, instead of only flagging it on submit.
                                  // country.format is prefixed with the dial code's own dots + a
                                  // space (e.g. India's is "+.. .....-....."), so only the segment
                                  // after the first space is the national-number format to count.
                                  let maxDigits = 15;
                                  if (country.format) {
                                    const spaceIdx = country.format.indexOf(' ');
                                    const nationalFormat = spaceIdx === -1 ? country.format : country.format.slice(spaceIdx + 1);
                                    maxDigits = (nationalFormat.match(/\./g) || []).length;
                                  }
                                  field.onChange(rawNumber.slice(0, maxDigits));
                                }
                              }}
                              inputProps={{
                                name: 'mobileNumber',
                                required: true,
                                placeholder: selectedRole === 'college' ? 'TPO number' : 'Mobile number'
                              }}
                              inputClass="!w-full !h-11 !pl-[52px] !rounded-lg !border-slate-200 !bg-white !text-sm focus:!border-emerald-400 focus:!ring-1 focus:!ring-emerald-400 focus:!outline-none transition-all"
                              buttonClass="!border-slate-200 !bg-slate-50 !rounded-l-lg !w-[45px] hover:!bg-slate-100"
                              dropdownClass="!bg-white !text-slate-700"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs font-medium text-rose-500" />
                      </FormItem>
                    )}
                  />

                  {selectedRole === 'college' && (
                    <>
                      <FormField
                        control={form.control}
                        name="collegeName"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-sm font-medium text-slate-700">College Name</FormLabel>
                        <FormControl>
                                <div className="relative">
                                  <Building2 size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input placeholder="College name" {...field} className="h-11 pl-10 rounded-lg border-slate-200 bg-white focus-visible:border-emerald-400 focus-visible:ring-emerald-100 transition-all text-sm" />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs font-medium text-rose-500" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="collegeEmail"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-sm font-medium text-slate-700">{selectedRole === 'college' ? 'College Email' : 'Email Address'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input placeholder="College email address" {...field} className="h-11 pl-10 rounded-lg border-slate-200 bg-white focus-visible:border-emerald-400 focus-visible:ring-emerald-100 transition-all text-sm" />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs font-medium text-rose-500" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="collegePhone"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-sm font-medium text-slate-700">College Number</FormLabel>
                            <FormControl>
                              <PhoneNumberInput value={field.value} onChange={field.onChange} inputProps={{ placeholder: 'College number' }} />
                            </FormControl>
                            <FormMessage className="text-xs font-medium text-rose-500" />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-slate-700">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Create a password" 
                              {...field} 
                              className="h-11 pl-10 pr-10 rounded-lg border-slate-200 bg-white focus-visible:border-emerald-400 focus-visible:ring-emerald-100 transition-all text-sm" 
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={17} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs font-medium text-rose-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium text-slate-700">Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirm password" 
                              {...field} 
                              className="h-11 pl-10 pr-10 rounded-lg border-slate-200 bg-white focus-visible:border-emerald-400 focus-visible:ring-emerald-100 transition-all text-sm" 
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={17} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs font-medium text-rose-500" />
                      </FormItem>
                    )}
                  />

                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                    By creating an account, you agree to our{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Terms of Service</a> and{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Privacy Policy</a>.
                  </p>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-lg text-sm font-semibold transition-all shadow-sm bg-emerald-700 text-white hover:bg-emerald-800 mt-2"
                  >
                    {loading ? 'Processing...' : `Create ${selectedRole === 'company' ? 'Company' : selectedRole === 'college' ? 'College' : isRecruiter ? 'Recruiter' : 'Job Seeker'} Account`}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-700 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>

              {/* Social Logins */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">or continue with</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google?role=${selectedRole}`}
                  className="flex items-center justify-center h-12 rounded-xl border border-border bg-slate-50 hover:bg-muted transition-all"
                >
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/github?role=${selectedRole}`}
                  className="flex items-center justify-center gap-2 h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-700"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#334155"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col py-5">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8">
                <ShieldCheck size={32} className="text-emerald-600" />
              </div>

              <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight tracking-tight">
                  Verify email
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  We've sent a 6-digit code to <br className="hidden md:block"/>
                  <span className="font-black text-foreground">{registeredEmail}</span>
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mb-8 rounded-2xl border-destructive/20 bg-destructive/5">
                  <AlertDescription className="text-sm font-medium text-rose-600">{error}</AlertDescription>
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
                  pattern={REGEXP_ONLY_DIGITS}
                  className="gap-3"
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot 
                        key={index} 
                        index={index} 
                        className="h-12 w-10 rounded-lg border-slate-200 bg-white font-bold text-lg focus-visible:border-emerald-400"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button 
                onClick={handleVerifyOtp} 
                disabled={loading}
                className="h-11 w-full rounded-lg text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm transition-all mb-6"
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
                    className="text-emerald-700 font-semibold hover:underline"
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
