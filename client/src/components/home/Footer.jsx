import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import { ADDRESS, PHONE, EMAIL, SOCIALS } from '@/components/common/brandContact';
import { T } from '@/i18n/LanguageContext';

const PLATFORM = [{ to: '/jobs', label: 'Find Jobs' }, { to: '/companies', label: 'Companies' }, { to: '/register', label: 'Post a Job' }, { to: '/plans', label: 'Plans & Pricing' }, { to: '/how-it-works', label: 'How It Works' }, { to: '/contact', label: 'Contact Us' }];
const ACCOUNT = [{ to: '/login', label: 'Job Seeker Login' }, { to: '/company-login', label: 'Company Login' }, { to: '/register', label: 'Create Account' }];

const LinkColumn = ({ title, links }) => (
  <div>
    <p className="text-xs font-bold text-[#10213D] uppercase tracking-[0.2em] mb-5"><T k={'lbl.' + title}>{title}</T></p>
    <ul className="space-y-3">
      {links.map(link => (
        <li key={link.label}>
          <Link to={link.to} className="text-zinc-600 text-sm font-medium hover:text-[#34B678] transition-colors"><T k={'lbl.' + link.label}>{link.label}</T></Link>
        </li>
      ))}
    </ul>
  </div>
);

// Same wave-line motif as the recruiter CTA, in brand green on the light footer.
const FooterWaves = () => (
  <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 1000 300" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="footer-wave-fade" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#34B678" stopOpacity="0" />
        <stop offset="0.4" stopColor="#34B678" stopOpacity="0.35" />
        <stop offset="1" stopColor="#34B678" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    {Array.from({ length: 12 }, (_, i) => (
      <path
        key={i}
        d={`M0 ${200 + i * 6} C 220 ${120 + i * 8}, 420 ${300 - i * 4}, 640 ${150 + i * 5} S 900 ${40 + i * 6}, 1000 ${60 + i * 5}`}
        stroke="url(#footer-wave-fade)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    ))}
  </svg>
);

const Footer = () => (
  <footer className="relative overflow-hidden bg-[#f4faf7] border-t border-emerald-100 pt-16 pb-8 px-6">
    <FooterWaves />
    <div className="relative max-w-6xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-12 mb-14">
        <div className="col-span-2 lg:col-span-4">
          <Link to="/" className="group inline-block mb-5" aria-label="Velaivaaipu home">
            <BrandLogo className="w-36" />
          </Link>
          <p className="text-zinc-600 text-sm font-medium leading-relaxed max-w-xs">
            India's most trusted job portal connecting visionary companies with exceptional talent across the nation.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {SOCIALS.map(({ label, href, icon: Icon, bg }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Velaivaaipu on ${label}`}
                className={`w-10 h-10 rounded-xl ${bg} text-white flex items-center justify-center shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34B678] focus-visible:ring-offset-2`}
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 lg:col-start-6"><LinkColumn title="Platform" links={PLATFORM} /></div>
        <div className="lg:col-span-2"><LinkColumn title="Account" links={ACCOUNT} /></div>
        <div className="col-span-2 lg:col-span-3">
          <p className="text-xs font-bold text-[#10213D] uppercase tracking-[0.2em] mb-5"><T k="lbl.Contact">Contact</T></p>
          <ul className="space-y-4 text-sm font-medium text-zinc-600">
            <li className="flex items-start gap-3">
              <span className="w-8 h-8 shrink-0 rounded-lg bg-white border border-emerald-100 text-[#34B678] flex items-center justify-center"><MapPin size={16} /></span>
              <address className="not-italic leading-relaxed">{ADDRESS}</address>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-8 h-8 shrink-0 rounded-lg bg-white border border-emerald-100 text-[#34B678] flex items-center justify-center"><Phone size={16} /></span>
              <a href={PHONE.href} className="hover:text-[#34B678] transition-colors">{PHONE.label}</a>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-8 h-8 shrink-0 rounded-lg bg-white border border-emerald-100 text-[#34B678] flex items-center justify-center"><Mail size={16} /></span>
              <a href={`mailto:${EMAIL}`} className="hover:text-[#34B678] transition-colors break-all">{EMAIL}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-emerald-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-zinc-500 text-xs font-semibold">© {new Date().getFullYear()} Velaivaaipu. All Rights Reserved.</p>
        <p className="text-zinc-500 text-xs mt-1">Velaivaaipu is a private job platform. It is not a government website or the Tamil Nadu employment exchange.</p>
        <div className="flex gap-6">
          <Link to="/privacy-policy" className="text-slate-600 text-xs font-semibold hover:text-slate-400 transition-colors">Privacy Policy</Link>
          <Link to="/delete-account" className="text-slate-600 text-xs font-semibold hover:text-slate-400 transition-colors">Delete Account</Link>
          <Link to="/refund-policy" className="text-slate-600 text-xs font-semibold hover:text-slate-400 transition-colors">Refund Policy</Link>
          <Link to="/terms" className="text-slate-600 text-xs font-semibold hover:text-slate-400 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
