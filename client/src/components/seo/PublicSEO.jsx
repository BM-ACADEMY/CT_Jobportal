import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import SEOHead from './SEOHead';

const year = new Date().getFullYear();
const baseSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://velaivaaipu.in/#organization',
  name: 'Velaivaaipu',
  url: 'https://velaivaaipu.in',
};

const META = {
  '/': [`Jobs in Tamil Nadu ${year} — Apply Free | Velaivaaipu`, 'Find verified jobs across Tamil Nadu. Free resume builder, skill tests and 1-minute apply. Trusted by companies and colleges statewide.'],
  '/companies': ['Top Companies Hiring in Tamil Nadu | Velaivaaipu', 'Browse verified companies hiring across Tamil Nadu. See openings, company profiles and apply directly. Updated daily.'],
  '/contact': ['Contact Velaivaaipu — Jobs & Hiring Support', 'Contact Velaivaaipu for job posting, hiring support, campus drives and account assistance. Get 24/7 support via WhatsApp or email in Tamil and English.'],
  '/how-it-works': ['How Velaivaaipu Works — Apply, Hire, Place', 'See how job seekers apply free, companies unlock verified candidates and colleges run campus drives — explained step by step.'],
  '/terms': ['Terms & Conditions | Velaivaaipu', 'Read the terms and conditions for using the Velaivaaipu job and hiring platform.'],
  '/blog': ['Career Guides & Job Search Tips | Velaivaaipu', 'Practical job search, fresher, private-sector and work-from-home career guides for Tamil Nadu and Puducherry.'],
};

const PublicSEO = () => {
  const location = useLocation();
  const value = useMemo(() => {
    if (location.pathname.startsWith('/blog/')) return null;
    if (location.pathname.startsWith('/job/')) return null;
    // Jobs owns its metadata because the live result count is only available there.
    if (location.pathname === '/jobs' || location.pathname.startsWith('/jobs/')) return null;
    return META[location.pathname] || ['Velaivaaipu — Jobs in Tamil Nadu', 'Find verified jobs, companies and career resources across Tamil Nadu on Velaivaaipu.'];
  }, [location.pathname]);

  if (!value) return null;
  return <SEOHead title={value[0]} description={value[1]} path={location.pathname} schema={baseSchema} />;
};

export default PublicSEO;
