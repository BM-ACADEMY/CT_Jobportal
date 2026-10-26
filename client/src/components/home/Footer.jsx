import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';

// Brand glyphs (lucide dropped its brand icons). Facebook/YouTube paths from Simple Icons.
const InstagramIcon = props => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4.3" />
    <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
const FacebookIcon = props => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
  </svg>
);
const YouTubeIcon = props => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/velaivaaipu_/', icon: InstagramIcon, bg: 'bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61594638677591', icon: FacebookIcon, bg: 'bg-[#1877F2]' },
  { label: 'YouTube', href: 'https://www.youtube.com/@velaivaaipuu', icon: YouTubeIcon, bg: 'bg-[#FF0000]' },
];

const PLATFORM = [{ to: '/jobs', label: 'Find Jobs' }, { to: '/companies', label: 'Companies' }, { to: '/register', label: 'Post a Job' }, { to: '/how-it-works', label: 'How It Works' }, { to: '/contact', label: 'Contact Us' }];
const ACCOUNT = [{ to: '/login', label: 'Job Seeker Login' }, { to: '/company-login', label: 'Company Login' }, { to: '/register', label: 'Create Account' }];

const LinkColumn = ({ title, links }) => (
  <div>
    <p className="text-xs font-bold text-[#10213D] uppercase tracking-[0.2em] mb-5">{title}</p>
    <ul className="space-y-3">
      {links.map(link => (
        <li key={link.label}>
          <Link to={link.to} className="text-zinc-600 text-sm font-medium hover:text-[#34B678] transition-colors">{link.label}</Link>
        </li>
      ))}
    </ul>
  </div>
);

const ADDRESS = 'First Floor, 78, Lenin St, Kuyavarpalayam, Puducherry – 605013.';
const PHONE = { label: '+91 99449 40051', href: 'tel:+919944940051' };
const EMAIL = 'hello@velaivaaipu.in';

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
          <p className="text-xs font-bold text-[#10213D] uppercase tracking-[0.2em] mb-5">Contact</p>
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
        <div className="flex gap-6">
          <Link to="/privacy-policy" className="text-slate-600 text-xs font-semibold hover:text-slate-400 transition-colors">Privacy Policy</Link>
          <Link to="/refund-policy" className="text-slate-600 text-xs font-semibold hover:text-slate-400 transition-colors">Refund Policy</Link>
          <Link to="/terms" className="text-slate-600 text-xs font-semibold hover:text-slate-400 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
