import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-slate-950 pt-20 pb-10 px-6">
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="md:col-span-2">
          <Link to="/" className="inline-block mb-5" aria-label="Velaivaaipu home">
            <img src="/velaivaaipu-logo.png" alt="Velaivaaipu" loading="lazy" decoding="async" className="h-24 w-[165px] object-contain" />
          </Link>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
            India's most trusted job portal connecting visionary companies with exceptional talent across the nation.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-5">Platform</p>
          <ul className="space-y-3">
            {[{ to: '/jobs', label: 'Find Jobs' }, { to: '/companies', label: 'Companies' }, { to: '/register', label: 'Post a Job' }, { to: '/how-it-works', label: 'How It Works' }, { to: '/contact', label: 'Contact Us' }].map(link => (
              <li key={link.label}>
                <Link to={link.to} className="text-slate-500 text-sm font-medium hover:text-emerald-400 transition-colors">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-5">Account</p>
          <ul className="space-y-3">
            {[{ to: '/login', label: 'Job Seeker Login' }, { to: '/company-login', label: 'Company Login' }, { to: '/register', label: 'Create Account' }].map(link => (
              <li key={link.label}>
                <Link to={link.to} className="text-slate-500 text-sm font-medium hover:text-emerald-400 transition-colors">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-slate-600 text-xs font-semibold">© {new Date().getFullYear()} Velaivaaipu. All Rights Reserved.</p>
        <div className="flex gap-6">
          <Link to="#" className="text-slate-600 text-xs font-semibold hover:text-slate-400 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="text-slate-600 text-xs font-semibold hover:text-slate-400 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
