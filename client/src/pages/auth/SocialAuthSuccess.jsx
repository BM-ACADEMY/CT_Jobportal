import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const SocialAuthSuccess = () => {
  const { completeSocialLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userStr = params.get('user');

    if (token && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        const result = completeSocialLogin(token, userData);
        if (result.success) {
          navigate(result.redirect);
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Social Login Success Component Error:', err);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [location, completeSocialLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-6 bg-background">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 animate-pulse" />
        <Loader2 className="w-16 h-16 text-primary animate-spin absolute top-0 left-0" />
      </div>
      <span className="text-xl font-black text-foreground tracking-tight animate-pulse">
        Completing login...
      </span>
    </div>
  );
};

export default SocialAuthSuccess;
