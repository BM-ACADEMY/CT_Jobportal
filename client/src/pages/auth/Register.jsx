import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Form, Input, Button, Alert } from 'antd';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, Briefcase, Building2 } from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('jobseeker');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form] = Form.useForm();

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
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: accentColor, fontWeight: 900, fontSize: '18px' }}>N</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: '22px', letterSpacing: '-0.5px' }}>naukri</span>
        </Link>

        {/* Middle content */}
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

        {/* Bottom testimonial */}
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
              ]}
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
                {loading ? 'Creating Account...' : `Create ${isRecruiter ? 'Recruiter' : 'Job Seeker'} Account`}
              </Button>
            </Form.Item>
          </Form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#1d4ed8', fontWeight: 700 }}>
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
