import React, { useState } from 'react';
import { JOB_CATEGORIES } from '@/data/jobCategories';
import { COLLEGE_DATA_SAFETY_LINE } from '@/data/collegePrivacy';
import TurnstileWidget, { turnstileEnabled } from '@/components/common/TurnstileWidget';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Mail, Lock, User, Briefcase, Building2, GraduationCap, UserSearch, FileText, Send,
  Users, CalendarCheck, QrCode, BarChart3,
} from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import PhoneInputPkg from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
const PhoneInput = PhoneInputPkg.default || PhoneInputPkg;
import PhoneNumberInput from '@/components/shared/PhoneNumberInput';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AuthShell, AuthPanel, PanelAccent, PanelSteps, AuthHeading, AuthAlert, SubmitButton, EyeToggle, TextLink,
  inputCls, labelCls,
} from '@/components/auth/AuthShell';
import { OtpBoxes, ResendLine, VerifyPanel } from './VerifyOtp';

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

const ROLES = [
  { key: 'jobseeker', label: 'Job seeker', Icon: Briefcase },
  { key: 'recruiter', label: 'Recruiter', Icon: UserSearch },
  { key: 'company', label: 'Company', Icon: Building2 },
  { key: 'college', label: 'College', Icon: GraduationCap },
];

const EMPLOYER_PANEL = {
  tone: 'navy',
  eyebrow: 'For employers',
  title: <>Find your next <PanelAccent tone="navy">great hire.</PanelAccent></>,
  text: 'Post jobs and reach job seekers in Tamil Nadu and Puducherry.',
  steps: [
    { Icon: Briefcase, title: 'Post a job', text: 'Add the role, salary and location.' },
    { Icon: Users, title: 'Review applicants', text: 'Filter by skills, experience and location.' },
    { Icon: CalendarCheck, title: 'Interview and hire', text: 'Shortlist, schedule and decide with your team.' },
  ],
};

const PANELS = {
  jobseeker: {
    tone: 'green',
    eyebrow: 'For job seekers',
    title: <>Start your career with <PanelAccent>Velaivaaipu.</PanelAccent></>,
    text: 'A free account, always.',
    steps: [
      { Icon: User, title: 'Create your account', text: 'Takes less than a minute.' },
      { Icon: FileText, title: 'Build your resume', text: 'Use the free resume builder.' },
      { Icon: Send, title: 'Apply to jobs', text: 'And track every application.' },
    ],
  },
  recruiter: EMPLOYER_PANEL,
  company: EMPLOYER_PANEL,
  college: {
    tone: 'green',
    eyebrow: 'For colleges',
    title: <>Campus placements, <PanelAccent>made simple.</PanelAccent></>,
    text: 'Run drives and follow your students from one place.',
    steps: [
      { Icon: CalendarCheck, title: 'Create a campus drive', text: 'Set it up for your students.' },
      { Icon: QrCode, title: 'Share the QR link', text: 'Students join with name and number.' },
      { Icon: BarChart3, title: 'Track your students', text: 'Skill tests, certificates and results.' },
    ],
  },
};

const iconCls = 'absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none';
const msgCls = 'text-xs font-medium text-rose-600';

