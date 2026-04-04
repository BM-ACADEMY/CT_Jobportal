import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Form, Input, Button, Alert } from 'antd';
import { Eye, EyeOff, Mail, Lock, Briefcase, Building2, TrendingUp, CheckCircle } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    const result = await login(values.email, values.password);
    setLoading(false);
    if (result.success) {
      navigate(result.redirect);
    } else {
      setError(result.msg);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ─── Left Decorative Panel ─── */}
      <div className="hidden lg:flex w-[45%] flex-shrink-0 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 50%, #4f46e5 100%)' }}>
        {/* Background circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        {/* Inner content with proper padding */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px', width: '100%', position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#1d4ed8', fontWeight: 900, fontSize: '18px' }}>N</span>
            </div>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '22px', letterSpacing: '-0.5px' }}>naukri</span>
          </Link>

          {/* Main Content */}
          <div>
            <p style={{ color: 'rgba(147,197,253,1)', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
              INDIA'S #1 JOB PORTAL
            </p>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '38px', lineHeight: 1.2, marginBottom: '20px' }}>
              Your next big<br />career move<br />
              <span style={{ color: '#93c5fd' }}>starts here.</span>
            </h2>
            <p style={{ color: 'rgba(191,219,254,0.9)', fontSize: '15px', fontWeight: 500, lineHeight: 1.7, marginBottom: '36px', maxWidth: '340px' }}>
              Join 50L+ professionals who found their dream jobs. Get AI-powered recommendations tailored just for you.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { icon: <Briefcase size={16} />, text: 'Access 2L+ curated job listings' },
                { icon: <Building2 size={16} />, text: 'Connect with 10K+ top companies' },
                { icon: <TrendingUp size={16} />, text: 'AI-powered job recommendations' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93c5fd', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <span style={{ color: 'rgba(191,219,254,0.9)', fontSize: '14px', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '10px' }}>
              {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#fbbf24', fontSize: '14px' }}>★</span>)}
            </div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px', lineHeight: 1.6, marginBottom: '8px' }}>
              "Got 5 interview calls within a week of uploading my resume!"
            </p>
            <p style={{ color: 'rgba(147,197,253,0.8)', fontSize: '12px', fontWeight: 600 }}>
              — Rohan K., Software Engineer at Amazon
            </p>
          </div>
        </div>
      </div>

      {/* ─── Right: Form Panel ─── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Mobile Logo */}
          <Link to="/" style={{ display: 'none', alignItems: 'center', gap: '8px', marginBottom: '32px', textDecoration: 'none' }} className="lg:hidden flex">
            <div style={{ width: '36px', height: '36px', background: '#1d4ed8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '16px' }}>N</span>
            </div>
            <span style={{ color: '#1d4ed8', fontWeight: 900, fontSize: '22px' }}>naukri</span>
          </Link>

          {/* Heading */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontWeight: 900, fontSize: '28px', color: '#111827', marginBottom: '6px', letterSpacing: '-0.5px' }}>
              Welcome back 👋
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500 }}>
              Sign in to continue your job search
            </p>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
              style={{ marginBottom: '20px', borderRadius: '10px' }}
            />
          )}

          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>

            <Form.Item
              name="email"
              style={{ marginBottom: '16px' }}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Enter a valid email' },
              ]}
            >
              <Input
                prefix={<Mail size={16} style={{ color: '#9ca3af', marginRight: '8px' }} />}
                placeholder="Email address"
                style={{ height: '48px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', fontWeight: 500 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              style={{ marginBottom: '8px' }}
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<Lock size={16} style={{ color: '#9ca3af', marginRight: '8px' }} />}
                placeholder="Password"
                style={{ height: '48px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', fontWeight: 500 }}
                iconRender={v => v ? <EyeOff size={16} style={{ color: '#9ca3af' }} /> : <Eye size={16} style={{ color: '#9ca3af' }} />}
              />
            </Form.Item>

            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <Link to="/forgot-password" style={{ fontSize: '13px', fontWeight: 600, color: '#1d4ed8' }}>
                Forgot password?
              </Link>
            </div>

            <Form.Item style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: '48px', borderRadius: '10px', fontSize: '15px', fontWeight: 700, border: 'none', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', fontWeight: 500, marginBottom: '24px' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#1d4ed8', fontWeight: 700 }}>
              Create one free
            </Link>
          </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>QUICK DEMO LOGIN</span>
            <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              Job Seeker
            </button>
            <button style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #dcfce7', background: '#f0fdf4', color: '#15803d', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              Recruiter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
