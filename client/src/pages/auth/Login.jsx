import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Building2 } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AuthShell, AuthPanel, PanelPoints, PanelImage, AuthHeading, AuthAlert,
  SubmitButton, EyeToggle, TextLink, inputCls, labelCls,
} from '@/components/auth/AuthShell';

const formSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const POINTS = [
  'Jobs from employers across Tamil Nadu and Puducherry',
  'Free skill tests with a certificate you can share',
  'Track every application in one place',
];

// Shared by the job seeker and company sign-in pages.
export const AccountTabs = ({ active }) => {
  const base = 'h-10 rounded-lg text-sm flex items-center justify-center gap-1.5 transition';
  const on = `${base} bg-white text-[#10213D] font-bold shadow-sm`;
  const off = `${base} text-zinc-500 hover:text-[#10213D] font-semibold`;
  return (
    <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1" role="tablist" aria-label="Account type">
      {active === 'user'
        ? <span role="tab" aria-selected="true" className={on}>Job seeker / Recruiter</span>
        : <Link to="/login" role="tab" aria-selected="false" className={off}>Job seeker / Recruiter</Link>}
      {active === 'company'
        ? <span role="tab" aria-selected="true" className={on}><Building2 size={15} /> Company</span>
        : <Link to="/company-login" role="tab" aria-selected="false" className={off}><Building2 size={15} /> Company</Link>}
    </div>
  );
};

// Email + password form used by both sign-in pages.
export const SignInForm = ({ emailLabel, emailPlaceholder, buttonText, onSubmit, loading }) => {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className={labelCls}>{emailLabel}</FormLabel>
              <div className="relative">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <FormControl>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder={emailPlaceholder}
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                    className={`${inputCls} pr-4`}
                  />
                </FormControl>
              </div>
              <FormMessage className="text-xs font-medium text-rose-600" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <div className="flex justify-between items-center">
                <FormLabel className={labelCls}>Password</FormLabel>
                <TextLink to="/forgot-password" className="text-xs">Forgot password?</TextLink>
              </div>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <FormControl>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...field}
                    className={`${inputCls} pr-12`}
                  />
                </FormControl>
                <EyeToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              </div>
              <FormMessage className="text-xs font-medium text-rose-600" />
            </FormItem>
          )}
        />

        <SubmitButton loading={loading} loadingText="Signing in…" className="!mt-6">{buttonText}</SubmitButton>
      </form>
    </Form>
  );
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(searchParams.get('error') || '');

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
    <AuthShell
      id="login"
      panel={
        <AuthPanel title="Your next job is one login away.">
          <PanelPoints points={POINTS} />
          <PanelImage src="/images/gir-large.webp" />
        </AuthPanel>
      }
    >
      <AuthHeading title="Sign in">Welcome back. Enter your details to continue.</AuthHeading>
      <AccountTabs active="user" />
      <AuthAlert>{error}</AuthAlert>
      <SignInForm
        emailLabel="Email address"
        emailPlaceholder="you@example.com"
        buttonText="Sign in"
        onSubmit={onSubmit}
        loading={loading}
      />
      <p className="mt-6 text-center text-sm text-zinc-500 m-0">
        Don&apos;t have an account? <TextLink to="/register">Create one free</TextLink>
      </p>
    </AuthShell>
  );
};

export default LoginPage;
