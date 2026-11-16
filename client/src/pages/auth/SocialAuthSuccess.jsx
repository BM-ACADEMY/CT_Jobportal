import React, { useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import WaveLines from '@/components/common/WaveLines';

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
    <div className="relative min-h-screen bg-[#f4faf7] flex items-center justify-center px-4">
      <WaveLines id="social-auth-waves" />
      <div className="relative w-full max-w-sm rounded-[2rem] bg-white ring-1 ring-zinc-200/80 shadow-[0_40px_90px_-50px_rgba(16,33,61,0.5)] px-8 py-10 text-center">
        <BrandLogo className="w-24 mx-auto" />
        <Loader2 size={36} className="mt-8 mx-auto text-[#34B678] animate-spin" />
        <p className="mt-4 text-lg font-bold text-[#10213D] m-0">Signing you in…</p>
        <p className="mt-1 text-sm text-zinc-500 m-0">This takes a few seconds.</p>
      </div>
    </div>
  );
};

export default SocialAuthSuccess;
