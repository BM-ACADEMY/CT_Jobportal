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
    <div className="min-h-screen flex bg-background">

      {/* ─── Left Decorative Panel ─── */}
      <div className="hidden lg:flex w-[45%] flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-600">
        {/* Background decorative elements */}
        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -left-16 w-[350px] h-[350px] rounded-full bg-white/5" />

        <div className="flex flex-col justify-between p-12 w-full relative z-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
              <span className="text-blue-600 font-black text-lg">N</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tighter">naukri</span>
          </Link>

          {/* Main Content */}
          <div>
            <p className="text-blue-300 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
              INDIA'S #1 JOB PORTAL
            </p>
            <h2 className="text-white font-black text-4xl xl:text-5xl leading-tight mb-6">
              Your next big<br />career move<br />
              <span className="text-blue-300">starts here.</span>
            </h2>
            <p className="text-blue-100/80 text-base font-medium leading-relaxed mb-10 max-w-xs">
              Join 50L+ professionals who found their dream jobs. Get AI-powered recommendations tailored just for you.
            </p>

            <div className="flex flex-col gap-4">
              {[
                { icon: <Briefcase size={16} />, text: 'Access 2L+ curated job listings' },
                { icon: <Building2 size={16} />, text: 'Connect with 10K+ top companies' },
                { icon: <TrendingUp size={16} />, text: 'AI-powered job recommendations' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-blue-100/90 text-sm font-bold">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 shadow-xl">
            <div className="flex gap-0.5 mb-3">
              {[1,2,3,4,5].map(i => <StarIcon key={i} />)}
            </div>
            <p className="text-white font-bold text-sm leading-relaxed mb-2">
              "Got 5 interview calls within a week of uploading my resume!"
            </p>
            <p className="text-blue-300 text-xs font-black uppercase tracking-wider">
              — Rohan K., Software Engineer at Amazon
            </p>
          </div>
        </div>
      </div>

      {/* ─── Right: Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-sm">

          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-10 no-underline">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-black text-base">N</span>
            </div>
            <span className="text-primary font-black text-2xl tracking-tighter">naukri</span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">
              Welcome back 👋
            </h1>
            <p className="text-muted-foreground text-sm font-bold">
              Sign in to continue your job search
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 rounded-2xl border-destructive/20 bg-destructive/5 py-4">
              <AlertDescription className="text-xs font-bold font-sans">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                        <Input 
                          placeholder="Email address" 
                          {...field} 
                          className="h-14 pl-12 rounded-2xl border-border bg-muted/20 focus:bg-background transition-all font-bold text-sm"
                        />
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
                          placeholder="Password" 
                          {...field} 
                          className="h-14 pl-12 pr-12 rounded-2xl border-border bg-muted/20 focus:bg-background transition-all font-bold text-sm"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px] font-bold" />
                  </FormItem>
                )}
              />

              <div className="text-right">
                <Link to="/forgot-password" size="sm" className="text-xs font-black text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 rounded-2xl text-base font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground font-bold mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-black hover:underline">
              Create one free
            </Link>
          </p>

          {/* Social Logins */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">OR CONTINUE WITH</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <button 
              onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`}
              className="flex items-center justify-center h-14 rounded-2xl border border-border bg-background hover:bg-muted transition-all"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5" />
            </button>
            <button 
              onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/github`}
              className="flex items-center justify-center h-14 rounded-2xl border border-border bg-slate-900 hover:opacity-90 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </button>
            <button 
              onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/linkedin`}
              className="flex items-center justify-center h-14 rounded-2xl border border-border bg-[#0077b5] hover:opacity-90 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </button>
          </div>

          {/* Quick Demo Logins */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">QUICK DEMO LOGIN</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 border-blue-100 dark:border-blue-900 font-black text-xs">
              Job Seeker
            </Button>
            <Button variant="outline" className="h-12 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100 dark:border-emerald-900 font-black text-xs">
              Recruiter
            </Button>
          </div>
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
