import React, { useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const SocialAuthSuccess = () => {
  const { completeSocialLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // The one-time code is in the URL fragment; it is swapped for the session token here.
    const code = new URLSearchParams(location.hash.replace(/^#/, '')).get('code');
    window.history.replaceState(null, '', location.pathname);
    if (!code) { navigate('/login'); return; }
    (async () => {
      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/social-exchange`, { code });
        const { token, user: userData } = data;
        if (userData.isSocialIncomplete) {
          // Finish the profile first; the token is handed over in router state, not in the URL.
          navigate('/complete-social-profile', { state: { token } });
          return;
        }
        const result = await completeSocialLogin(token, userData);
        navigate(result.success ? result.redirect : '/login');
      } catch (err) {
        console.error('Social Login Success Component Error:', err);
        navigate('/login');
      }
    })();
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