const RegisterPage = () => {
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');
  const [selectedRole, setSelectedRole] = useState(['jobseeker', 'recruiter', 'company', 'college'].includes(requestedRole) ? requestedRole : 'jobseeker');
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
  const isCollege = selectedRole === 'college';

  const [brandConsent, setBrandConsent] = useState(false);
  const [interests, setInterests] = useState([]); // job seekers: up to 3 fields of work (optional)
  const [botToken, setBotToken] = useState('');
  const [botReset, setBotReset] = useState(0);

  const onSubmit = async (values) => {
    if (turnstileEnabled() && !botToken) { setError('Please complete the "I am human" check.'); return; }
    if (isCollege) {
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
      ...(botToken ? { turnstileToken: botToken } : {}),
      ...(searchParams.get('ref') ? { ref: searchParams.get('ref') } : {}),
      ...(brandConsent ? { brandConsent: true } : {}),
      ...(selectedRole === 'jobseeker' && interests.length ? { interestedCategories: interests } : {}),
      ...(isCollege ? {
        collegeName: values.collegeName,
        collegeEmail: values.collegeEmail,
        collegePhone: values.collegePhone,
        tpoPhone: `${values.countryCode}${values.mobileNumber}`,
      } : {}),
    });
    setLoading(false);
    if (!result.success) setBotReset((n) => n + 1); // a used token cannot be used twice

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

  const handleVerifyOtp = async (e) => {
    e?.preventDefault?.();
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

  const p = PANELS[selectedRole];
  const panel = step === 'otp'
    ? <VerifyPanel />
    : (
      <AuthPanel key={selectedRole} tone={p.tone} eyebrow={p.eyebrow} title={p.title} text={p.text}>
        <PanelSteps steps={p.steps} />
      </AuthPanel>
    );

  const accountWord = selectedRole === 'company' ? 'company' : isCollege ? 'college' : isRecruiter ? 'recruiter' : 'job seeker';

  return (
    <AuthShell id="register" panel={panel}>
      {step === 'form' ? (
        <>
          <AuthHeading title="Create your account">Free to join. Pick who you are to get started.</AuthHeading>

          {/* Role picker */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-xl bg-zinc-100 p-1" role="radiogroup" aria-label="Account type">
            {ROLES.map(({ key, label, Icon }) => {
              const active = selectedRole === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => { setSelectedRole(key); setError(''); }}
                  className={`h-10 rounded-lg text-[13px] flex items-center justify-center gap-1.5 border-none cursor-pointer transition ${active ? 'bg-white text-[#10213D] font-bold shadow-sm' : 'bg-transparent text-zinc-500 hover:text-[#10213D] font-semibold'}`}
                >
                  <Icon size={14} className={active ? 'text-[#1f8a57]' : ''} /> {label}
                </button>
              );
            })}
          </div>

          <AuthAlert>{error}</AuthAlert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelCls}>{isCollege ? 'TPO name' : 'Full name'}</FormLabel>
                    <div className="relative">
                      <User size={17} className={iconCls} />
                      <FormControl>
                        <input
                          autoComplete="name"
                          placeholder={isCollege ? 'TPO name' : 'Your full name'}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                          className={`${inputCls} pr-4`}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className={msgCls} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelCls}>{isCollege ? 'TPO email' : isRecruiter ? 'Company email (best)' : 'Email address'}</FormLabel>
                    <div className="relative">
                      <Mail size={17} className={iconCls} />
                      <FormControl>
                        <input
                          type="email"
                          autoComplete="email"
                          placeholder={isCollege ? 'TPO email address' : isRecruiter ? 'name@yourcompany.com' : 'you@example.com'}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                          className={`${inputCls} pr-4`}
                        />
                      </FormControl>
                    </div>
                    {isRecruiter && (
                      <p className="m-0 rounded-xl bg-[#f4faf7] ring-1 ring-[#34B678]/15 px-3 py-2 text-xs font-medium leading-relaxed text-[#1f8a57]">
                        Sign up with your company email and list your company free, verified at once. Gmail and other free emails also work: one live job at a time for 14 days, after a quick proof check.
                      </p>
                    )}
                    <FormMessage className={msgCls} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelCls}>{isCollege ? 'TPO number' : 'Mobile number'}</FormLabel>
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
                            autoComplete: 'tel-national',
                            placeholder: isCollege ? 'TPO number' : 'Mobile number'
                          }}
                          containerClass="!w-full"
                          inputClass="!w-full !h-12 !pl-[58px] !rounded-xl !border-none !ring-1 !ring-zinc-200 !bg-white !text-sm !font-medium !text-zinc-900 focus:!ring-2 focus:!ring-[#34B678] focus:!outline-none transition"
                          buttonClass="!border-none !bg-transparent !rounded-l-xl !w-[48px] !pl-2 hover:!bg-zinc-50"
                          dropdownClass="!bg-white !text-zinc-700 !rounded-xl"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className={msgCls} />
                  </FormItem>
                )}
              />

              {isCollege && (
                <div className="rounded-2xl bg-[#f4faf7] ring-1 ring-[#34B678]/15 p-4 space-y-4">
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-[#1f8a57]">College details</p>
                  <FormField
                    control={form.control}
                    name="collegeName"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className={labelCls}>College name</FormLabel>
                        <div className="relative">
                          <GraduationCap size={17} className={iconCls} />
                          <FormControl>
                            <input placeholder="College name" {...field} className={`${inputCls} pr-4`} />
                          </FormControl>
                        </div>
                        <FormMessage className={msgCls} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="collegeEmail"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className={labelCls}>College email</FormLabel>
                        <div className="relative">
                          <Mail size={17} className={iconCls} />
                          <FormControl>
                            <input type="email" placeholder="College email address" {...field} className={`${inputCls} pr-4`} />
                          </FormControl>
                        </div>
                        <FormMessage className={msgCls} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="collegePhone"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className={labelCls}>College number</FormLabel>
                        <FormControl>
                          <PhoneNumberInput value={field.value} onChange={field.onChange} inputProps={{ placeholder: 'College number' }} />
                        </FormControl>
                        <FormMessage className={msgCls} />
                      </FormItem>
                    )}
                  />
                  <p className="m-0 text-xs text-zinc-500 leading-relaxed">
                    Our team will call you within 24 hours to help you start. We do not sell student data.{' '}
                    <a href="/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-[#1f8a57] hover:underline">Privacy Policy</a>
                  </p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelCls}>Password</FormLabel>
                      <div className="relative">
                        <Lock size={17} className={iconCls} />
                        <FormControl>
                          <input
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Create password"
                            {...field}
                            className={`${inputCls} pr-12`}
                          />
                        </FormControl>
                        <EyeToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                      </div>
                      <FormMessage className={msgCls} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelCls}>Confirm password</FormLabel>
                      <div className="relative">
                        <Lock size={17} className={iconCls} />
                        <FormControl>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Repeat password"
                            {...field}
                            className={`${inputCls} pr-12`}
                          />
                        </FormControl>
                        <EyeToggle shown={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                      </div>
                      <FormMessage className={msgCls} />
                    </FormItem>
                  )}
                />
              </div>
              <p className="m-0 -mt-1 text-xs text-zinc-400">At least 6 characters with 1 capital letter, 1 number and 1 symbol.</p>

              {selectedRole === 'jobseeker' && (
                <div className="space-y-2">
                  <span className={labelCls}>Fields you want to work in <span className="font-medium text-zinc-400">(optional, up to 3)</span></span>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Fields of work">
                    {JOB_CATEGORIES.map((c) => {
                      const picked = interests.includes(c.key);
                      return (
                        <button
                          key={c.key}
                          type="button"
                          aria-pressed={picked}
                          onClick={() => setInterests((cur) => (picked ? cur.filter((k) => k !== c.key) : cur.length >= 3 ? cur : [...cur, c.key]))}
                          className={`h-9 px-3 rounded-lg text-xs font-bold border-none cursor-pointer ring-1 transition ${picked ? 'bg-[#34B678] text-white ring-[#34B678]' : 'bg-white text-zinc-600 ring-zinc-200 hover:ring-[#34B678]/50'}`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isCollege && (
                <p className="m-0 rounded-xl bg-[#f4faf7] ring-1 ring-[#34B678]/15 px-3 py-2 text-xs font-medium leading-relaxed text-zinc-600">
                  {COLLEGE_DATA_SAFETY_LINE}
                </p>
              )}

              <label className="flex items-start gap-2.5 text-xs text-zinc-500 leading-relaxed cursor-pointer">
                <input type="checkbox" className="mt-0.5 w-4 h-4 shrink-0 accent-[#34B678]" checked={brandConsent} onChange={(e) => setBrandConsent(e.target.checked)} />
                <span>Optional: allow Velaivaaipu and its sister brands (BM Academy, CoreTalents) to contact me about training and hiring services. You can change this any time in Settings.</span>
              </label>

              <TurnstileWidget onToken={setBotToken} resetKey={botReset} />

              <SubmitButton loading={loading} loadingText="Creating account…" className="!mt-6">
                Create {accountWord} account
              </SubmitButton>

              <p className="m-0 text-xs text-zinc-500 leading-relaxed text-center">
                By creating an account, you agree to our{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1f8a57] hover:underline">Terms</a> and{' '}
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1f8a57] hover:underline">Privacy Policy</a>.
              </p>
            </form>
          </Form>

          <p className="mt-5 text-center text-sm text-zinc-500 m-0">
            Already have an account? <TextLink to="/login">Sign in</TextLink>
          </p>
        </>
      ) : (
        <>
          <AuthHeading title="Verify your email">
            Enter the 6-digit code we sent to <span className="font-semibold text-[#10213D] break-all">{registeredEmail}</span>.
          </AuthHeading>

          {!error && <AuthAlert type="success">{successMsg}</AuthAlert>}
          <AuthAlert>{error}</AuthAlert>

          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5" noValidate>
            <div className="space-y-2">
              <span className={labelCls}>6-digit code</span>
              <OtpBoxes value={otp} onChange={setOtp} onComplete={handleVerifyOtp} />
            </div>
            <SubmitButton loading={loading} loadingText="Verifying…">Verify and continue</SubmitButton>
          </form>

          <ResendLine timer={timer} resending={resending} onResend={handleResend} />
          <p className="mt-2 text-center text-sm text-zinc-500 m-0">
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => { setStep('form'); setOtp(''); setError(''); }}
              className="font-bold text-[#1f8a57] hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              Go back
            </button>
          </p>
        </>
      )}
    </AuthShell>
  );
};

export default RegisterPage;
