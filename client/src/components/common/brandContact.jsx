import React from 'react';

// One source for Velaivaaipu's contact details and social links (used by the footer and /contact).

export const ADDRESS = 'First Floor, 78, Lenin St, Kosapalayam, Puducherry – 605013.';
export const PHONE = { label: '+91 99449 40051', href: 'tel:+919944940051' };
export const EMAIL = 'hello@velaivaaipu.in';
export const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent('78, Lenin St, Kosapalayam, Puducherry 605013')}&output=embed`;
export const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('78, Lenin St, Kosapalayam, Puducherry 605013')}`;

// Brand glyphs (lucide dropped its brand icons). Facebook/YouTube paths from Simple Icons.
export const InstagramIcon = props => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4.3" />
    <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
export const FacebookIcon = props => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
  </svg>
);
export const YouTubeIcon = props => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/velaivaaipu_/', icon: InstagramIcon, bg: 'bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61594638677591', icon: FacebookIcon, bg: 'bg-[#1877F2]' },
  { label: 'YouTube', href: 'https://www.youtube.com/@velaivaaipuu', icon: YouTubeIcon, bg: 'bg-[#FF0000]' },
];
