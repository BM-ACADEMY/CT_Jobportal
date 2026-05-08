import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Building2, CircleCheck, ArrowLeft } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  email: z.string().email({ message: "Enter a valid corporate email" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const CompanyLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    setError('');
    // We force role 'company' for this page if your login logic supports it, 
    // otherwise the backend should return the role based on the email.
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
    <div className="min-h-screen flex bg-background font-sans">
      {/* Left Panel: Corporate Branding */}
      <div className="hidden lg:flex w-[40%] flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 flex-col justify-between p-12 text-white">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full border-[40px] border-white" />
            <div className="absolute bottom-1/4 -left-20 w-64 h-64 rounded-full border-[20px] border-white" />
        </div>

        <Link to="/" className="flex items-center gap-3 no-underline relative z-10 group">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform">
            <span className="text-emerald-700 font-black text-lg">N</span>
          </div>
          <span className="text-white font-black text-2xl tracking-tighter">naukri <span className="text-emerald-400">Business</span></span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-5xl font-black leading-[1.1] mb-6 tracking-tight">
            Scale your <span className="text-emerald-400">engineering</span> teams faster.
          </h2>
          <p className="text-emerald-100/70 text-lg font-medium leading-relaxed mb-10 max-w-sm">
            Access India's largest pool of verified tech talent and manage your end-to-end recruitment lifecycle.
          </p>

          <div className="space-y-4">
            {[
              "Verified Professional Network",
              "AI-Powered Candidate Filtering",
              "Collaborative Hiring Workflows",
              "Real-time Analytics Dashboard"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CircleCheck size={14} className="text-emerald-400" />
                </div>
                <span className="text-emerald-50/90 text-sm font-bold">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <p className="text-sm font-bold text-emerald-100 italic">
                "This portal transformed our hiring speed by 40% in just two quarters."
            </p>
            <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-[10px] font-black uppercase">JD</div>
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-white">James Doe</p>
                    <p className="text-[10px] font-bold text-emerald-400">VP of Engineering, TechFlow</p>
                </div>
            </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/login" className="flex items-center gap-2 text-muted-foreground hover:text-emerald-600 mb-10 transition-colors font-bold text-sm">
            <ArrowLeft size={16} /> Back to standard login
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
              Company Login
            </h1>
            <p className="text-slate-500 text-sm font-bold">
              Access your corporate recruitment dashboard
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 rounded-2xl border-red-100 bg-red-50 text-red-600 py-4">
              <AlertDescription className="text-xs font-bold">
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
                  <FormItem>
                    <FormControl>
                      <div className="relative group">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                        <Input 
                          placeholder="Corporate Email" 
                          {...field} 
                          className="h-14 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-emerald-600 transition-all font-bold text-sm shadow-sm"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px] font-bold text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Password" 
                          {...field} 
                          className="h-14 pl-12 pr-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-emerald-600 transition-all font-bold text-sm shadow-sm"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px] font-bold text-red-500" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Link to="/forgot-password" size="sm" className="text-xs font-black text-emerald-700 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 rounded-2xl text-base font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                {loading ? 'Authenticating...' : 'Enter Business Portal'}
              </Button>
            </form>
          </Form>

          <div className="mt-10 pt-10 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 font-bold mb-4">
                Not a business user? <Link to="/login" className="text-primary hover:underline">Login as Job Seeker</Link>
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                <Building2 size={12} />
                For Registered Companies Only
            </div>
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

export default CompanyLogin;
