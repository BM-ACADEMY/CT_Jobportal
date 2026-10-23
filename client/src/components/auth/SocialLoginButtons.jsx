import React from 'react';

// Social sign-in links. They go to the API, which redirects to the provider and back to
// /social-auth-success. Only the four public roles are accepted by the server.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path fill="#fff" d="M6.94 9.5H4.1V19h2.84V9.5zM5.52 5a1.65 1.65 0 100 3.3 1.65 1.65 0 000-3.3zM19.9 13.6c0-2.6-1.4-4.3-3.6-4.3-1.2 0-2 .6-2.4 1.2V9.5h-2.8V19h2.8v-5.2c0-1.4.7-2.2 1.8-2.2 1.1 0 1.6.8 1.6 2.2V19h2.6v-5.4z" />
  </svg>
);

const buttonClass =
  'flex w-full items-center justify-center gap-3 h-11 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50';

const SocialLoginButtons = ({ role = 'jobseeker' }) => {
  const query = `?role=${encodeURIComponent(role)}`;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or continue with
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <a href={`${API_BASE}/auth/linkedin${query}`} className={buttonClass}>
        <LinkedInIcon /> Continue with LinkedIn
      </a>
      <a href={`${API_BASE}/auth/google${query}`} className={buttonClass}>
        <GoogleIcon /> Continue with Google
      </a>
    </div>
  );
};

export default SocialLoginButtons;
