import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Form, Input, Button, Alert } from 'antd';
import { Mail, KeyRound, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

const ForgotPasswordPage = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  // state: 'email' | 'otp' | 'success'
  const [step, setStep] = useState('email');
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendEmail = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      setStep('otp');
    } else {
      setError(result.msg);
    }
  };

  const handleResetPassword = async () => {
    if (otp.length !== 6 || !newPassword) {
      setError('Please provide a valid 6-digit OTP and a new password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await resetPassword(email, otp, newPassword);
    setLoading(false);

    if (result.success) {
      setStep('success');
    } else {
      setError(result.msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-[440px] rounded-[24px] shadow-sm border border-gray-100 p-8 md:p-10 relative overflow-hidden">
        
        {/* Top Decorative gradient abstract strip */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Back Button */}
        {step === 'email' && (
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors mb-8">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        )}

        {error && (
          <Alert message={error} type="error" showIcon className="mb-6 rounded-xl" closable onClose={() => setError('')} />
        )}

        {/* ── STEP 1: REQUEST EMAIL ── */}
        {step === 'email' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <KeyRound size={24} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
              No worries, we'll send you reset instructions. Enter the email associated with your account.
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Email Address</label>
                <Input 
                  size="large"
                  prefix={<Mail size={16} className="text-gray-400 mr-2" />} 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-14 rounded-xl border-gray-200 text-base"
                />
              </div>
              <Button 
                type="primary" 
                block 
                loading={loading}
                onClick={handleSendEmail}
                className="h-14 rounded-xl text-base font-bold bg-gray-900 hover:bg-gray-800 border-none shadow-lg shadow-gray-900/20"
              >
                {loading ? 'Sending...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: VERIFY AND SET NEW PASSWORD ── */}
        {step === 'otp' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} className="text-purple-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Set New Password</h1>
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
              We sent a 6-digit code to <span className="font-bold text-gray-800">{email}</span>.
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">6-Digit Code</label>
                <Input.OTP 
                  length={6} 
                  value={otp} 
                  onChange={setOtp} 
                  className="w-full flex justify-between [&>input]:!h-12 border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">New Password</label>
                <Input.Password 
                  size="large"
                  placeholder="Enter new password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="h-14 rounded-xl border-gray-200 text-base"
                />
              </div>

              <Button 
                type="primary" 
                block 
                loading={loading}
                onClick={handleResetPassword}
                className="h-14 rounded-xl text-base font-bold bg-green-600 hover:bg-green-700 border-none shadow-lg shadow-green-600/30 w-full"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
              
              <div className="text-center">
                <button 
                  onClick={() => setStep('email')} 
                  className="text-sm font-semibold text-gray-400 hover:text-gray-700 transition"
                >
                  Change Email Address
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: SUCCESS ── */}
        {step === 'success' && (
          <div className="animate-in zoom-in duration-500 text-center py-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={36} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">All done!</h1>
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8 max-w-[260px] mx-auto">
              Your password has been successfully reset. You can now use your new password to log in to your account.
            </p>
            <Button 
              type="primary" 
              block 
              onClick={() => navigate('/login')}
              className="h-14 rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 border-none shadow-lg shadow-blue-500/20 w-full flex items-center justify-center gap-2"
            >
              Continue to Login <ArrowRight size={18} />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
