import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Users, CalendarCheck } from 'lucide-react';
import { AuthShell, AuthPanel, PanelAccent, PanelSteps, AuthHeading, AuthAlert, TextLink } from '@/components/auth/AuthShell';
import { AccountTabs, SignInForm, useBotCheck } from './Login';

const STEPS = [
  { Icon: Briefcase, title: 'Post a job', text: 'Add the role, salary and location.' },
  { Icon: Users, title: 'Review applicants', text: 'Filter by skills, experience and location.' },
  { Icon: CalendarCheck, title: 'Interview and hire', text: 'Shortlist, schedule and decide with your team.' },
];

const CompanyLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bot = useBotCheck();

  const onSubmit = async (values) => {
    if (bot.missing) { setError('Please complete the "I am human" check.'); return; }
    setLoading(true);
    setError('');
    const result = await login(values.email, values.password, bot.botToken);
    setLoading(false);
    if (!result.success) bot.reset();
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
      id="company-login"
      panel={
        <AuthPanel
          tone="navy"
          eyebrow="For employers"
          title={<>Hire <PanelAccent tone="navy">local</PanelAccent> talent faster.</>}
          text="Candidates from Tamil Nadu and Puducherry, in one hiring dashboard."
        >
          <PanelSteps steps={STEPS} />
        </AuthPanel>
      }
    >
      <AuthHeading title="Company sign in">Open your hiring dashboard.</AuthHeading>
      <AccountTabs active="company" />
      <AuthAlert>{error}</AuthAlert>
      <SignInForm
        emailLabel="Company email"
        emailPlaceholder="hr@yourcompany.com"
        buttonText="Sign in to dashboard"
        onSubmit={onSubmit}
        loading={loading}
      >
        {bot.widget}
      </SignInForm>
      <p className="mt-6 text-center text-sm text-zinc-500 m-0">
        New company? <TextLink to="/register?role=company">Register to post jobs</TextLink>
      </p>
    </AuthShell>
  );
};

export default CompanyLogin;
