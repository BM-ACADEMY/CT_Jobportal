import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Form, Input, Button, Alert } from 'antd';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, Briefcase, Building2, ShieldCheck } from 'lucide-react';

const RegisterPage = () => {
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('jobseeker');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form] = Form.useForm();
  const [timer, setTimer] = useState(0);

  // 'form' | 'otp'
  const [step, setStep] = useState('form');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState('');

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

  const isRecruiter = selectedRole === 'recruiter';

  const onFinish = async (values) => {
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

  const accentColor = isRecruiter ? '#16a34a' : '#1d4ed8';
  const gradientStyle = isRecruiter
    ? 'linear-gradient(145deg, #14532d 0%, #166534 50%, #15803d 100%)'
    : 'linear-gradient(145deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)';

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ─── Left Panel ─── */}
      <div
        className="hidden lg:flex"
        style={{
          width: '42%',
          flexShrink: 0,
          background: gradientStyle,
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px 48px',
          transition: 'background 0.5s ease',
        }}
      >
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: accentColor, fontWeight: 900, fontSize: '18px' }}>N</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: '22px', letterSpacing: '-0.5px' }}>naukri</span>
        </Link>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(167,243,208,0.9)', fontWeight: 700, fontSize: '11px', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '16px' }}>
            {isRecruiter ? 'FOR EMPLOYERS' : 'FOR JOB SEEKERS'}
          </p>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '36px', lineHeight: 1.25, marginBottom: '18px' }}>
            {isRecruiter ? (
              <>Find your<br />next great<br /><span style={{ color: 'rgba(167,243,208,0.9)' }}>hire today.</span></>
            ) : (
              <>Start your<br />journey<br /><span style={{ color: 'rgba(196,181,253,0.9)' }}>with us.</span></>
            )}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', fontWeight: 500, lineHeight: 1.75, marginBottom: '32px', maxWidth: '320px' }}>
            {isRecruiter
              ? 'Post jobs for free and connect with 50L+ active job seekers across India.'
              : 'Whether you\'re looking for your next role or next hire — we\'ve got you.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={16} style={{ color: isRecruiter ? '#86efac' : '#c4b5fd', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '14px', padding: '18px 22px', border: '1px solid rgba(255,255,255,0.15)', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
            {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#fbbf24', fontSize: '13px' }}>★</span>)}
          </div>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: '13px', lineHeight: 1.6, marginBottom: '6px' }}>
            {isRecruiter
              ? '"Hired 3 engineers in under 2 weeks!"'
              : '"Found my dream job in 3 days!"'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>
            {isRecruiter
              ? '— Tech Lead, Razorpay'
              : '— Priya S., UX Designer at Swiggy'}
          </p>
        </div>
      </div>

      {/* ─── Right: Form Panel ─── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#fff', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {step === 'form' ? (
            <div className="animate-in fade-in duration-500">
              {/* Heading */}
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontWeight: 900, fontSize: '26px', color: '#111827', marginBottom: '6px', letterSpacing: '-0.5px' }}>
                  Create your account
                </h1>
                <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500 }}>
                  Join millions of professionals on Naukri
                </p>
              </div>

              {/* Role Toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                {[
                  { key: 'jobseeker', label: 'Job Seeker', desc: "I'm looking for a job", Icon: Briefcase, border: '#1d4ed8', bg: '#eff6ff', text: '#1d4ed8', checkColor: '#1d4ed8' },
                  { key: 'recruiter', label: 'Recruiter', desc: "I'm hiring talent", Icon: Building2, border: '#16a34a', bg: '#f0fdf4', text: '#15803d', checkColor: '#16a34a' },
                ].map(role => {
                  const active = selectedRole === role.key;
                  return (
                    <button
                      key={role.key}
                      onClick={() => setSelectedRole(role.key)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '16px 12px',
                        borderRadius: '12px',
                        border: `2px solid ${active ? role.border : '#e5e7eb'}`,
                        background: active ? role.bg : '#fafafa',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {active && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                          <CheckCircle size={15} style={{ color: role.checkColor }} />
                        </div>
                      )}
                      <role.Icon size={20} style={{ color: active ? role.border : '#9ca3af' }} />
                      <span style={{ fontWeight: 700, fontSize: '13px', color: active ? role.text : '#6b7280' }}>{role.label}</span>
                      <span style={{ fontWeight: 500, fontSize: '11px', color: active ? role.text : '#9ca3af', opacity: 0.8 }}>{role.desc}</span>
                    </button>
                  );
                })}
              </div>

              {error && (
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError('')}
                  style={{ marginBottom: '16px', borderRadius: '10px' }}
                />
              )}

              <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>

                <Form.Item
                  name="name"
                  style={{ marginBottom: '14px' }}
                  rules={[{ required: true, message: 'Please enter your full name' }]}
                >
                  <Input
                    prefix={<User size={16} style={{ color: '#9ca3af', marginRight: '8px' }} />}
                    placeholder="Full name"
                    style={{ height: '46px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', fontWeight: 500 }}
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  style={{ marginBottom: '14px' }}
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Enter a valid email' },
                    {
                      pattern: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
                      message: 'Email must be lowercase only'
                    }
                  ]}
                  normalize={(value) => value ? value.toLowerCase() : value}
                >
                  <Input
                    prefix={<Mail size={16} style={{ color: '#9ca3af', marginRight: '8px' }} />}
                    placeholder="Email address"
                    style={{ height: '46px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', fontWeight: 500 }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  style={{ marginBottom: '14px' }}
                  rules={[
                    { required: true, message: 'Please enter a password' },
                    { min: 6, message: 'Minimum 6 characters' },
                    {
                      pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|~`\-]).{6,}$/,
                      message: 'Must include 1 uppercase, 1 number, and 1 symbol'
                    }
                  ]}
                >
                  <Input.Password
                    prefix={<Lock size={16} style={{ color: '#9ca3af', marginRight: '8px' }} />}
                    placeholder="Create a password"
                    style={{ height: '46px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', fontWeight: 500 }}
                    iconRender={v => v ? <EyeOff size={16} style={{ color: '#9ca3af' }} /> : <Eye size={16} style={{ color: '#9ca3af' }} />}
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  style={{ marginBottom: '16px' }}
                  rules={[
                    { required: true, message: 'Please confirm your password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                        return Promise.reject(new Error('Passwords do not match'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<Lock size={16} style={{ color: '#9ca3af', marginRight: '8px' }} />}
                    placeholder="Confirm password"
                    style={{ height: '46px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', fontWeight: 500 }}
                    iconRender={v => v ? <EyeOff size={16} style={{ color: '#9ca3af' }} /> : <Eye size={16} style={{ color: '#9ca3af' }} />}
                  />
                </Form.Item>

                <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500, lineHeight: 1.6, marginBottom: '18px' }}>
                  By creating an account, you agree to our{' '}
                  <a href="#" style={{ color: '#1d4ed8' }}>Terms of Service</a> and{' '}
                  <a href="#" style={{ color: '#1d4ed8' }}>Privacy Policy</a>.
                </p>

                <Form.Item style={{ marginBottom: '16px' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{
                      height: '48px',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 700,
                      border: 'none',
                      background: accentColor,
                      boxShadow: `0 4px 14px ${isRecruiter ? 'rgba(22,163,74,0.3)' : 'rgba(29,78,216,0.3)'}`,
                    }}
                  >
                    {loading ? 'Processing...' : `Create ${isRecruiter ? 'Recruiter' : 'Job Seeker'} Account`}
                  </Button>
                </Form.Item>
              </Form>

              <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', fontWeight: 500, marginBottom: '24px' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#1d4ed8', fontWeight: 700 }}>
                  Sign in
                </Link>
              </p>

              {/* Social Logins */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
                <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>OR SIGN UP WITH</span>
                <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {/* Google */}
                <button 
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
                    borderRadius: '12px', border: '1.5px solid #f3f4f6', background: '#fff', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                >
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" style={{ width: '20px' }} />
                </button>

                {/* GitHub */}
                <button 
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/github`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
                    borderRadius: '12px', border: '1.5px solid #f3f4f6', background: '#111827', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </button>

                {/* LinkedIn */}
                <button 
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/linkedin`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
                    borderRadius: '12px', border: '1.5px solid #f3f4f6', background: '#0077b5', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-500" style={{ display: 'flex', flexDirection: 'column', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                <ShieldCheck size={32} color="#2563eb" />
              </div>

              <div style={{ marginBottom: '36px' }}>
                <h1 style={{ fontWeight: 900, fontSize: '32px', color: '#111827', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                  Verify email
                </h1>
                <p style={{ color: '#6b7280', fontSize: '15px', fontWeight: 500, lineHeight: 1.6 }}>
                  We've sent a 6-digit code to <br className="hidden md:block"/>
                  <span style={{ fontWeight: 700, color: '#1f2937' }}>{registeredEmail}</span>
                </p>
              </div>
              
              {error && (
                <Alert message={error} type="error" showIcon style={{ marginBottom: '32px', borderRadius: '12px' }} />
              )}

              <div style={{ marginBottom: '40px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '16px' }}>
                  Enter 6-digit Security Code
                </label>
                <Input.OTP 
                  autoFocus
                  length={6} 
                  value={otp} 
                  onChange={setOtp} 
                  size="large"
                  style={{ width: '100%' }}
                  className="[&>input]:!h-14 [&>input]:!w-14 [&>input]:!text-xl [&>input]:!font-bold [&>input]:!border-gray-200 [&>input]:!rounded-xl flex justify-between"
                  onComplete={handleVerifyOtp}
                />
              </div>

              <Button 
                type="primary" 
                block 
                onClick={handleVerifyOtp} 
                loading={loading}
                style={{
                  height: '56px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: 'none',
                  background: '#2563eb',
                  boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
                  marginBottom: '24px'
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>

              <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                Didn't receive the code?{' '}
                <button 
                  onClick={handleResend}
                  disabled={timer > 0 || resending}
                  style={{ 
                    color: timer > 0 || resending ? '#9ca3af' : '#2563eb', 
                    fontWeight: 700, 
                    background: 'none', 
                    border: 'none', 
                    cursor: timer > 0 || resending ? 'not-allowed' : 'pointer', 
                    padding: 0 
                  }}
                >
                  {resending ? 'Sending...' : timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code'}
                </button>
              </p>

              <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', fontWeight: 500, marginTop: '16px' }}>
                Wrong email?{' '}
                <button onClick={() => setStep('form')} style={{ color: '#2563eb', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Go back
                </button>
              </p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
