import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Briefcase, Building2, TrendingUp, CircleCheck } from 'lucide-react';
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

const formSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const selectedRole = 'jobseeker';

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    setError('');
    const result = await login(values.email, values.password);
    setLoading(false);
    if (result.success) {
      if (result.requireOtp) {
        navigate('/verify-otp', { state: { email: result.email, msg: result.msg } });
      } else {
        navigate(result.redirect);
      }
    } else {
      setError(result.msg);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* ─── Left Panel ─── */}
      <div className="hidden lg:flex w-[44%] flex-shrink-0 relative overflow-hidden flex-col justify-between p-14 xl:p-16 bg-gradient-to-br from-[#053a2c] via-[#064e3b] to-[#0a5c46]">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/[0.04] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-black/10 translate-y-1/3 -translate-x-1/4" />

        <div className="flex flex-col justify-between h-full relative z-10">
          <div>
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-3 no-underline mb-20" aria-label="Velaivaaipu home">
              <img src="/velaivaaipu-logo.png" alt="Velaivaaipu" loading="eager" decoding="async" className="h-11 w-auto object-contain" />
            </Link>

          <div className="space-y-9">
            <div className="space-y-4">
               <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold">
                 Career Intelligence Platform
               </span>
               <h2 className="text-white font-semibold text-[2.5rem] leading-[1.15] tracking-tight">
                 Empowering your career journey with <span className="text-emerald-300">precision.</span>
               </h2>
            </div>

            <p className="text-emerald-50/70 text-base leading-relaxed max-w-sm">
              Connect with top opportunities, track applications, and take control of your professional future.
            </p>

            <div className="flex flex-col gap-4">
              {[
                'Curated career opportunities',
                'AI-optimized resume intelligence',
                'Real-time application tracking',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-400/15 text-emerald-300 flex-shrink-0">
                    <CircleCheck size={13} />
                  </div>
                  <span className="text-emerald-50/90 text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
          </div>

          <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-7 border border-white/10 space-y-4">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => <StarIcon key={i} />)}
            </div>
            <p className="text-white/90 font-normal text-[15px] leading-relaxed">
              "Transformed my job search from overwhelming to highly strategic. Incredible platform."
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-300 text-xs font-bold">
                SA
              </div>
              <p className="text-xs font-medium text-emerald-50/60">
                Senior Systems Architect
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right: Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_40px_-8px_rgba(15,23,42,0.08)] p-8 sm:p-10 space-y-8">

          {/* Logo for mobile */}
          <Link to="/" className="lg:hidden inline-block no-underline" aria-label="Velaivaaipu home">
            <img src="/velaivaaipu-logo.png" alt="Velaivaaipu" className="h-9 w-auto object-contain" />
          </Link>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-slate-500 text-sm">
              Sign in to continue to your career dashboard.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-xl border-rose-100 bg-rose-50 py-3">
              <AlertDescription className="text-sm font-medium text-rose-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium text-slate-700">Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="name@organization.com"
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
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-sm font-medium text-slate-700">Password</FormLabel>
                      <Link to="/forgot-password" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...field}
                          className="h-11 pl-10 pr-11 rounded-lg border-slate-200 bg-white focus-visible:border-emerald-400 focus-visible:ring-emerald-100 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs font-medium text-rose-500" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg text-sm font-semibold transition-all shadow-sm bg-emerald-700 text-white hover:bg-emerald-800"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Form>

          {/* Social Logins */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or continue with</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google?role=${selectedRole}`}
                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-700"
              >
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-4 h-4" />
                Google
              </button>
              <button
                onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/github?role=${selectedRole}`}
                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-700"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#334155"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500">
            New to the platform?{' '}
            <Link to="/register" className="text-emerald-700 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
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

export default LoginPage;
