import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Alert, Input } from 'antd';
import { ShieldCheck, MailOpen } from 'lucide-react';

const VerifyOtpPage = () => {
  const { state } = useLocation();
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(state?.email || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(60);

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
    setSuccess('');
    
    const result = await resendOtp(email);
    setResending(false);
    
    if (result.success) {
      setSuccess('A new OTP has been sent to your email.');
      setTimer(60);
    } else {
      setError(result.msg);
    }
  };

  // No msg if standard generic route accessed
  const msg = state?.msg;

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');
    
    const result = await verifyOtp(email, otp);
    setLoading(false);

    if (result.success) {
      navigate(result.redirect);
    } else {
      setError(result.msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-[#eef2ff] p-4">
      <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl p-8 md:p-10 border border-gray-100">
        
        {/* Header Icon */}
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MailOpen size={28} className="text-blue-600" />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 tracking-tight">Verify your email</h1>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            Please enter your registered email address and the 6-digit code we sent you.
          </p>
        </div>

        {/* System Message */}
        {msg && (
          <Alert message={msg} type="info" showIcon className="mb-6 rounded-xl border-blue-100 bg-blue-50/50" />
        )}
        
        {/* Success Message */}
        {success && (
          <Alert message={success} type="success" showIcon className="mb-6 rounded-xl" />
        )}

        {/* Error Message */}
        {error && (
          <Alert message={error} type="error" showIcon className="mb-6 rounded-xl" />
        )}

        {/* Form Inputs */}
        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <Input 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              size="large"
              className="h-12 rounded-xl text-base"
              disabled={!!state?.email}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">6-digit Security Code</label>
            <Input.OTP 
              length={6} 
              value={otp} 
              onChange={setOtp} 
              size="large"
              className="w-full flex justify-between [&>input]:!h-12 border-gray-200 rounded-lg"
              onComplete={handleVerify}
            />
          </div>
        </div>

        {/* Validate Button */}
        <Button 
          type="primary" 
          block 
          onClick={handleVerify} 
          loading={loading}
          className="h-14 rounded-xl text-base font-bold tracking-wide border-none bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30"
        >
          {loading ? 'Verifying...' : 'Verify Email Address'}
        </Button>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 font-medium">
            Didn't receive the code?{' '}
            <button 
              onClick={handleResend}
              disabled={timer > 0 || resending}
              className={`font-bold hover:underline cursor-pointer bg-transparent border-none p-0 ${
                timer > 0 || resending ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'
              }`}
            >
              {resending ? 'Sending...' : timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default VerifyOtpPage;
