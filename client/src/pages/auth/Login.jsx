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
  const [selectedRole, setSelectedRole] = useState('jobseeker');

  const isRecruiter = selectedRole === 'recruiter' || selectedRole === 'company';

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
    <div className="min-h-screen flex bg-white">

      {/* ─── Left Panel ─── */}
      <div
        className={`hidden lg:flex w-[40%] flex-shrink-0 relative overflow-hidden flex-col justify-between p-16 transition-all duration-700
          ${isRecruiter ? 'bg-[#064e3b]' : 'bg-[#064e3b]'}`}
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/[0.03] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/[0.03] translate-y-1/3 -translate-x-1/4" />

        <div className="flex flex-col justify-between h-full relative z-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <span className={`font-bold text-lg text-emerald-600`}>N</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tighter">naukri</span>
          </Link>

          <div className="space-y-8">
            <div className="space-y-2">
               <p className={`font-bold text-[10px] uppercase tracking-[0.3em] text-emerald-400`}>
                 {isRecruiter ? 'Enterprise Solutions' : 'Career Intelligence'}
               </p>
               <h2 className="text-white font-bold text-4xl leading-tight">
                 {isRecruiter ? (
                   <>Accelerate your<br />organizational growth with<br /><span className="text-emerald-400">elite talent.</span></>
                 ) : (
                   <>Engineer your<br />professional future<br /><span className="text-emerald-400">with precision.</span></>
                 )}
               </h2>
            </div>
            
            <p className="text-slate-400 text-base font-medium leading-relaxed max-w-sm">
              {isRecruiter
                ? 'Leverage AI-driven matching and streamlined pipeline management tools.'
                : 'Access exclusive opportunities and data-driven career insights tailored for you.'}
            </p>

            <div className="flex flex-col gap-4">
              {(isRecruiter ? [
                'Unlimited verified job postings',
                'Advanced candidate matching AI',
                'Strategic recruitment analytics',
              ] : [
                'Curated career opportunities',
                'AI-optimized resume intelligence',
                'Real-time application tracking',
              ]).map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400`}>
                    <CircleCheck size={12} />
                  </div>
                  <span className="text-slate-300 text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-sm rounded-[24px] p-8 border border-white/5 space-y-4">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => <StarIcon key={i} />)}
            </div>
            <div className="space-y-1">
               <p className="text-white font-medium text-sm leading-relaxed italic">
                 {isRecruiter
                   ? '"The quality of candidates and the ease of use are unparalleled in the industry."'
                   : '"Transformed my job search from overwhelming to highly strategic. Incredible platform."'}
               </p>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                 {isRecruiter
                   ? 'Talent Lead, Microsoft'
                   : 'Senior Systems Architect'}
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right: Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-10">

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Authentication
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Access your {isRecruiter ? 'hiring' : 'career'} control center.
            </p>
          </div>

          {/* Role Toggle */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
            {[
              { key: 'jobseeker', label: 'Seeker', Icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { key: 'recruiter', label: 'Recruiter', Icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { key: 'company', label: 'Company', Icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map(role => {
              const active = selectedRole === role.key;
              return (
                <button
                  key={role.key}
                  onClick={() => setSelectedRole(role.key)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-300 text-[11px] font-bold uppercase tracking-tight
                    ${active ? `bg-white shadow-sm border border-slate-100 ${role.color}` : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <role.Icon size={14} />
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-xl border-rose-100 bg-rose-50/50 py-3">
              <AlertDescription className="text-xs font-bold text-rose-600">
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
                    <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <Input 
                          placeholder="name@organization.com" 
                          {...field} 
                          className="h-12 pl-11 rounded-xl border-slate-200 bg-white focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold text-rose-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</FormLabel>
                      <Link to="/forgot-password" size="sm" className="text-[10px] font-bold text-emerald-600 hover:underline uppercase tracking-tight">
                        Reset
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••" 
                          {...field} 
                          className="h-12 pl-11 pr-11 rounded-xl border-slate-200 bg-white focus:border-emerald-300 focus:ring-emerald-100 transition-all font-medium text-sm"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold text-rose-500" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={loading}
                className={`w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm
                  bg-slate-900 text-white hover:bg-emerald-600`}
              >
                {loading ? 'Processing...' : 'Authorize Access'}
              </Button>
            </form>
          </Form>

          {/* Social Logins */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">External Identity</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`}
                className="flex items-center justify-center h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-4 h-4 opacity-70" />
              </button>
              <button 
                onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/github`}
                className="flex items-center justify-center h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#64748b"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </button>
              <button 
                onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/linkedin`}
                className="flex items-center justify-center h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0077b5"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 font-medium">
            New to the platform?{' '}
            <Link to="/register" className="text-emerald-600 font-bold hover:underline uppercase tracking-tight">
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
